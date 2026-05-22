/**
 * Audit Logger Middleware
 * Automatically logs write operations (POST, PUT, PATCH, DELETE) to the audit_logs table.
 * Can also be called directly as a helper function for manual audit entries.
 */
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Insert an audit log entry directly (used by controllers for fine-grained logging).
 * @param {object} params
 * @param {number} params.actorId - The user performing the action
 * @param {string} params.action - 'create', 'update', 'delete', 'approve', 'reject', 'login', 'export'
 * @param {string} params.entityType - 'user', 'leave_request', 'payroll', 'shift', 'department', etc.
 * @param {number|null} params.entityId - ID of the affected entity (null for bulk/login actions)
 * @param {object|null} params.oldValue - Previous state (for updates/deletes)
 * @param {object|null} params.newValue - New state (for creates/updates)
 * @param {string|null} params.ipAddress - Client IP address
 * @param {number} params.orgId - Organization ID
 */
const logAudit = async ({ actorId, action, entityType, entityId = null, oldValue = null, newValue = null, ipAddress = null, orgId }) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value, ip_address, org_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [actorId, action, entityType, entityId, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, ipAddress, orgId]
        );
    } catch (err) {
        // Never let audit logging crash the request
        logger.error('Audit log write failed (non-fatal)', { message: err.message, action, entityType });
    }
};

/**
 * Extract client IP address from request (supports proxies).
 */
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || null;
};

/**
 * Express middleware that wraps the response to auto-log write operations.
 * Attach to routes like: router.post('/...', authenticateToken, auditMiddleware('create', 'leave_request'), handler)
 *
 * @param {string} action - The action type
 * @param {string} entityType - The entity being acted upon
 */
const auditMiddleware = (action, entityType) => {
    return (req, res, next) => {
        // Store the original json method
        const originalJson = res.json.bind(res);

        res.json = (body) => {
            // Only log successful write operations
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const entityId = req.params?.id || body?.id || body?.leave_request?.id || body?.payroll?.id || body?.shift?.id || body?.goal?.id || body?.user?.id || null;

                logAudit({
                    actorId: req.user.id,
                    action,
                    entityType,
                    entityId: entityId ? parseInt(entityId) : null,
                    oldValue: null, // Would need a before-query for full diff; added per-controller where important
                    newValue: body,
                    ipAddress: getClientIP(req),
                    orgId: req.user.org_id,
                }).catch(() => {}); // Fire and forget
            }

            return originalJson(body);
        };

        next();
    };
};

module.exports = { logAudit, auditMiddleware, getClientIP };
