const pool = require('./config/database');

const run = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS timesheets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                clock_in TIMESTAMP WITH TIME ZONE,
                clock_out TIMESTAMP WITH TIME ZONE,
                regular_hours DECIMAL(5, 2) DEFAULT 0.00,
                overtime_hours DECIMAL(5, 2) DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, processed
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Attendance Migration successful');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

run();
