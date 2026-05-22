/**
 * Audit Log Controller
 * Provides endpoints for viewing audit trail data (admin/HR only).
 */
const pool = require('../config/database');

/**
 * Get paginated audit logs with filtering.
 * Query params: page, limit, action, entity_type, actor_id, from, to
 */
const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, action, entity_type, actor_id, from, to } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const orgId = req.user.org_id;

        let query = `
            SELECT a.id, a.action, a.entity_type, a.entity_id,
                   a.old_value, a.new_value, a.ip_address, a.created_at,
                   u.name as actor_name, u.email as actor_email, u.role as actor_role
            FROM audit_logs a
            LEFT JOIN users u ON a.actor_id = u.id
            WHERE a.org_id = $1
        `;
        let countQuery = `SELECT COUNT(*) FROM audit_logs a WHERE a.org_id = $1`;
        const params = [orgId];
        const countParams = [orgId];
        let idx = 2;

        if (action) {
            query += ` AND a.action = $${idx}`;
            countQuery += ` AND a.action = $${idx}`;
            params.push(action);
            countParams.push(action);
            idx++;
        }
        if (entity_type) {
            query += ` AND a.entity_type = $${idx}`;
            countQuery += ` AND a.entity_type = $${idx}`;
            params.push(entity_type);
            countParams.push(entity_type);
            idx++;
        }
        if (actor_id) {
            query += ` AND a.actor_id = $${idx}`;
            countQuery += ` AND a.actor_id = $${idx}`;
            params.push(parseInt(actor_id));
            countParams.push(parseInt(actor_id));
            idx++;
        }
        if (from) {
            query += ` AND a.created_at >= $${idx}`;
            countQuery += ` AND a.created_at >= $${idx}`;
            params.push(from);
            countParams.push(from);
            idx++;
        }
        if (to) {
            query += ` AND a.created_at <= $${idx}::date + INTERVAL '1 day'`;
            countQuery += ` AND a.created_at <= $${idx}::date + INTERVAL '1 day'`;
            params.push(to);
            countParams.push(to);
            idx++;
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(parseInt(limit), offset);

        const [logsResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams),
        ]);

        res.json({
            logs: logsResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get audit log summary stats.
 */
const getAuditStats = async (req, res, next) => {
    try {
        const orgId = req.user.org_id;

        const [actionCounts, recentActivity, entityCounts] = await Promise.all([
            pool.query(`
                SELECT action, COUNT(*) as count FROM audit_logs
                WHERE org_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY action ORDER BY count DESC
            `, [orgId]),
            pool.query(`
                SELECT COUNT(*) as today FROM audit_logs
                WHERE org_id = $1 AND created_at >= CURRENT_DATE
            `, [orgId]),
            pool.query(`
                SELECT entity_type, COUNT(*) as count FROM audit_logs
                WHERE org_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY entity_type ORDER BY count DESC
            `, [orgId]),
        ]);

        res.json({
            actions: actionCounts.rows.map(r => ({ action: r.action, count: parseInt(r.count) })),
            today: parseInt(recentActivity.rows[0].today),
            entities: entityCounts.rows.map(r => ({ entity_type: r.entity_type, count: parseInt(r.count) })),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAuditLogs, getAuditStats };
