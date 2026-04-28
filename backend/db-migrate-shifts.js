/**
 * Migration for shift management improvements:
 * - Add notes column to timesheets
 * - Create shifts table for scheduling
 * 
 * Run: node db-migrate-shifts.js
 */
require('dotenv').config();
const pool = require('./config/database');

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Running shift management migrations...\n');

        await client.query(`ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS notes TEXT;`);
        console.log('✅ Added notes column to timesheets');

        await client.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                shift_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                shift_type VARCHAR(50) DEFAULT 'regular',
                notes TEXT,
                created_by INTEGER REFERENCES users(id),
                org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created shifts table');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, shift_date);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_shifts_org_date ON shifts(org_id, shift_date);`);
        console.log('✅ Created shift indexes');

        console.log('\n🎉 Shift migrations completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

migrate();
