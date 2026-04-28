const pool = require('../config/database');
const openai = require('../config/openai');

const SYSTEM_PROMPT = `You are an intelligent HR Assistant for a company. Your role is to help employees with:
- HR policies and procedures
- Leave requests and balance inquiries
- Benefits information
- Onboarding questions
- General workplace queries

Be professional, friendly, and concise. If you need to perform an action (like checking leave balance or submitting a leave request), use the available functions.`;

const FUNCTIONS = [
  {
    name: "get_leave_balance",
    description: "Get the current leave balance for the user (sick leave and vacation days)",
    parameters: { type: "object", properties: {}, required: [] }
  },
  {
    name: "submit_leave_request",
    description: "Submit a leave request for the user",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["sick", "vacation", "personal"], description: "The type of leave" },
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        reason: { type: "string", description: "Reason for the leave request" }
      },
      required: ["type", "start_date", "end_date"]
    }
  },
  {
    name: "search_knowledge_base",
    description: "Search the company knowledge base for policies, procedures, and information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        category: { type: "string", enum: ["policies", "benefits", "procedures", "faq"], description: "Optional category to filter results" }
      },
      required: ["query"]
    }
  }
];

const executeFunctionCall = async (functionName, args, userId, orgId) => {
  switch (functionName) {
    case "get_leave_balance":
      const balanceResult = await pool.query(
        'SELECT sick_leave_balance, vacation_balance FROM users WHERE id = $1',
        [userId]
      );
      return balanceResult.rows[0];

    case "submit_leave_request":
      const { type, start_date, end_date, reason } = args;
      const start = new Date(start_date);
      const end = new Date(end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const leaveResult = await pool.query(
        `INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, org_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
        [userId, type, start_date, end_date, days, reason || null, orgId]
      );
      return leaveResult.rows[0];

    case "search_knowledge_base":
      const { query, category } = args;
      let searchQuery = `
        SELECT id, title, content, category 
        FROM knowledge_base 
        WHERE (content ILIKE $1 OR title ILIKE $1) AND org_id = $2
      `;
      const searchParams = [`%${query}%`, orgId];
      if (category) {
        searchQuery += ' AND category = $3';
        searchParams.push(category);
      }
      searchQuery += ' LIMIT 3';
      const searchResult = await pool.query(searchQuery, searchParams);
      return searchResult.rows;

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversation_id, message } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversationId = conversation_id;

    if (!conversationId) {
      const newConv = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, message.substring(0, 50)]
      );
      conversationId = newConv.rows[0].id;
    } else {
      const convCheck = await pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      if (convCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }
    }

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'user', message]
    );

    const history = await pool.query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [conversationId]
    );

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.rows.reverse().map(msg => ({ role: msg.role, content: msg.content }))
    ];

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      functions: FUNCTIONS,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    let assistantMessage = response.choices[0].message;

    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);
      const functionResult = await executeFunctionCall(functionName, functionArgs, userId, orgId);

      await pool.query(
        'INSERT INTO messages (conversation_id, role, content, function_call) VALUES ($1, $2, $3, $4)',
        [conversationId, 'assistant', '', JSON.stringify({ name: functionName, arguments: functionArgs, result: functionResult })]
      );

      messages.push(assistantMessage);
      messages.push({ role: 'function', name: functionName, content: JSON.stringify(functionResult) });

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      assistantMessage = response.choices[0].message;
    }

    const savedMessage = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, 'assistant', assistantMessage.content]
    );

    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    await pool.query(
      'INSERT INTO analytics_logs (user_id, action_type, query, org_id) VALUES ($1, $2, $3, $4)',
      [userId, 'chat_message', message, orgId]
    );

    res.json({ conversation_id: conversationId, message: savedMessage.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT c.id, c.title, c.last_message_at, c.created_at,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );
    res.json({ conversations: result.rows });
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    const result = await pool.query(
      `SELECT id, role, content, function_call, created_at
       FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getConversations, getConversationMessages, deleteConversation };