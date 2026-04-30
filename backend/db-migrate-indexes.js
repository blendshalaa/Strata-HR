/**
 * Performance Indexes Migration
 * Adds indexes on org_id and commonly filtered columns.
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * Usage: node db-migrate-indexes.js
 */

require('dotenv').config();
const pool = require('./config/database');

async function run() {
  const indexes = [
    // Core tenant filter — used on almost every query
    'CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',

    // Leave
    'CREATE INDEX IF NOT EXISTS idx_leave_requests_org_id ON leave_requests(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status)',

    // Timesheets / Attendance
    'CREATE INDEX IF NOT EXISTS idx_timesheets_org_id ON timesheets(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status)',

    // Payroll
    'CREATE INDEX IF NOT EXISTS idx_payroll_org_id ON payroll(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_payroll_user_id ON payroll(user_id)',

    // Recruitment
    'CREATE INDEX IF NOT EXISTS idx_job_postings_org_id ON job_postings(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)',

    // Goals
    'CREATE INDEX IF NOT EXISTS idx_goals_org_id ON goals(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)',

    // Notifications
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',

    // Knowledge base
    'CREATE INDEX IF NOT EXISTS idx_knowledge_base_org_id ON knowledge_base(org_id)',

    // Shifts
    'CREATE INDEX IF NOT EXISTS idx_shifts_org_id ON shifts(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date)',

    // Documents
    'CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)',

    // Calendar events
    'CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON calendar_events(org_id)',

    // Chat
    'CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id)',
    'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
  ];

  console.log('🚀 Adding performance indexes...\n');

  for (const sql of indexes) {
    try {
      await pool.query(sql);
      const name = sql.match(/idx_\w+/)?.[0] || sql;
      console.log(`  ✅ ${name}`);
    } catch (err) {
      // Table may not exist yet in some setups — warn and continue
      console.warn(`  ⚠️  Skipped (table may not exist): ${err.message}`);
    }
  }

  console.log('\n🎉 Index migration complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
