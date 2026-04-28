/**
 * Minimal structured logger for production.
 * Outputs JSON in production for log aggregation, human-readable in development.
 */

const isProduction = process.env.NODE_ENV === 'production';

const formatMessage = (level, message, meta = {}) => {
    if (isProduction) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta
        });
    }
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    const icons = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍' };
    return `${new Date().toISOString()} ${icons[level] || ''} [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
    info: (message, meta) => console.log(formatMessage('info', message, meta)),
    warn: (message, meta) => console.warn(formatMessage('warn', message, meta)),
    error: (message, meta) => console.error(formatMessage('error', message, meta)),
    debug: (message, meta) => {
        if (!isProduction) console.log(formatMessage('debug', message, meta));
    },
    // Express request logger middleware
    requestLogger: (req, res, next) => {
        // Skip noisy health check logs
        if (req.path === '/health') return next();

        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const meta = {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
            };
            if (res.statusCode >= 400) {
                logger.warn(`${req.method} ${req.path} ${res.statusCode}`, meta);
            } else {
                logger.info(`${req.method} ${req.path} ${res.statusCode}`, meta);
            }
        });
        next();
    }
};

module.exports = logger;
