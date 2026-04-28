/**
 * Environment Configuration Validator
 * Validates all required environment variables at startup and fails fast.
 */
require('dotenv').config();

const REQUIRED_VARS = [
    { name: 'DATABASE_URL', hint: 'PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/db' },
    { name: 'JWT_SECRET', hint: 'Secret key for signing JWT tokens — use a long random string' },
];

const OPTIONAL_VARS = [
    { name: 'OPENAI_API_KEY', hint: 'Required for AI features (resume screening, flight risk, review drafts)' },
    { name: 'PORT', hint: 'Server port, defaults to 5000' },
    { name: 'NODE_ENV', hint: 'development | production' },
    { name: 'FRONTEND_URL', hint: 'Frontend URL for email links, e.g. https://app.yourdomain.com' },
    { name: 'SMTP_HOST', hint: 'Mail server hostname for email notifications' },
    { name: 'HR_EMAIL_ADDRESS', hint: 'Email address to receive HR notifications' },
    { name: 'CLOUDINARY_CLOUD_NAME', hint: 'Required for persistent image/document uploads' },
    { name: 'CLOUDINARY_API_KEY', hint: 'Required for Cloudinary uploads' },
    { name: 'CLOUDINARY_API_SECRET', hint: 'Required for Cloudinary uploads' },
];

function validateEnv() {
    const missing = [];
    const warnings = [];

    for (const { name, hint } of REQUIRED_VARS) {
        if (!process.env[name]) {
            missing.push(`  ❌ ${name} — ${hint}`);
        }
    }

    for (const { name, hint } of OPTIONAL_VARS) {
        if (!process.env[name]) {
            warnings.push(`  ⚠️  ${name} — ${hint}`);
        }
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  Optional environment variables not set:');
        warnings.forEach(w => console.log(w));
        console.log('');
    }

    if (missing.length > 0) {
        console.error('\n🚨 FATAL: Missing required environment variables:\n');
        missing.forEach(m => console.error(m));
        console.error('\nCreate a .env file or set these variables before starting the server.\n');
        process.exit(1);
    }
}

module.exports = validateEnv;
