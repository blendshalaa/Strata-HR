const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database schema creation...');
    await pool.query(schemaSql);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Error creating database schema:', err);
  } finally {
    pool.end();
  }
}

runSchema();
