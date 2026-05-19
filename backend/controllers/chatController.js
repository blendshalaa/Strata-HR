const pool = require('../config/database');
const openai = require('../config/openai');

// ────────────────────────────────────────────
// System prompt — tells the AI what it can do
// ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are HR Genie, an AI HR copilot. You can both ANSWER questions and TAKE ACTIONS in the HR system.

CAPABILITIES:
- Query employees, departments, leave requests, timesheets, payroll, shifts, goals
- Approve or reject leave requests (HR/admin only)
- Create shifts and calendar events (HR/admin only)
- Search the knowledge base
- Check leave balances

RULES:
1. Always use the available tools to get real data — never make up employee names, balances, or stats.
2. For write actions (approve, reject, create), ALWAYS use the tool — the system will ask the user to confirm before executing.
3. Be concise and professional. Format data clearly using bullet points or short tables.
4. If the user asks for something you can't do, explain what you CAN do instead.
5. Respect role-based access — if a tool returns an access error, explain it to the user.`;

// ────────────────────────────────────────────
// OpenAI Tool Definitions (function calling)
// ────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_leave_balance',
      description: 'Get leave balance (sick + vacation days) for the current user',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_employees',
      description: 'Search or list employees in the organization. Can filter by department or name.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Name or email to search for (optional)' },
          department: { type: 'string', description: 'Filter by department name (optional)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_leave_requests',
      description: 'Get leave requests. Can filter by status (pending/approved/rejected).',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'], description: 'Filter by status' },
          user_id: { type: 'integer', description: 'Filter by specific employee ID' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'approve_leave_request',
      description: 'Approve a pending leave request. Requires HR/admin role. Returns a confirmation card — the user must confirm before execution.',
      parameters: {
        type: 'object',
        properties: {
          leave_id: { type: 'integer', description: 'The ID of the leave request to approve' }
        },
        required: ['leave_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reject_leave_request',
      description: 'Reject a pending leave request. Requires HR/admin role.',
      parameters: {
        type: 'object',
        properties: {
          leave_id: { type: 'integer', description: 'The ID of the leave request to reject' }
        },
        required: ['leave_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_timesheets_today',
      description: 'Get today\'s attendance — who clocked in and who hasn\'t.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_payroll_summary',
      description: 'Get payroll summary — total pending/paid, by department.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'paid'], description: 'Filter by payroll status' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_overtime',
      description: 'Get overtime hours for employees, optionally filtered by department or date range.',
      parameters: {
        type: 'object',
        properties: {
          department: { type: 'string', description: 'Filter by department' },
          days: { type: 'integer', description: 'Look back N days (default 30)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_shift',
      description: 'Create a shift for an employee. Requires HR/admin. Returns confirmation card.',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'integer', description: 'Employee ID' },
          shift_date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          start_time: { type: 'string', description: 'Start time HH:MM' },
          end_time: { type: 'string', description: 'End time HH:MM' },
          shift_type: { type: 'string', enum: ['regular', 'morning', 'evening', 'night'], description: 'Type of shift' }
        },
        required: ['user_id', 'shift_date', 'start_time', 'end_time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Create a calendar event. Requires HR/admin. Returns confirmation card.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Event description' },
          event_date: { type: 'string', description: 'Date/time in ISO format' }
        },
        required: ['title', 'event_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Search company knowledge base for policies, procedures, FAQ.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'submit_leave_request',
      description: 'Submit a leave request for the current user. Returns confirmation card.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['sick', 'vacation', 'personal'], description: 'Leave type' },
          start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
          end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
          reason: { type: 'string', description: 'Reason for leave' }
        },
        required: ['type', 'start_date', 'end_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get organization dashboard stats — total employees, pending requests, today\'s attendance.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
];

// ────────────────────────────────────────────
// Write actions that require user confirmation
// ────────────────────────────────────────────
const WRITE_ACTIONS = new Set([
  'approve_leave_request',
  'reject_leave_request',
  'create_shift',
  'create_event',
  'submit_leave_request'
]);

// ────────────────────────────────────────────
// Tool Executor — runs queries scoped to org
// ────────────────────────────────────────────
const executeToolCall = async (toolName, args, userId, orgId, userRole) => {
  const isHROrAdmin = userRole === 'hr' || userRole === 'admin';

  switch (toolName) {
    case 'get_leave_balance': {
      const r = await pool.query('SELECT sick_leave_balance, vacation_balance FROM users WHERE id = $1', [userId]);
      return { type: 'data', data: r.rows[0] };
    }

    case 'query_employees': {
      let q = 'SELECT id, name, email, department, role, hire_date FROM users WHERE org_id = $1';
      const params = [orgId];
      let i = 2;
      if (args.search) { q += ` AND (name ILIKE $${i} OR email ILIKE $${i})`; params.push(`%${args.search}%`); i++; }
      if (args.department) { q += ` AND department ILIKE $${i}`; params.push(`%${args.department}%`); i++; }
      q += ' ORDER BY name LIMIT 20';
      const r = await pool.query(q, params);
      return { type: 'data', data: r.rows, count: r.rows.length };
    }

    case 'query_leave_requests': {
      if (!isHROrAdmin) return { type: 'error', message: 'Only HR/admin can view all leave requests.' };
      let q = `SELECT lr.id, lr.type, lr.start_date, lr.end_date, lr.days, lr.status, lr.reason, u.name as employee_name
               FROM leave_requests lr JOIN users u ON lr.user_id = u.id WHERE lr.org_id = $1`;
      const params = [orgId];
      let i = 2;
      if (args.status) { q += ` AND lr.status = $${i}`; params.push(args.status); i++; }
      if (args.user_id) { q += ` AND lr.user_id = $${i}`; params.push(args.user_id); i++; }
      q += ' ORDER BY lr.created_at DESC LIMIT 20';
      const r = await pool.query(q, params);
      return { type: 'data', data: r.rows, count: r.rows.length };
    }

    case 'approve_leave_request': {
      if (!isHROrAdmin) return { type: 'error', message: 'Only HR/admin can approve leave requests.' };
      const lr = await pool.query(
        `SELECT lr.*, u.name as employee_name FROM leave_requests lr JOIN users u ON lr.user_id = u.id WHERE lr.id = $1 AND lr.org_id = $2`,
        [args.leave_id, orgId]
      );
      if (lr.rows.length === 0) return { type: 'error', message: 'Leave request not found.' };
      if (lr.rows[0].status !== 'pending') return { type: 'error', message: `Request is already ${lr.rows[0].status}.` };
      return {
        type: 'confirmation',
        action: 'approve_leave_request',
        params: { leave_id: args.leave_id },
        summary: `Approve ${lr.rows[0].type} leave for ${lr.rows[0].employee_name} (${lr.rows[0].start_date} to ${lr.rows[0].end_date}, ${lr.rows[0].days} days)`
      };
    }

    case 'reject_leave_request': {
      if (!isHROrAdmin) return { type: 'error', message: 'Only HR/admin can reject leave requests.' };
      const lr = await pool.query(
        `SELECT lr.*, u.name as employee_name FROM leave_requests lr JOIN users u ON lr.user_id = u.id WHERE lr.id = $1 AND lr.org_id = $2`,
        [args.leave_id, orgId]
      );
      if (lr.rows.length === 0) return { type: 'error', message: 'Leave request not found.' };
      if (lr.rows[0].status !== 'pending') return { type: 'error', message: `Request is already ${lr.rows[0].status}.` };
      return {
        type: 'confirmation',
        action: 'reject_leave_request',
        params: { leave_id: args.leave_id },
        summary: `Reject ${lr.rows[0].type} leave for ${lr.rows[0].employee_name} (${lr.rows[0].start_date} to ${lr.rows[0].end_date})`
      };
    }

    case 'query_timesheets_today': {
      const today = new Date().toISOString().split('T')[0];
      const clockedIn = await pool.query(
        `SELECT u.name, u.department, t.clock_in, t.clock_out
         FROM timesheets t JOIN users u ON t.user_id = u.id
         WHERE t.org_id = $1 AND DATE(t.clock_in) = $2 ORDER BY t.clock_in`,
        [orgId, today]
      );
      const allUsers = await pool.query('SELECT id, name, department FROM users WHERE org_id = $1', [orgId]);
      const clockedIds = new Set(clockedIn.rows.map(r => r.name));
      const notClockedIn = allUsers.rows.filter(u => !clockedIds.has(u.name));
      return { type: 'data', clocked_in: clockedIn.rows, not_clocked_in: notClockedIn, date: today };
    }

    case 'query_payroll_summary': {
      let q = `SELECT p.status, COUNT(*) as count, SUM(p.net_salary) as total, u.department
               FROM payroll p JOIN users u ON p.user_id = u.id WHERE p.org_id = $1`;
      const params = [orgId];
      if (args.status) { q += ' AND p.status = $2'; params.push(args.status); }
      q += ' GROUP BY p.status, u.department ORDER BY u.department';
      const r = await pool.query(q, params);
      return { type: 'data', data: r.rows };
    }

    case 'query_overtime': {
      const days = parseInt(args.days) || 30;
      let q = `SELECT u.name, u.department, SUM(t.overtime_hours) as total_overtime
               FROM timesheets t JOIN users u ON t.user_id = u.id
               WHERE t.org_id = $1 AND t.clock_in >= NOW() - make_interval(days => $2)`;
      const params = [orgId, days];
      let i = 3;
      if (args.department) { q += ` AND u.department ILIKE $${i}`; params.push(`%${args.department}%`); }
      q += ' GROUP BY u.name, u.department HAVING SUM(t.overtime_hours) > 0 ORDER BY total_overtime DESC LIMIT 20';
      const r = await pool.query(q, params);
      return { type: 'data', data: r.rows, period_days: days };
    }

    case 'create_shift': {
      if (!isHROrAdmin) return { type: 'error', message: 'Only HR/admin can create shifts.' };
      const emp = await pool.query('SELECT name FROM users WHERE id = $1 AND org_id = $2', [args.user_id, orgId]);
      if (emp.rows.length === 0) return { type: 'error', message: 'Employee not found.' };
      return {
        type: 'confirmation',
        action: 'create_shift',
        params: args,
        summary: `Create ${args.shift_type || 'regular'} shift for ${emp.rows[0].name} on ${args.shift_date} (${args.start_time} - ${args.end_time})`
      };
    }

    case 'create_event': {
      if (!isHROrAdmin) return { type: 'error', message: 'Only HR/admin can create events.' };
      return {
        type: 'confirmation',
        action: 'create_event',
        params: args,
        summary: `Create event "${args.title}" on ${args.event_date}`
      };
    }

    case 'submit_leave_request': {
      const start = new Date(args.start_date);
      const end = new Date(args.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return {
        type: 'confirmation',
        action: 'submit_leave_request',
        params: { ...args, days },
        summary: `Submit ${args.type} leave from ${args.start_date} to ${args.end_date} (${days} days)${args.reason ? ` — "${args.reason}"` : ''}`
      };
    }

    case 'search_knowledge_base': {
      const r = await pool.query(
        `SELECT title, content, category FROM knowledge_base WHERE (title ILIKE $1 OR content ILIKE $1) AND org_id = $2 LIMIT 3`,
        [`%${args.query}%`, orgId]
      );
      return { type: 'data', data: r.rows };
    }

    case 'get_dashboard_stats': {
      const employees = await pool.query('SELECT COUNT(*) FROM users WHERE org_id = $1', [orgId]);
      const pendingLeave = await pool.query("SELECT COUNT(*) FROM leave_requests WHERE org_id = $1 AND status = 'pending'", [orgId]);
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = await pool.query('SELECT COUNT(DISTINCT user_id) FROM timesheets WHERE org_id = $1 AND DATE(clock_in) = $2', [orgId, today]);
      return {
        type: 'data',
        data: {
          total_employees: parseInt(employees.rows[0].count),
          pending_leave_requests: parseInt(pendingLeave.rows[0].count),
          clocked_in_today: parseInt(todayAttendance.rows[0].count)
        }
      };
    }

    default:
      return { type: 'error', message: `Unknown tool: ${toolName}` };
  }
};

// ────────────────────────────────────────────
// Execute a confirmed write action
// ────────────────────────────────────────────
const executeConfirmedAction = async (action, params, userId, orgId) => {
  switch (action) {
    case 'approve_leave_request': {
      await pool.query("UPDATE leave_requests SET status = 'approved', approved_by = $1 WHERE id = $2 AND org_id = $3", [userId, params.leave_id, orgId]);
      return { success: true, message: 'Leave request approved.' };
    }
    case 'reject_leave_request': {
      await pool.query("UPDATE leave_requests SET status = 'rejected', approved_by = $1 WHERE id = $2 AND org_id = $3", [userId, params.leave_id, orgId]);
      return { success: true, message: 'Leave request rejected.' };
    }
    case 'create_shift': {
      await pool.query(
        `INSERT INTO shifts (user_id, shift_date, start_time, end_time, shift_type, created_by, org_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [params.user_id, params.shift_date, params.start_time, params.end_time, params.shift_type || 'regular', userId, orgId]
      );
      return { success: true, message: 'Shift created.' };
    }
    case 'create_event': {
      await pool.query(
        `INSERT INTO calendar_events (title, description, event_date, created_by, org_id) VALUES ($1,$2,$3,$4,$5)`,
        [params.title, params.description || '', params.event_date, userId, orgId]
      );
      return { success: true, message: 'Event created.' };
    }
    case 'submit_leave_request': {
      await pool.query(
        `INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, org_id) VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)`,
        [userId, params.type, params.start_date, params.end_date, params.days, params.reason || null, orgId]
      );
      return { success: true, message: 'Leave request submitted.' };
    }
    default:
      return { success: false, message: 'Unknown action.' };
  }
};

// ────────────────────────────────────────────
// Main chat handler
// ────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { conversation_id, message } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const userRole = req.user.role;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let conversationId = conversation_id;
    if (!conversationId) {
      const newConv = await pool.query(
        'INSERT INTO conversations (user_id, title, org_id) VALUES ($1, $2, $3) RETURNING id',
        [userId, message.substring(0, 50), orgId]
      );
      conversationId = newConv.rows[0].id;
    } else {
      const convCheck = await pool.query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [conversationId, userId]);
      if (convCheck.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    }

    // Save user message
    await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [conversationId, 'user', message]);

    // Build conversation history
    const history = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 20',
      [conversationId]
    );
    const messages_list = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.rows.reverse().map(msg => ({ role: msg.role === 'tool' ? 'user' : msg.role, content: msg.content }))
    ];

    // Call OpenAI with tools
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages_list,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.5,
      max_tokens: 800
    });

    let assistantMsg = response.choices[0].message;
    let pendingConfirmations = [];
    let toolResults = [];

    // Process tool calls if any
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      for (const tc of assistantMsg.tool_calls) {
        const toolName = tc.function.name;
        const toolArgs = JSON.parse(tc.function.arguments);
        const result = await executeToolCall(toolName, toolArgs, userId, orgId, userRole);

        if (result.type === 'confirmation') {
          pendingConfirmations.push(result);
        }
        toolResults.push({ tool_call_id: tc.id, name: toolName, result });
      }

      // Build tool response messages for OpenAI
      const toolMessages = toolResults.map(tr => ({
        role: 'tool',
        tool_call_id: tr.tool_call_id,
        content: JSON.stringify(tr.result)
      }));

      // If there are pending confirmations, skip the second OpenAI call — return confirmation cards directly
      if (pendingConfirmations.length > 0) {
        const confirmText = pendingConfirmations.map(c => `⏳ Pending confirmation: ${c.summary}`).join('\n');
        await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [conversationId, 'assistant', confirmText]);
        await pool.query('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);

        return res.json({
          conversation_id: conversationId,
          message: { role: 'assistant', content: confirmText, created_at: new Date().toISOString() },
          confirmations: pendingConfirmations
        });
      }

      // For read-only tools, get a natural language summary from OpenAI
      messages_list.push(assistantMsg);
      messages_list.push(...toolMessages);

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages_list,
        temperature: 0.5,
        max_tokens: 800
      });
      assistantMsg = response.choices[0].message;
    }

    // Save and return response
    const saved = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id, conversation_id, role, content, created_at',
      [conversationId, 'assistant', assistantMsg.content]
    );
    await pool.query('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [conversationId]);
    await pool.query('INSERT INTO analytics_logs (user_id, action_type, query, org_id) VALUES ($1, $2, $3, $4)', [userId, 'chat_message', message, orgId]);

    res.json({ conversation_id: conversationId, message: saved.rows[0] });
  } catch (error) {
    // Surface OpenAI-specific errors so the frontend can give actionable advice
    const isOpenAIError = error?.constructor?.name === 'APIError'
      || error?.status != null
      || error?.code === 'insufficient_quota'
      || error?.code === 'ENOTFOUND'
      || error?.code === 'ECONNREFUSED';
    if (isOpenAIError) {
      const msg = error.message || 'OpenAI API error';
      return res.status(502).json({ error: 'OpenAI API error: ' + msg });
    }
    next(error);
  }
};

// ────────────────────────────────────────────
// Confirm a pending action from the chat
// ────────────────────────────────────────────
const confirmAction = async (req, res, next) => {
  try {
    const { action, params, conversation_id } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    if (!action || !params) return res.status(400).json({ error: 'Action and params required' });
    if (!WRITE_ACTIONS.has(action)) return res.status(400).json({ error: 'Invalid action' });

    const result = await executeConfirmedAction(action, params, userId, orgId);

    // Save confirmation to chat
    if (conversation_id) {
      const msg = result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
      await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [conversation_id, 'assistant', msg]);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// Conversation CRUD (unchanged)
// ────────────────────────────────────────────
const getConversations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.last_message_at, c.created_at,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c WHERE c.user_id = $1 ORDER BY c.last_message_at DESC`,
      [req.user.id]
    );
    res.json({ conversations: result.rows });
  } catch (error) { next(error); }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const convCheck = await pool.query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (convCheck.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json({ messages: result.rows });
  } catch (error) { next(error); }
};

const deleteConversation = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { sendMessage, confirmAction, getConversations, getConversationMessages, deleteConversation };