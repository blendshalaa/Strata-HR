/**
 * Unified Migration Runner
 * Runs all migration scripts in order. Safe to run multiple times (all migrations use IF NOT EXISTS).
 * Works on all platforms (Render, Railway, local) — no psql CLI dependency.
 *
 * Usage: node migrate-all.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

// SQL files are run directly via the pg pool (no psql CLI needed)
// JS files are run as child processes
const migrations = [
    'db-migrate-base.js',
    'schema.sql',
    'db-migrate.js',
    'db-migrate-attendance.js',
    'db-migrate-medium.js',
    'db-migrate-goals.js',
    'db-migrate-multitenant.js',
    'db-migrate-documents.js',
    'db-migrate-shifts.js',
    'db-migrate-indexes.js',
    'db-migrate-audit.js',
    'db-migrate-employee-portal.js',
];

async function runAll() {
    console.log('🚀 Running all migrations...\n');

    for (const file of migrations) {
        const ext = path.extname(file);
        const fullPath = path.join(__dirname, file);

        try {
            if (ext === '.sql') {
                // Run SQL files directly via pg pool — no psql CLI needed
                console.log(`📄 Running SQL: ${file}`);
                const sql = fs.readFileSync(fullPath, 'utf-8');
                await pool.query(sql);
            } else {
                console.log(`📦 Running JS:  ${file}`);
                execSync(`node "${fullPath}"`, { stdio: 'inherit', cwd: __dirname });
            }
            console.log(`   ✅ ${file} complete\n`);
        } catch (error) {
            console.error(`   ❌ ${file} failed: ${error.message}\n`);
            process.exit(1);
        }
    }

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
}

runAll();
