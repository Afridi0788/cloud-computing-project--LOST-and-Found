const { pool, query } = require('../config/db');
const { getPresignedImageUrl } = require('../config/s3');

/**
 * Submit a claim or response for an item
 * POST /api/items/:id/claim
 */
async function createClaim(req, res, next) {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }

    if (!message || message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifying details or verification message (at least 5 characters).'
      });
    }

    // 1. Fetch item
    const items = await query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = items[0];

    // 2. Prevent user from claiming their own item
    if (item.user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a claim or response for your own listing.'
      });
    }

    // 3. Prevent claim if item is already returned
    if (item.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been marked as RETURNED and is closed.'
      });
    }

    // 4. Check if user already submitted a pending claim on this item
    const existingClaims = await query(
      'SELECT id, status FROM claims WHERE item_id = ? AND claimant_id = ? AND status = "PENDING"',
      [itemId, req.user.id]
    );

    if (existingClaims.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending claim for this item. Please wait for the owner to review.'
      });
    }

    // 5. Insert claim with status PENDING
    const result = await query(
      'INSERT INTO claims (item_id, claimant_id, message, status) VALUES (?, ?, ?, "PENDING")',
      [itemId, req.user.id, message.trim()]
    );

    // Optionally update item status from OPEN to CLAIM_PENDING
    if (item.status === 'OPEN') {
      await query('UPDATE items SET status = "CLAIM_PENDING" WHERE id = ?', [itemId]);
    }

    return res.status(201).json({
      success: true,
      message: 'Your claim/response has been submitted to the listing owner.',
      claim: {
        id: result.insertId,
        item_id: itemId,
        claimant_id: req.user.id,
        message: message.trim(),
        status: 'PENDING'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all claims relevant to the logged-in user
 * Separates into 'incoming' (claims on my items) and 'outgoing' (claims I submitted)
 * GET /api/claims
 */
async function getClaims(req, res, next) {
  try {
    const userId = req.user.id;

    // Incoming claims: People claiming items posted by current user
    const incomingSql = `
      SELECT 
        c.id,
        c.item_id,
        c.claimant_id,
        c.message,
        c.status AS claim_status,
        c.created_at AS claim_date,
        i.title AS item_title,
        i.category AS item_category,
        i.type AS item_type,
        i.status AS item_status,
        i.image_key AS item_image_key,
        i.location AS item_location,
        u.name AS claimant_name,
        u.email AS claimant_email
      FROM claims c
      JOIN items i ON c.item_id = i.id
      JOIN users u ON c.claimant_id = u.id
      WHERE i.user_id = ?
      ORDER BY c.created_at DESC
    `;

    // Outgoing claims: Claims submitted by current user
    const outgoingSql = `
      SELECT 
        c.id,
        c.item_id,
        c.claimant_id,
        c.message,
        c.status AS claim_status,
        c.created_at AS claim_date,
        i.title AS item_title,
        i.category AS item_category,
        i.type AS item_type,
        i.status AS item_status,
        i.image_key AS item_image_key,
        i.location AS item_location,
        owner.name AS owner_name,
        owner.email AS owner_email
      FROM claims c
      JOIN items i ON c.item_id = i.id
      JOIN users owner ON i.user_id = owner.id
      WHERE c.claimant_id = ?
      ORDER BY c.created_at DESC
    `;

    const [incomingRows, outgoingRows] = await Promise.all([
      query(incomingSql, [userId]),
      query(outgoingSql, [userId])
    ]);

    // Attach presigned URLs for items
    const enrichWithImage = async (rows) => {
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          item_image_url: row.item_image_key ? await getPresignedImageUrl(row.item_image_key) : null
        }))
      );
    };

    const incoming = await enrichWithImage(incomingRows);
    const outgoing = await enrichWithImage(outgoingRows);

    return res.status(200).json({
      success: true,
      incoming,
      outgoing
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve or Reject a claim
 * Requires MySQL Transaction for consistency
 * Only the item owner can perform this action
 * PUT /api/claims/:id
 */
async function updateClaimStatus(req, res, next) {
  let connection;
  try {
    const claimId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(claimId)) {
      return res.status(400).json({ success: false, message: 'Invalid claim ID.' });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either APPROVED or REJECTED.'
      });
    }

    // Get a dedicated connection from pool for Transaction
    connection = await pool.getConnection();

    // Verify claim and ownership
    const [claimRows] = await connection.query(
      `SELECT c.id, c.item_id, c.claimant_id, c.status, i.user_id AS item_owner_id, i.status AS item_status
       FROM claims c
       JOIN items i ON c.item_id = i.id
       WHERE c.id = ?`,
      [claimId]
    );

    if (claimRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claim = claimRows[0];

    // Authorization: Only the owner of the item can approve/reject claims
    if (claim.item_owner_id !== req.user.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the listing owner can approve or reject claims.'
      });
    }

    // Start MySQL Transaction
    await connection.beginTransaction();

    if (status === 'APPROVED') {
      // 1. Update this claim to APPROVED
      await connection.query(
        'UPDATE claims SET status = "APPROVED" WHERE id = ?',
        [claimId]
      );

      // 2. Reject other pending claims for this item
      await connection.query(
        'UPDATE claims SET status = "REJECTED" WHERE item_id = ? AND id != ? AND status = "PENDING"',
        [claim.item_id, claimId]
      );

      // 3. Set item status to CLAIM_PENDING (awaiting physical handover)
      await connection.query(
        'UPDATE items SET status = "CLAIM_PENDING" WHERE id = ?',
        [claim.item_id]
      );
    } else {
      // Rejecting this claim
      await connection.query(
        'UPDATE claims SET status = "REJECTED" WHERE id = ?',
        [claimId]
      );

      // Check if there are any other pending or approved claims
      const [remaining] = await connection.query(
        'SELECT id FROM claims WHERE item_id = ? AND status IN ("PENDING", "APPROVED")',
        [claim.item_id]
      );

      // If no active claims left and item isn't RETURNED, revert item status to OPEN
      if (remaining.length === 0 && claim.item_status !== 'RETURNED') {
        await connection.query(
          'UPDATE items SET status = "OPEN" WHERE id = ?',
          [claim.item_id]
        );
      }
    }

    // Commit Transaction
    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: `Claim has been ${status.toLowerCase()} successfully.`,
      claimId,
      status
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
}

module.exports = {
  createClaim,
  getClaims,
  updateClaimStatus
};
