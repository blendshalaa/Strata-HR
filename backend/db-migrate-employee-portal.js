/**
 * Migration: Employee Self-Service Portal
 * Creates tables for expenses, trainings, and modifies users/documents.
 */
require('dotenv').config();
const pool = require('./config/database');

const run = async () => {
    try {
        console.log('🔄 Running Employee Portal migration...\n');

        // 1. Update users table with manager_id
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ users table updated with manager_id');

        // 2. Update employee_documents table with signature fields
        await pool.query(`
            ALTER TABLE employee_documents
            ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(255);
        `);
        console.log('✅ employee_documents table updated with signature fields');

        // 3. Create expenses table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'EUR',
                category VARCHAR(100) NOT NULL,
                description TEXT,
                receipt_url VARCHAR(500),
                status VARCHAR(50) DEFAULT 'pending',
                approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ expenses table created');

        // 4. Create trainings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trainings (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                link_url VARCHAR(500),
                duration_minutes INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ trainings table created');

        // 5. Create user_trainings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_trainings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'assigned',
                completed_at TIMESTAMP WITH TIME ZONE,
                assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, training_id)
            );
        `);
        console.log('✅ user_trainings table created');

        console.log('\n🎉 Employee Portal migration completed!');
    } catch (e) {
        console.error('❌ Employee Portal migration failed:', e.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
};

run();
