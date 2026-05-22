/**
 * Startup patch — runs automatically when the server starts.
 * Adds missing columns to existing production tables using IF NOT EXISTS.
 * Safe to run multiple times. Never drops or alters existing data.
 */
require('dotenv').config();
const pool = require('./config/database');

const runStartupPatch = async () => {
    const client = await pool.connect();
    try {
        // ── Ensure organizations table exists (needed for FK references) ────
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

        // Ensure a default org exists for backfill
        const defaultOrg = await client.query(`
            INSERT INTO organizations (name, slug, invite_code)
            VALUES ('Default Organization', 'default', 'default-invite')
            ON CONFLICT (slug) DO UPDATE SET name = 'Default Organization'
            RETURNING id;
        `);
        const defaultOrgId = defaultOrg.rows[0].id;

        // ── conversations: add org_id ────────────────────────────────────────
        await client.query(`
            ALTER TABLE conversations
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        await client.query(`
            UPDATE conversations SET org_id = $1 WHERE org_id IS NULL;
        `, [defaultOrgId]);

        // ── conversations: add last_message_at ──────────────────────────────
        await client.query(`
            ALTER TABLE conversations
            ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
        // Backfill last_message_at from latest message per conversation
        await client.query(`
            UPDATE conversations c
            SET last_message_at = COALESCE(
                (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id),
                c.created_at
            )
            WHERE last_message_at IS NULL;
        `);

        // ── messages: add org_id ─────────────────────────────────────────────
        await client.query(`
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        await client.query(`
            UPDATE messages m
            SET org_id = (SELECT org_id FROM conversations c WHERE c.id = m.conversation_id)
            WHERE m.org_id IS NULL;
        `);

        // ── analytics_logs: add org_id if missing ───────────────────────────
        await client.query(`
            ALTER TABLE analytics_logs
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        await client.query(`
            UPDATE analytics_logs SET org_id = $1 WHERE org_id IS NULL;
        `, [defaultOrgId]);

        // ── users: add org_id if missing ─────────────────────────────────────
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);

        // ── users: add profile_picture if missing ─────────────────────────────
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
        `);
        await client.query(`
            UPDATE users SET org_id = $1 WHERE org_id IS NULL;
        `, [defaultOrgId]);

        // ── analytics_logs: add metadata column if missing ────────────────
        await client.query(`
            ALTER TABLE analytics_logs
            ADD COLUMN IF NOT EXISTS metadata JSONB;
        `);

        // ── leave_requests: add org_id + approved_at if missing ──────────
        await client.query(`
            ALTER TABLE leave_requests
            ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
        `);
        await client.query(`
            UPDATE leave_requests SET org_id = $1 WHERE org_id IS NULL;
        `, [defaultOrgId]);
        await client.query(`
            ALTER TABLE leave_requests
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
        `);

        // ── notifications table ──────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) DEFAULT 'info',
                title VARCHAR(255),
                message TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`).catch(() => {});

        // ── notifications: add org_id + link_url if missing ──────────────────
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;`);
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url VARCHAR(255);`);
        await client.query(`
            UPDATE notifications n SET org_id = u.org_id
            FROM users u WHERE n.user_id = u.id AND n.org_id IS NULL;
        `);

        // ── Audit Logs table ─────────────────────────────────────────────────
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
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date ON audit_logs(org_id, created_at DESC);`).catch(() => {});
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`).catch(() => {});
        await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);`).catch(() => {});

        // ── Indexes ───────────────────────────────────────────────────────────
        const idxTables = ['conversations', 'messages', 'analytics_logs', 'users'];
        for (const t of idxTables) {
            await client.query(`CREATE INDEX IF NOT EXISTS idx_${t}_org_id ON ${t}(org_id);`).catch(() => {});
        }
        await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);`).catch(() => {});

        console.log('✅ Startup patch applied — all missing columns present');
    } catch (err) {
        // Log but never crash the server — a patch failure is not fatal
        console.error('⚠️  Startup patch error (non-fatal):', err.message);
    } finally {
        client.release();
    }
};

module.exports = runStartupPatch;
