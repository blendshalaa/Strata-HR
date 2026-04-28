const pool = require('./config/database');

const run = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding_tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                task_name VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Migration successful');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

run();
