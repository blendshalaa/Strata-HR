/**
 * Migration: creates the goals and key_results tables for OKR tracking.
 * Run: node db-migrate-goals.js
 */
require('dotenv').config();
const pool = require('./config/database');

const migrate = async () => {
    try {
        console.log('🔄 Running goals & OKRs migration...\n');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'individual',
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ goals table created');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS key_results (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        target_value NUMERIC DEFAULT 100,
        current_value NUMERIC DEFAULT 0,
        unit VARCHAR(50) DEFAULT '%',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ key_results table created');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_goals_org_id ON goals(org_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_key_results_goal_id ON key_results(goal_id)');
        console.log('✅ Indexes created');

        console.log('\n🎉 Goals & OKRs migration completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
};

migrate();
