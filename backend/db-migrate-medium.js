/**
 * Database migration for medium-effort features:
 * - Notifications table
 * - Password reset columns on users table
 * 
 * Run: node db-migrate-medium.js
 */
require('dotenv').config();
const pool = require('./config/database');

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Running medium-effort feature migrations...\n');

        await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ notifications table created');

        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;`);
        console.log('✅ Password reset columns added to users');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;`);
        console.log('✅ Indexes created');

        console.log('\n🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

migrate();
