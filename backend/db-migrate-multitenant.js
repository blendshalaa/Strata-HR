/**
 * Multi-tenant migration: adds organizations table and org_id to all existing tables.
 * Run: node db-migrate-multitenant.js
 */
require('dotenv').config();
const pool = require('./config/database');

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Running multi-tenant migration...\n');
        await client.query('BEGIN');

        // 1. Create organizations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo_url VARCHAR(500),
        plan VARCHAR(50) DEFAULT 'free',
        invite_code VARCHAR(64) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ organizations table created');

        // 2. Insert a default organization for existing data
        const defaultOrg = await client.query(`
      INSERT INTO organizations (name, slug, invite_code)
      VALUES ('Default Organization', 'default', 'default-invite')
      ON CONFLICT (slug) DO UPDATE SET name = 'Default Organization'
      RETURNING id;
    `);
        const defaultOrgId = defaultOrg.rows[0].id;
        console.log(`✅ Default organization created (id: ${defaultOrgId})`);

        // 3. Add org_id to all tables and backfill
        const tables = [
            'users',
            'departments',
            'job_postings',
            'applications',
            'payroll',
            'performance_reviews',
            'calendar_events',
            'onboarding_tasks',
            'timesheets',
            'leave_requests',
            'knowledge_base',
            'notifications',
            'analytics_logs'
        ];

        for (const table of tables) {
            try {
                await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE`);
                await client.query(`UPDATE ${table} SET org_id = $1 WHERE org_id IS NULL`, [defaultOrgId]);
                // Don't set NOT NULL yet — some tables may not exist
                console.log(`  ✅ ${table} — org_id added & backfilled`);
            } catch (err) {
                // Table may not exist yet — skip gracefully
                console.log(`  ⚠️  ${table} — skipped (${err.message.split('\n')[0]})`);
            }
        }

        // 4. Create indexes
        for (const table of tables) {
            try {
                await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_org_id ON ${table}(org_id)`);
            } catch { /* skip if table doesn't exist */ }
        }
        console.log('✅ Indexes created');

        await client.query('COMMIT');
        console.log('\n🎉 Multi-tenant migration completed successfully!');
        console.log(`   Default org ID: ${defaultOrgId}`);
        console.log('   All existing data has been assigned to the default organization.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

migrate();
