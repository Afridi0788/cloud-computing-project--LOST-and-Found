const { query } = require('../config/db');
const { uploadToS3, getPresignedImageUrl, deleteFromS3 } = require('../config/s3');

const VALID_CATEGORIES = [
  'Electronics',
  'Wallets & Bags',
  'Documents & IDs',
  'Keys',
  'Jewellery',
  'Clothing',
  'Books & Stationery',
  'Other'
];

/**
 * Get all items with optional filters
 * GET /api/items
 */
async function getItems(req, res, next) {
  try {
    const { type, category, search, status, userId } = req.query;

    let sql = `
      SELECT 
        i.id,
        i.user_id,
        i.title,
        i.description,
        i.category,
        i.type,
        i.image_key,
        i.location,
        i.item_date,
        i.status,
        i.created_at,
        u.name AS owner_name,
        u.email AS owner_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type && ['LOST', 'FOUND'].includes(type.toUpperCase())) {
      sql += ' AND i.type = ?';
      params.push(type.toUpperCase());
    }

    if (category && category !== 'All') {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    if (status && ['OPEN', 'CLAIM_PENDING', 'RETURNED'].includes(status.toUpperCase())) {
      sql += ' AND i.status = ?';
      params.push(status.toUpperCase());
    }

    if (userId) {
      sql += ' AND i.user_id = ?';
      params.push(parseInt(userId, 10));
    }

    if (search && search.trim() !== '') {
      sql += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY i.created_at DESC';

    const items = await query(sql, params);

    // Generate short-lived presigned URLs for private S3 images in parallel
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        let imageUrl = null;
        if (item.image_key) {
          imageUrl = await getPresignedImageUrl(item.image_key);
        }
        return {
          ...item,
          image_url: imageUrl
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: itemsWithUrls.length,
      items: itemsWithUrls
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single item by ID
 * GET /api/items/:id
 */
async function getItemById(req, res, next) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }

    const sql = `
      SELECT 
        i.id,
        i.user_id,
        i.title,
        i.description,
        i.category,
        i.type,
        i.image_key,
        i.location,
        i.item_date,
        i.status,
        i.created_at,
        u.name AS owner_name,
        u.email AS owner_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `;

    const items = await query(sql, [itemId]);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.'
      });
    }

    const item = items[0];
    let imageUrl = null;
    if (item.image_key) {
      imageUrl = await getPresignedImageUrl(item.image_key);
    }

    return res.status(200).json({
      success: true,
      item: {
        ...item,
        image_url: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new lost or found item
 * POST /api/items
 */
async function createItem(req, res, next) {
  try {
    const { title, description, category, type, location, item_date } = req.body;

    // Validation
    if (!title || !description || !category || !type || !location || !item_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, description, category, type, location, item_date) are required.'
      });
    }

    const itemType = type.toUpperCase();
    if (!['LOST', 'FOUND'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either LOST or FOUND.'
      });
    }

    let imageKey = null;

    // If an image was uploaded, send to S3
    if (req.file) {
      imageKey = await uploadToS3(req.file);
    }

    const sql = `
      INSERT INTO items (user_id, title, description, category, type, image_key, location, item_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `;

    const result = await query(sql, [
      req.user.id,
      title.trim(),
      description.trim(),
      category.trim(),
      itemType,
      imageKey,
      location.trim(),
      item_date
    ]);

    const createdItem = {
      id: result.insertId,
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      type: itemType,
      image_key: imageKey,
      image_url: imageKey ? await getPresignedImageUrl(imageKey) : null,
      location: location.trim(),
      item_date,
      status: 'OPEN',
      owner_name: req.user.name,
      owner_email: req.user.email
    };

    return res.status(201).json({
      success: true,
      message: 'Item posted successfully.',
      item: createdItem
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing item (Listing owner only)
 * PUT /api/items/:id
 */
async function updateItem(req, res, next) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }

    // Check item exists
    const items = await query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = items[0];

    // Authorization check: Only listing owner can edit
    if (item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can edit only your own listings.'
      });
    }

    const { title, description, category, location, item_date } = req.body;

    let imageKey = item.image_key;

    // If a new image was uploaded
    if (req.file) {
      // Delete old image if it exists
      if (item.image_key) {
        await deleteFromS3(item.image_key);
      }
      imageKey = await uploadToS3(req.file);
    }

    const updatedTitle = title !== undefined ? title.trim() : item.title;
    const updatedDesc = description !== undefined ? description.trim() : item.description;
    const updatedCat = category !== undefined ? category.trim() : item.category;
    const updatedLoc = location !== undefined ? location.trim() : item.location;
    const updatedDate = item_date !== undefined ? item_date : item.item_date;

    await query(
      `UPDATE items 
       SET title = ?, description = ?, category = ?, location = ?, item_date = ?, image_key = ? 
       WHERE id = ?`,
      [updatedTitle, updatedDesc, updatedCat, updatedLoc, updatedDate, imageKey, itemId]
    );

    const imageUrl = imageKey ? await getPresignedImageUrl(imageKey) : null;

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      item: {
        ...item,
        title: updatedTitle,
        description: updatedDesc,
        category: updatedCat,
        location: updatedLoc,
        item_date: updatedDate,
        image_key: imageKey,
        image_url: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an item (Listing owner only)
 * DELETE /api/items/:id
 */
async function deleteItem(req, res, next) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }

    const items = await query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = items[0];

    // Authorization check
    if (item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can delete only your own listings.'
      });
    }

    // Delete image from S3 if present
    if (item.image_key) {
      await deleteFromS3(item.image_key);
    }

    // Delete from MySQL (cascade will delete claims)
    await query('DELETE FROM items WHERE id = ?', [itemId]);

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark item as RETURNED (Listing owner only)
 * PUT /api/items/:id/return
 */
async function markAsReturned(req, res, next) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }

    const items = await query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = items[0];

    // Authorization check: Only listing owner can mark as returned
    if (item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the listing owner can confirm the return status.'
      });
    }

    if (item.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been marked as RETURNED.'
      });
    }

    await query('UPDATE items SET status = ? WHERE id = ?', ['RETURNED', itemId]);

    return res.status(200).json({
      success: true,
      message: 'Item has been successfully marked as RETURNED.',
      status: 'RETURNED'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  markAsReturned,
  VALID_CATEGORIES
};
