/**
 * Migration: creates the employee_documents table.
 * Run: node db-migrate-documents.js
 */
require('dotenv').config();
const pool = require('./config/database');

const migrate = async () => {
    try {
        console.log('🔄 Running document management migration...\n');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'other',
        file_url VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ employee_documents table created');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_employee_documents_user_id ON employee_documents(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_employee_documents_org_id ON employee_documents(org_id)');
        console.log('✅ Indexes created');

        console.log('\n🎉 Document management migration completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
};

migrate();
