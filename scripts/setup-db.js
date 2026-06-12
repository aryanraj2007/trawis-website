const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function setupDatabase() {
  console.log('Starting PostgreSQL Database setup...');

  try {
    // 1. Read and run schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at: ${schemaPath}`);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql queries...');
    await pool.query(sql);
    console.log('Schema tables and types verified/created successfully.');

    // 2. Check for admin-setup.json
    const setupJsonPath = path.join(__dirname, '../admin-setup.json');
    if (fs.existsSync(setupJsonPath)) {
      console.log('Found admin-setup.json. Seeding superadmin user...');
      const setupData = JSON.parse(fs.readFileSync(setupJsonPath, 'utf8'));

      if (!setupData.username || !setupData.password) {
        throw new Error('admin-setup.json must contain both "username" and "password" fields.');
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(setupData.password, 10);

      // Check if user already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [setupData.username]);
      if (userCheck.rows.length === 0) {
        // Insert superadmin
        await pool.query(
          'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
          [setupData.username, passwordHash, 'superadmin']
        );
        console.log(`Successfully seeded superadmin user: "${setupData.username}"`);
      } else {
        // Update password hash and force role to superadmin if user already exists
        await pool.query(
          'UPDATE users SET password_hash = $1, role = $2 WHERE username = $3',
          [passwordHash, 'superadmin', setupData.username]
        );
        console.log(`Successfully updated credentials for existing user: "${setupData.username}" (role: superadmin)`);
      }

      console.log('\n==================================================================');
      console.log('WARNING: Please DELETE "admin-setup.json" now to secure your system!');
      console.log('==================================================================\n');
    } else {
      console.log('admin-setup.json not found in root. Skipping superadmin user seeding.');
      console.log('Create an "admin-setup.json" file and rerun this script to seed a user.');
    }

  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    await pool.end();
    console.log('Database pool connection closed.');
  }
}

setupDatabase();
