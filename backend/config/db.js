const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MySQL connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'lost_and_found_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

const pool = mysql.createPool(poolConfig);

let isDatabaseConnected = false;

// In-Memory fallback store for zero-friction local testing when MySQL is not running
const mockStore = {
  users: [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@college.edu',
      password_hash: '$2a$10$wK1Ww4KzQ6sB1i6iK2mCDezC29YJvLp5E1rB0R9nF2A5tC6yF2N6O', // Password123!
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@college.edu',
      password_hash: '$2a$10$wK1Ww4KzQ6sB1i6iK2mCDezC29YJvLp5E1rB0R9nF2A5tC6yF2N6O',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@college.edu',
      password_hash: '$2a$10$wK1Ww4KzQ6sB1i6iK2mCDezC29YJvLp5E1rB0R9nF2A5tC6yF2N6O',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  items: [
    {
      id: 1,
      user_id: 1,
      title: 'Brown Leather Fossil Wallet',
      description: 'Lost near the Central Campus Library 2nd floor reading hall. Contains student ID card and bus pass.',
      category: 'Wallets & Bags',
      type: 'LOST',
      image_key: null,
      location: 'Central Library 2nd Floor',
      item_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 2,
      user_id: 2,
      title: 'Apple AirPods Pro in White Case',
      description: 'Found on a bench outside the Computer Science department block. Slight scratch near hinge.',
      category: 'Electronics',
      type: 'FOUND',
      image_key: null,
      location: 'CS Block Lawn Bench',
      item_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 3,
      user_id: 3,
      title: 'Silver MacBook Pro 14-inch',
      description: 'Left behind in Seminar Hall 3 after the Cloud Computing guest lecture. In black sleeve.',
      category: 'Electronics',
      type: 'LOST',
      image_key: null,
      location: 'Seminar Hall 3',
      item_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 4,
      user_id: 1,
      title: 'Scientific Calculator Casio fx-991EX',
      description: 'Found on desk 42 in Engineering Mathematics Lab.',
      category: 'Electronics',
      type: 'FOUND',
      image_key: null,
      location: 'Math Lab Desk 42',
      item_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 5,
      user_id: 2,
      title: 'Titan Black Dial Wristwatch',
      description: 'Lost around the sports complex athletic track during evening football practice.',
      category: 'Jewellery',
      type: 'LOST',
      image_key: null,
      location: 'Sports Complex Track',
      item_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      status: 'RETURNED',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString()
    }
  ],
  claims: [
    {
      id: 1,
      item_id: 5,
      claimant_id: 1,
      message: 'This is my watch! It has an engraving on the back: Class of 2024. I have purchase proof.',
      status: 'APPROVED',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  nextUserId: 4,
  nextItemId: 6,
  nextClaimId: 2
};

// Initialize default password hash for mock users
(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  mockStore.users.forEach(u => u.password_hash = hash);
})();

/**
 * Execute parameterized query
 * Uses MySQL connection if available, or in-memory mock fallback
 */
async function query(sql, params = []) {
  if (isDatabaseConnected) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL query error:', err.message);
      throw err;
    }
  }

  // Fallback in-memory handler for queries
  const cleanSql = sql.replace(/\s+/g, ' ').trim();

  // Users: SELECT by email
  if (cleanSql.includes('SELECT') && cleanSql.includes('FROM users WHERE email = ?')) {
    const user = mockStore.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase());
    return user ? [user] : [];
  }

  // Users: SELECT by ID
  if (cleanSql.includes('SELECT') && cleanSql.includes('FROM users WHERE id = ?')) {
    const user = mockStore.users.find(u => u.id === Number(params[0]));
    return user ? [user] : [];
  }

  // Users: INSERT
  if (cleanSql.includes('INSERT INTO users')) {
    const newUser = {
      id: mockStore.nextUserId++,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      created_at: new Date().toISOString()
    };
    mockStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }

  // Items: SELECT single by id
  if (cleanSql.includes('SELECT') && cleanSql.includes('FROM items i') && cleanSql.includes('WHERE i.id = ?')) {
    const item = mockStore.items.find(i => i.id === Number(params[0]));
    if (!item) return [];
    const owner = mockStore.users.find(u => u.id === item.user_id) || { name: 'Unknown', email: '' };
    return [{
      ...item,
      owner_name: owner.name,
      owner_email: owner.email
    }];
  }

  // Items: SELECT * FROM items WHERE id = ?
  if (cleanSql.includes('SELECT * FROM items WHERE id = ?')) {
    const item = mockStore.items.find(i => i.id === Number(params[0]));
    return item ? [item] : [];
  }

  // Items: SELECT list with filters
  if (cleanSql.includes('SELECT') && cleanSql.includes('FROM items i JOIN users u')) {
    let filtered = [...mockStore.items];
    let paramIdx = 0;

    if (cleanSql.includes('i.type = ?')) {
      const typeVal = params[paramIdx++];
      filtered = filtered.filter(i => i.type === typeVal);
    }
    if (cleanSql.includes('i.category = ?')) {
      const catVal = params[paramIdx++];
      filtered = filtered.filter(i => i.category === catVal);
    }
    if (cleanSql.includes('i.status = ?')) {
      const statusVal = params[paramIdx++];
      filtered = filtered.filter(i => i.status === statusVal);
    }
    if (cleanSql.includes('i.user_id = ?')) {
      const uId = Number(params[paramIdx++]);
      filtered = filtered.filter(i => i.user_id === uId);
    }
    if (cleanSql.includes('i.title LIKE ?')) {
      const searchVal = String(params[paramIdx] || '').replace(/%/g, '').toLowerCase();
      paramIdx += 3;
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(searchVal) ||
        i.description.toLowerCase().includes(searchVal) ||
        i.location.toLowerCase().includes(searchVal)
      );
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered.map(item => {
      const owner = mockStore.users.find(u => u.id === item.user_id) || { name: 'User', email: '' };
      return {
        ...item,
        owner_name: owner.name,
        owner_email: owner.email
      };
    });
  }

  // Items: INSERT
  if (cleanSql.includes('INSERT INTO items')) {
    const newItem = {
      id: mockStore.nextItemId++,
      user_id: params[0],
      title: params[1],
      description: params[2],
      category: params[3],
      type: params[4],
      image_key: params[5],
      location: params[6],
      item_date: params[7],
      status: 'OPEN',
      created_at: new Date().toISOString()
    };
    mockStore.items.unshift(newItem);
    return { insertId: newItem.id, affectedRows: 1 };
  }

  // Items: UPDATE items SET title = ...
  if (cleanSql.includes('UPDATE items SET title =')) {
    const itemId = Number(params[6]);
    const item = mockStore.items.find(i => i.id === itemId);
    if (item) {
      item.title = params[0];
      item.description = params[1];
      item.category = params[2];
      item.location = params[3];
      item.item_date = params[4];
      item.image_key = params[5];
    }
    return { affectedRows: item ? 1 : 0 };
  }

  // Items: UPDATE items SET status = ? WHERE id = ?
  if (cleanSql.includes('UPDATE items SET status = ? WHERE id = ?')) {
    const newStatus = params[0];
    const itemId = Number(params[1]);
    const item = mockStore.items.find(i => i.id === itemId);
    if (item) {
      item.status = newStatus;
    }
    return { affectedRows: item ? 1 : 0 };
  }

  // Items: DELETE FROM items WHERE id = ?
  if (cleanSql.includes('DELETE FROM items WHERE id = ?')) {
    const itemId = Number(params[0]);
    const idx = mockStore.items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      mockStore.items.splice(idx, 1);
      mockStore.claims = mockStore.claims.filter(c => c.item_id !== itemId);
    }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // Claims: SELECT existing claim
  if (cleanSql.includes('SELECT id, status FROM claims WHERE item_id = ? AND claimant_id = ?')) {
    const itemId = Number(params[0]);
    const claimantId = Number(params[1]);
    const c = mockStore.claims.find(cl => cl.item_id === itemId && cl.claimant_id === claimantId && cl.status === 'PENDING');
    return c ? [c] : [];
  }

  // Claims: INSERT
  if (cleanSql.includes('INSERT INTO claims')) {
    const newClaim = {
      id: mockStore.nextClaimId++,
      item_id: Number(params[0]),
      claimant_id: Number(params[1]),
      message: params[2],
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    mockStore.claims.unshift(newClaim);
    return { insertId: newClaim.id, affectedRows: 1 };
  }

  // Claims: GET incoming claims (where i.user_id = ?)
  if (cleanSql.includes('FROM claims c JOIN items i ON c.item_id = i.id JOIN users u ON c.claimant_id = u.id WHERE i.user_id = ?')) {
    const ownerId = Number(params[0]);
    const itemsOwnedByUser = mockStore.items.filter(i => i.user_id === ownerId).map(i => i.id);
    const matchedClaims = mockStore.claims.filter(c => itemsOwnedByUser.includes(c.item_id));

    return matchedClaims.map(c => {
      const item = mockStore.items.find(i => i.id === c.item_id) || {};
      const claimant = mockStore.users.find(u => u.id === c.claimant_id) || { name: 'Claimant', email: '' };
      return {
        id: c.id,
        item_id: c.item_id,
        claimant_id: c.claimant_id,
        message: c.message,
        claim_status: c.status,
        claim_date: c.created_at,
        item_title: item.title,
        item_category: item.category,
        item_type: item.type,
        item_status: item.status,
        item_image_key: item.image_key,
        item_location: item.location,
        claimant_name: claimant.name,
        claimant_email: claimant.email
      };
    });
  }

  // Claims: GET outgoing claims (WHERE c.claimant_id = ?)
  if (cleanSql.includes('FROM claims c JOIN items i ON c.item_id = i.id JOIN users owner ON i.user_id = owner.id WHERE c.claimant_id = ?')) {
    const claimantId = Number(params[0]);
    const myClaims = mockStore.claims.filter(c => c.claimant_id === claimantId);

    return myClaims.map(c => {
      const item = mockStore.items.find(i => i.id === c.item_id) || {};
      const owner = mockStore.users.find(u => u.id === item.user_id) || { name: 'Owner', email: '' };
      return {
        id: c.id,
        item_id: c.item_id,
        claimant_id: c.claimant_id,
        message: c.message,
        claim_status: c.status,
        claim_date: c.created_at,
        item_title: item.title,
        item_category: item.category,
        item_type: item.type,
        item_status: item.status,
        item_image_key: item.image_key,
        item_location: item.location,
        owner_name: owner.name,
        owner_email: owner.email
      };
    });
  }

  return [];
}

/**
 * Initialize MySQL Database and tables
 */
async function initDatabase() {
  let connection;
  try {
    const adminConnection = await mysql.createConnection({
      host: poolConfig.host,
      port: poolConfig.port,
      user: poolConfig.user,
      password: poolConfig.password
    });

    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${poolConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await adminConnection.end();

    connection = await pool.getConnection();
    isDatabaseConnected = true;
    console.log('✅ Connected to MySQL database successfully on ' + poolConfig.host + ':' + poolConfig.port);

    // Create Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        type ENUM('LOST', 'FOUND') NOT NULL,
        image_key VARCHAR(500) DEFAULT NULL,
        location VARCHAR(200) NOT NULL,
        item_date DATE NOT NULL,
        status ENUM('OPEN', 'CLAIM_PENDING', 'RETURNED') NOT NULL DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_items_type (type),
        INDEX idx_items_category (category),
        INDEX idx_items_status (status),
        INDEX idx_items_user (user_id),
        INDEX idx_items_created_at (created_at),
        CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        claimant_id INT NOT NULL,
        message TEXT NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_claims_item (item_id),
        INDEX idx_claims_claimant (claimant_id),
        INDEX idx_claims_status (status),
        CONSTRAINT fk_claims_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
        CONSTRAINT fk_claims_claimant FOREIGN KEY (claimant_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check seed data
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('🌱 Seeding demo accounts and items into MySQL...');
      const samplePasswordHash = await bcrypt.hash('Password123!', 10);

      const [u1] = await connection.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Alice Johnson', 'alice@college.edu', samplePasswordHash]
      );
      const [u2] = await connection.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Bob Smith', 'bob@college.edu', samplePasswordHash]
      );
      const [u3] = await connection.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Charlie Brown', 'charlie@college.edu', samplePasswordHash]
      );

      await connection.query(`
        INSERT INTO items (user_id, title, description, category, type, image_key, location, item_date, status) VALUES
        (${u1.insertId}, 'Brown Leather Fossil Wallet', 'Lost near Central Campus Library 2nd floor.', 'Wallets & Bags', 'LOST', NULL, 'Central Library 2nd Floor', CURDATE() - INTERVAL 2 DAY, 'OPEN'),
        (${u2.insertId}, 'Apple AirPods Pro in White Case', 'Found on a bench outside Computer Science dept block.', 'Electronics', 'FOUND', NULL, 'CS Block Lawn Bench', CURDATE() - INTERVAL 1 DAY, 'OPEN'),
        (${u3.insertId}, 'Silver MacBook Pro 14-inch', 'Left behind in Seminar Hall 3 after Cloud Computing lecture.', 'Electronics', 'LOST', NULL, 'Seminar Hall 3', CURDATE() - INTERVAL 3 DAY, 'OPEN'),
        (${u1.insertId}, 'Scientific Calculator Casio fx-991EX', 'Found on desk 42 in Engineering Mathematics Lab.', 'Electronics', 'FOUND', NULL, 'Math Lab Desk 42', CURDATE() - INTERVAL 4 DAY, 'OPEN'),
        (${u2.insertId}, 'Titan Black Dial Wristwatch', 'Lost around sports complex athletic track.', 'Jewellery', 'LOST', NULL, 'Sports Complex Track', CURDATE() - INTERVAL 6 DAY, 'RETURNED');
      `);
      console.log('✅ Demo records successfully initialized in MySQL.');
    }
  } catch (error) {
    console.warn('⚠️  MySQL connection not established (' + error.message + ').');
    console.warn('💡 Falling back to in-memory demonstration store so frontend & APIs remain 100% functional.');
    console.warn('   To use MySQL, ensure MySQL server is running and configure credentials in backend/.env');
    isDatabaseConnected = false;
  } finally {
    if (connection) connection.release();
  }
}

// Wrapper to handle transactions even if connection is simulated
async function getTransactionConnection() {
  if (isDatabaseConnected) {
    return await pool.getConnection();
  }

  // Simulated transaction connection for fallback
  return {
    async query(sql, params) {
      if (sql.includes('SELECT c.id, c.item_id, c.claimant_id, c.status, i.user_id AS item_owner_id')) {
        const claimId = Number(params[0]);
        const claim = mockStore.claims.find(c => c.id === claimId);
        if (!claim) return [[]];
        const item = mockStore.items.find(i => i.id === claim.item_id) || {};
        return [[{
          id: claim.id,
          item_id: claim.item_id,
          claimant_id: claim.claimant_id,
          status: claim.status,
          item_owner_id: item.user_id,
          item_status: item.status
        }]];
      }
      if (sql.includes('UPDATE claims SET status = "APPROVED" WHERE id = ?')) {
        const claimId = Number(params[0]);
        const claim = mockStore.claims.find(c => c.id === claimId);
        if (claim) claim.status = 'APPROVED';
        return [{}];
      }
      if (sql.includes('UPDATE claims SET status = "REJECTED" WHERE item_id = ?')) {
        const itemId = Number(params[0]);
        const exceptId = Number(params[1]);
        mockStore.claims.forEach(c => {
          if (c.item_id === itemId && c.id !== exceptId && c.status === 'PENDING') {
            c.status = 'REJECTED';
          }
        });
        return [{}];
      }
      if (sql.includes('UPDATE claims SET status = "REJECTED" WHERE id = ?')) {
        const claimId = Number(params[0]);
        const claim = mockStore.claims.find(c => c.id === claimId);
        if (claim) claim.status = 'REJECTED';
        return [{}];
      }
      if (sql.includes('UPDATE items SET status =')) {
        const newStatus = sql.includes('"CLAIM_PENDING"') ? 'CLAIM_PENDING' : 'OPEN';
        const itemId = Number(params[0]);
        const item = mockStore.items.find(i => i.id === itemId);
        if (item) item.status = newStatus;
        return [{}];
      }
      return [[]];
    },
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {}
  };
}

module.exports = {
  pool: {
    getConnection: getTransactionConnection
  },
  query,
  initDatabase,
  isDatabaseConnected: () => isDatabaseConnected
};
