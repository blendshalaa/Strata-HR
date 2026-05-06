const pool = require('../config/database');
const openai = require('../config/openai');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    let totalUsers = 0;
    if (isAdmin) {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE org_id = $1', [orgId]);
      totalUsers = parseInt(usersResult.rows[0].count);
    }

    let pendingLeaveQuery = 'SELECT COUNT(*) as count FROM leave_requests WHERE status = $1 AND org_id = $2';
    const pendingLeaveParams = ['pending', orgId];
    if (!isAdmin) {
      pendingLeaveQuery += ' AND user_id = $3';
      pendingLeaveParams.push(userId);
    }
    const pendingLeaveResult = await pool.query(pendingLeaveQuery, pendingLeaveParams);
    const pendingLeave = parseInt(pendingLeaveResult.rows[0].count);

    const conversationsResult = await pool.query(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = $1',
      [userId]
    );
    const totalConversations = parseInt(conversationsResult.rows[0].count);

    const knowledgeResult = await pool.query('SELECT COUNT(*) as count FROM knowledge_base WHERE org_id = $1', [orgId]);
    const totalKnowledge = parseInt(knowledgeResult.rows[0].count);

    const chatActivityQuery = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analytics_logs
      WHERE action_type = 'chat_message' AND created_at >= CURRENT_DATE - INTERVAL '7 days' AND org_id = $1
      ${isAdmin ? '' : 'AND user_id = $2'}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const chatActivityParams = isAdmin ? [orgId] : [orgId, userId];
    const chatActivity = await pool.query(chatActivityQuery, chatActivityParams);

    let topQueries = [];
    if (isAdmin) {
      const topQueriesResult = await pool.query(`
        SELECT query, COUNT(*) as count
        FROM analytics_logs
        WHERE action_type = 'chat_message' AND query IS NOT NULL AND org_id = $1
        GROUP BY query ORDER BY count DESC LIMIT 10
      `, [orgId]);
      topQueries = topQueriesResult.rows;
    }

    let leaveDistribution = [];
    if (isAdmin) {
      const leaveDistResult = await pool.query(
        'SELECT type, COUNT(*) as count FROM leave_requests WHERE org_id = $1 GROUP BY type',
        [orgId]
      );
      leaveDistribution = leaveDistResult.rows;
    }

    let departmentHeadcount = [];
    if (isAdmin) {
      const deptResult = await pool.query(
        `SELECT COALESCE(department, 'Unassigned') as name, COUNT(*) as count FROM users WHERE org_id = $1 GROUP BY department ORDER BY count DESC`,
        [orgId]
      );
      departmentHeadcount = deptResult.rows.map(r => ({ name: r.name, count: parseInt(r.count) }));
    }

    let openPositions = 0;
    let pendingTimesheets = 0;
    let attendanceToday = 0;
    if (isAdmin) {
      const openPosResult = await pool.query("SELECT COUNT(*) as count FROM job_postings WHERE status = 'open' AND org_id = $1", [orgId]);
      openPositions = parseInt(openPosResult.rows[0].count);

      const pendingTsResult = await pool.query(
        "SELECT COUNT(*) as count FROM timesheets WHERE status = 'pending' AND org_id = $1",
        [orgId]
      );
      pendingTimesheets = parseInt(pendingTsResult.rows[0].count);

      const today = new Date().toISOString().split('T')[0];
      const attendanceResult = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as count FROM timesheets WHERE org_id = $1 AND DATE(clock_in) = $2',
        [orgId, today]
      );
      attendanceToday = parseInt(attendanceResult.rows[0].count);
    }

    res.json({
      stats: {
        total_users: totalUsers,
        pending_leave_requests: pendingLeave,
        pending_timesheets: pendingTimesheets,
        attendance_today: attendanceToday,
        total_conversations: totalConversations,
        total_knowledge_articles: totalKnowledge,
        open_positions: openPositions
      },
      chat_activity: chatActivity.rows,
      top_queries: topQueries,
      leave_distribution: leaveDistribution,
      department_headcount: departmentHeadcount
    });
  } catch (error) {
    next(error);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT action_type, DATE(created_at) as date, COUNT(*) as count
       FROM analytics_logs
       WHERE user_id = $1 AND org_id = $2 AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       GROUP BY action_type, DATE(created_at)
       ORDER BY date ASC`,
      [userId, req.user.org_id]
    );
    res.json({ activity: result.rows });
  } catch (error) {
    next(error);
  }
};

const predictFlightRisk = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins and HR can view flight risks.' });
    }

    const employeesResult = await pool.query(`
      SELECT 
        u.id, u.name, u.department, u.created_at, 
        u.sick_leave_balance, u.vacation_balance,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_id = u.id AND lr.type = 'sick') as total_sick_leaves
      FROM users u
      WHERE u.role = 'employee' AND u.org_id = $1
    `, [req.user.org_id]);

    const employees = employeesResult.rows.map(emp => ({
      ...emp,
      tenure_days: Math.floor((new Date() - new Date(emp.created_at)) / (1000 * 60 * 60 * 24))
    }));

    const prompt = `
    You are an expert HR Predictive Analytics AI. 
    Analyze the following list of employees and predict which ones might be at high risk of leaving the company (Flight Risk).
    Look for indicators such as: high number of sick leaves taken, very low remaining leave balances (burnout), or very short/long unusual tenures.

    Employees Data:
    ${JSON.stringify(employees.map(e => ({
      id: e.id, name: e.name, department: e.department,
      tenure_days: e.tenure_days, sick_leave_balance: e.sick_leave_balance,
      vacation_balance: e.vacation_balance, total_sick_leaves_taken: e.total_sick_leaves
    })), null, 2)}

    Return a strict JSON object with a single key "high_risk_employees" containing an array of at most 3 employees.
    For each employee, provide:
    - "id": The employee's integer id
    - "name": The employee's name
    - "department": The department
    - "risk_level": "High" or "Medium"
    - "reason": A single descriptive sentence
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.4
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
/**
 * Comprehensive HR reports: headcount trends, leave trends, payroll, department breakdown, recruitment pipeline, tenure.
 * Admin/HR only.
 */
const getReports = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins and HR can view reports.' });
    }
    const orgId = req.user.org_id;

    // 1. Headcount over last 12 months (based on user created_at)
    const headcountResult = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
             COUNT(*) as new_hires,
             SUM(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)) as cumulative
      FROM users
      WHERE org_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month ASC
    `, [orgId]);

    // Total current headcount
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE org_id = $1', [orgId]);
    const totalHeadcount = parseInt(totalResult.rows[0].total);

    // 2. Leave requests per month (last 6 months), broken down by type
    const leaveTrendsResult = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
             type,
             COUNT(*) as count
      FROM leave_requests
      WHERE org_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at), type
      ORDER BY month ASC
    `, [orgId]);

    // Pivot leave trends into month-keyed objects
    const leaveByMonth = {};
    for (const row of leaveTrendsResult.rows) {
      if (!leaveByMonth[row.month]) leaveByMonth[row.month] = { month: row.month, sick: 0, vacation: 0, personal: 0, total: 0 };
      leaveByMonth[row.month][row.type] = parseInt(row.count);
      leaveByMonth[row.month].total += parseInt(row.count);
    }
    const leaveTrends = Object.values(leaveByMonth);

    // 3. Leave approval rate
    const leaveStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM leave_requests WHERE org_id = $1
      GROUP BY status
    `, [orgId]);

    // 4. Payroll trends (last 6 months)
    const payrollTrendsResult = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', pay_period_end), 'YYYY-MM') as month,
             SUM(net_salary) as total_net,
             SUM(base_salary) as total_base,
             SUM(bonus) as total_bonus,
             SUM(tax_deduction) as total_tax,
             COUNT(*) as payslips
      FROM payroll
      WHERE org_id = $1 AND pay_period_end >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY date_trunc('month', pay_period_end)
      ORDER BY month ASC
    `, [orgId]);

    // 5. Department breakdown with headcount + average salary
    const deptBreakdownResult = await pool.query(`
      SELECT COALESCE(u.department, 'Unassigned') as department,
             COUNT(u.id) as headcount,
             COALESCE(ROUND(AVG(p.base_salary), 2), 0) as avg_salary
      FROM users u
      LEFT JOIN (
        SELECT DISTINCT ON (user_id) user_id, base_salary
        FROM payroll WHERE org_id = $1
        ORDER BY user_id, pay_period_end DESC
      ) p ON u.id = p.user_id
      WHERE u.org_id = $1
      GROUP BY u.department
      ORDER BY headcount DESC
    `, [orgId]);

    // 6. Recruitment pipeline
    const recruitmentResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM job_postings WHERE org_id = $1 AND status = 'open') as open_positions,
        (SELECT COUNT(*) FROM applications WHERE org_id = $1 AND status = 'applied') as new_applications,
        (SELECT COUNT(*) FROM applications WHERE org_id = $1 AND status = 'interviewing') as interviewing,
        (SELECT COUNT(*) FROM applications WHERE org_id = $1 AND status = 'hired') as hired,
        (SELECT COUNT(*) FROM applications WHERE org_id = $1 AND status = 'rejected') as rejected,
        (SELECT COUNT(*) FROM applications WHERE org_id = $1) as total_applications
    `, [orgId]);

    // 7. Tenure distribution (group employees by tenure buckets)
    const tenureResult = await pool.query(`
      SELECT
        CASE
          WHEN EXTRACT(day FROM CURRENT_DATE - created_at) < 90 THEN '0-3 months'
          WHEN EXTRACT(day FROM CURRENT_DATE - created_at) < 180 THEN '3-6 months'
          WHEN EXTRACT(day FROM CURRENT_DATE - created_at) < 365 THEN '6-12 months'
          WHEN EXTRACT(day FROM CURRENT_DATE - created_at) < 730 THEN '1-2 years'
          ELSE '2+ years'
        END as bucket,
        COUNT(*) as count
      FROM users WHERE org_id = $1
      GROUP BY bucket
      ORDER BY MIN(EXTRACT(day FROM CURRENT_DATE - created_at)) ASC
    `, [orgId]);

    // 8. Role distribution
    const roleResult = await pool.query(`
      SELECT role, COUNT(*) as count FROM users WHERE org_id = $1 GROUP BY role ORDER BY count DESC
    `, [orgId]);

    res.json({
      headcount: {
        current: totalHeadcount,
        trend: headcountResult.rows.map(r => ({ month: r.month, new_hires: parseInt(r.new_hires), cumulative: parseInt(r.cumulative) }))
      },
      leave: {
        trends: leaveTrends,
        by_status: leaveStatusResult.rows.map(r => ({ status: r.status, count: parseInt(r.count) }))
      },
      payroll: {
        trends: payrollTrendsResult.rows.map(r => ({
          month: r.month,
          total_net: parseFloat(r.total_net || 0),
          total_base: parseFloat(r.total_base || 0),
          total_bonus: parseFloat(r.total_bonus || 0),
          total_tax: parseFloat(r.total_tax || 0),
          payslips: parseInt(r.payslips)
        }))
      },
      departments: deptBreakdownResult.rows.map(r => ({
        name: r.department,
        headcount: parseInt(r.headcount),
        avg_salary: parseFloat(r.avg_salary)
      })),
      recruitment: recruitmentResult.rows[0],
      tenure: tenureResult.rows.map(r => ({ bucket: r.bucket, count: parseInt(r.count) })),
      roles: roleResult.rows.map(r => ({ role: r.role, count: parseInt(r.count) }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getUserActivity, predictFlightRisk, getReports };