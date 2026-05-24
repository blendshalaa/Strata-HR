/**
 * Migration: Add org_id to trainings and user_trainings for multi-tenancy.
 */
require('dotenv').config();
const pool = require('./config/database');

const run = async () => {
    try {
        console.log('🔄 Running training org_id migration...\n');

        await pool.query(`
            ALTER TABLE trainings
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        console.log('✅ trainings.org_id added');

        await pool.query(`
            ALTER TABLE user_trainings
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        console.log('✅ user_trainings.org_id added');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_trainings_org_id ON trainings(org_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_user_trainings_org_id ON user_trainings(org_id)');
        console.log('✅ Indexes created');

        console.log('\n🎉 Training org_id migration completed!');
    } catch (e) {
        console.error('❌ Training org_id migration failed:', e.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
};

run();
