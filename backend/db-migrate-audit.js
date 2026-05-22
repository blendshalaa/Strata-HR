/**
 * Migration: Audit Logs + Enhanced Notifications
 * Creates audit_logs table and adds org_id to notifications for real-time support.
 * Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS).
 */
require('dotenv').config();
const pool = require('./config/database');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📋 Running audit + notifications migration...\n');

        // ── Audit Logs Table ────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGSERIAL PRIMARY KEY,
                actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                old_value JSONB,
                new_value JSONB,
                ip_address INET,
                org_id INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('   ✅ audit_logs table ready');

        // Indexes for fast querying
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date ON audit_logs(org_id, created_at DESC);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);`);
        console.log('   ✅ audit_logs indexes created');

        // ── Notifications: add org_id + link_url columns if missing ──
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;`);
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url VARCHAR(255);`);

        // Backfill org_id for existing notifications from their user's org
        await client.query(`
            UPDATE notifications n SET org_id = u.org_id
            FROM users u WHERE n.user_id = u.id AND n.org_id IS NULL;
        `);
        console.log('   ✅ notifications enhanced with org_id + link_url');

        console.log('\n🎉 Audit + notifications migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
