import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import ConfirmationCard from '../components/chat/ConfirmationCard';
import { Bot, Menu, Plus, Trash2, ChevronDown, X, Send, Clock, Terminal, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import useIsMobile from '../hooks/useIsMobile';

/* ── Resolve API errors into readable strings ───────────────────────────── */
const resolveError = (error) => {
  if (!error.response) return 'Could not reach the server. Check your connection and try again.';
  const s = error.response.status;
  const m = error.response.data?.error || error.response.data?.message;
  if (s === 401) return 'Your session expired. Please refresh and sign in again.';
  if (s === 403) return 'You do not have permission for this action.';
  if (s === 429) return 'Rate limit reached. Wait a moment and try again.';
  if (s >= 500) return m ? `Server error: ${m}` : 'A server error occurred. Check the logs.';
  return m || `Error ${s}`;
};

/* ── Format timestamp ───────────────────────────────────────────────────── */
const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* ── Thinking block (collapsible) ───────────────────────────────────────── */
const ThinkingBlock = ({ steps }) => {
  const [open, setOpen] = useState(false);
  if (!steps?.length) return null;
  return (
    <div style={{ marginBottom: '6px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 transition-colors"
        style={{ fontSize: '11px', color: open ? '#6B7280' : '#9CA3AF', fontFamily: 'var(--font-mono)' }}
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`} />
        {open ? 'hide reasoning' : `show reasoning (${steps.length} steps)`}
      </button>
      {open && (
        <div
          className="mt-1.5 space-y-1 pl-3"
          style={{ borderLeft: '2px solid #E5E7EB' }}
        >
          {steps.map((step, i) => (
            <p key={i} style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: '#D1D5DB' }}>›</span> {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Single message row ─────────────────────────────────────────────────── */
const MessageRow = ({ msg }) => {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div
          style={{
            maxWidth: '72%',
            backgroundColor: '#111318',
            color: '#F9FAFB',
            borderRadius: '6px 6px 2px 6px',
            padding: '8px 12px',
            fontSize: '13px',
            lineHeight: '1.6',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {msg.content}
        </div>
        <span style={{ fontSize: '10px', color: '#D1D5DB' }}>{fmtTime(msg.created_at)}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          fontSize: '12px',
          color: '#DC2626',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {msg.content}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <div
          style={{
            width: '18px', height: '18px', borderRadius: '3px',
            backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bot style={{ width: '11px', height: '11px', color: '#fff' }} />
        </div>
        <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>HR Genie</span>
        <span style={{ fontSize: '10px', color: '#D1D5DB', fontFamily: 'var(--font-mono)' }}>{fmtTime(msg.created_at)}</span>
      </div>
      <ThinkingBlock steps={msg.thinking_steps} />
      <div
        style={{
          fontSize: '13px',
          lineHeight: '1.7',
          color: '#111318',
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-mono)',
        }}
        dangerouslySetInnerHTML={{ __html: formatAssistantContent(msg.content) }}
      />
    </div>
  );
};

/* ── Simple markdown-like formatter ─────────────────────────────────────── */
function formatAssistantContent(content) {
  if (!content) return '';
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br />');
}

/* ── Typing indicator ───────────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-center gap-2">
    <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader style={{ width: '11px', height: '11px', color: '#fff', animation: 'spin 1s linear infinite' }} />
    </div>
    <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
      Checking records…
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const ChatPage = () => {
  const { t } = useTranslation();
  const { isHR } = useAuth();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [input, setInput] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => {
    if (activeConv) { fetchMessages(activeConv); setConfirmations([]); }
  }, [activeConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, confirmations]);

  const fetchConversations = async () => {
    try {
      const r = await chatAPI.getConversations();
      setConversations(r.data.conversations);
    } catch {}
  };

  const fetchMessages = async (id) => {
    try {
      const r = await chatAPI.getConversationMessages(id);
      setMessages(r.data.messages);
    } catch {}
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;
    setLoading(true);
    setConfirmations([]);
    setInput('');

    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const r = await chatAPI.sendMessage({ conversation_id: activeConv, message: content });
      const newId = r.data.conversation_id;
      if (!activeConv) { setActiveConv(newId); await fetchConversations(); }
      setMessages(prev => [...prev, r.data.message]);
      if (r.data.confirmations?.length) {
        setConfirmations(r.data.confirmations.map(c => ({ ...c, conversation_id: newId })));
      }
    } catch (err) {
      setMessages(prev => prev.slice(0, -1));
      const errText = resolveError(err);
      setMessages(prev => [...prev, userMsg, { role: 'error', content: errText, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const confirmAction = async (conf) => {
    try {
      const r = await chatAPI.confirmAction({ action: conf.action, params: conf.params, conversation_id: conf.conversation_id || activeConv });
      setMessages(prev => [...prev, { role: 'assistant', content: `✓ ${r.data.message}`, created_at: new Date().toISOString() }]);
      return r.data;
    } catch (err) {
      const errText = resolveError(err);
      setMessages(prev => [...prev, { role: 'error', content: errText, created_at: new Date().toISOString() }]);
      throw err;
    }
  };

  const rejectAction = (conf) => {
    setMessages(prev => [...prev, { role: 'assistant', content: `Cancelled: ${conf.summary}`, created_at: new Date().toISOString() }]);
  };

  const newChat = () => { setActiveConv(null); setMessages([]); setConfirmations([]); setHistoryOpen(false); };

  const deleteConv = async (id) => {
    try {
      await chatAPI.deleteConversation(id);
      if (activeConv === id) newChat();
      await fetchConversations();
    } catch {} finally { setDeleteConfirm(null); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const suggestions = isHR ? [
    "Who hasn't clocked in today?",
    'Show pending leave requests',
    'Overtime in Engineering this month',
    'Dashboard stats summary',
  ] : [
    t('chat.sickLeavePolicy'),
    t('chat.vacationDays'),
    t('chat.needLeave'),
    t('chat.remoteWorkPolicy'),
  ];

  const panelHeight = isMobile ? 'h-[calc(100vh-10rem)]' : 'h-[calc(100vh-4rem)]';

  return (
    <>
      <div className={`${panelHeight} flex gap-4 animate-fadeIn -m-6`}>

        {/* Conversation history — sidebar */}
        <div
          className="hidden lg:flex flex-col"
          style={{ width: '220px', minWidth: '220px', borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid #E5E7EB' }}
          >
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              History
            </span>
            <button onClick={newChat} className="btn-ghost p-1" title="New conversation (N)">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {conversations.length === 0 && (
              <p style={{ fontSize: '12px', color: '#D1D5DB', padding: '12px 16px' }}>No conversations yet</p>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                className="group flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: activeConv === conv.id ? '#F7F7F6' : 'transparent',
                  borderLeft: activeConv === conv.id ? '2px solid #111318' : '2px solid transparent',
                }}
                onClick={() => setActiveConv(conv.id)}
                onMouseEnter={e => { if (activeConv !== conv.id) e.currentTarget.style.backgroundColor = '#FAFAFA'; }}
                onMouseLeave={e => { if (activeConv !== conv.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: '12px', color: activeConv === conv.id ? '#111318' : '#6B7280' }}
                >
                  {conv.title || 'Untitled'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteConfirm(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white" style={{ borderLeft: '1px solid #E5E7EB' }}>

          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-5 flex-shrink-0"
            style={{ height: '52px', borderBottom: '1px solid #E5E7EB' }}
          >
            <button onClick={() => setHistoryOpen(true)} className="lg:hidden btn-ghost p-1">
              <Menu className="w-4 h-4" />
            </button>
            <div
              style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Terminal style={{ width: '12px', height: '12px', color: '#fff' }} />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111318' }}>HR Genie</span>
              <span className="chip chip-green" style={{ fontSize: '10px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block', marginRight: '3px' }} />
                online
              </span>
            </div>
            {activeConv && (
              <button onClick={newChat} className="ml-auto btn-ghost" style={{ fontSize: '12px' }}>
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            )}
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-5"
            style={{ backgroundColor: '#FAFAFA' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-start justify-center h-full max-w-lg">
                <div
                  style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}
                >
                  <Terminal style={{ width: '16px', height: '16px', color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: '500', color: '#111318', marginBottom: '4px' }}>
                  HR terminal ready
                </h2>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
                  {isHR
                    ? 'Query employees, approve requests, check attendance, run reports — in plain language.'
                    : 'Ask about policies, check your leave balance, request time off, or get HR answers instantly.'}
                </p>
                <p style={{ fontSize: '10px', color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Suggested queries
                </p>
                <div className="space-y-1.5 w-full">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left px-3 py-2 rounded transition-colors"
                      style={{
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        fontSize: '12px',
                        color: '#374151',
                        fontFamily: 'var(--font-mono)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#A1A1AA'; e.currentTarget.style.color = '#111318'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                    >
                      <span style={{ color: '#D1D5DB', marginRight: '8px' }}>›</span>{s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageRow key={i} msg={msg} />
                ))}
                {confirmations.map((conf, i) => (
                  <ConfirmationCard
                    key={`c-${i}`}
                    confirmation={conf}
                    onConfirm={confirmAction}
                    onReject={rejectAction}
                  />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Persistent suggestion chips when in conversation */}
          {!loading && messages.length > 0 && (
            <div
              className="flex gap-1.5 flex-wrap px-5 py-2 flex-shrink-0"
              style={{ borderTop: '1px solid #F3F4F6', backgroundColor: '#FFFFFF' }}
            >
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="transition-colors"
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    color: '#6B7280',
                    backgroundColor: 'transparent',
                    fontFamily: 'var(--font-mono)',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#A1A1AA'; e.currentTarget.style.color = '#111318'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="px-5 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your HR data… (Enter to send, Shift+Enter for newline)"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none outline-none"
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: '#111318',
                  backgroundColor: 'transparent',
                  border: 'none',
                  lineHeight: '1.6',
                  padding: '4px 0',
                  maxHeight: '120px',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 transition-colors"
                style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  backgroundColor: input.trim() && !loading ? '#111318' : '#F3F4F6',
                  color: input.trim() && !loading ? '#fff' : '#D1D5DB',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p style={{ fontSize: '10px', color: '#D1D5DB', marginTop: '4px' }}>
              Enter ↵ to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Mobile history overlay */}
      {historyOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setHistoryOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-white flex flex-col animate-slideInRight" style={{ borderRight: '1px solid #E5E7EB' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>Conversations</span>
              <button onClick={() => setHistoryOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className="px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ fontSize: '13px', color: activeConv === conv.id ? '#111318' : '#6B7280' }}
                  onClick={() => { setActiveConv(conv.id); setHistoryOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {conv.title || 'Untitled'}
                </div>
              ))}
            </div>
            <div className="p-3" style={{ borderTop: '1px solid #E5E7EB' }}>
              <button onClick={newChat} className="btn-secondary w-full">
                <Plus className="w-3.5 h-3.5" /> New conversation
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConv(deleteConfirm)}
        title="Delete conversation?"
        message="This conversation and all its messages will be permanently deleted."
        confirmLabel="Delete"
      />
    </>
  );
};

export default ChatPage;