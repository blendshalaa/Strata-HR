import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConversationList from '../components/chat/ConversationList';
import ConfirmationCard from '../components/chat/ConfirmationCard';
import { Bot, Menu, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

// Translates axios errors into a friendly, actionable message
const resolveChatError = (error) => {
  if (!error.response) {
    // Network failure or CORS block
    return '⚠️ Could not reach the server. This usually means the API URL is misconfigured or the backend is offline. Check your VITE_API_URL environment variable and make sure CORS is set correctly on the server.';
  }
  const status = error.response.status;
  const serverMsg = error.response.data?.error || error.response.data?.message;
  if (status === 401) return '🔒 Your session has expired. Please refresh the page and log in again.';
  if (status === 403) return '🚫 You do not have permission to perform this action.';
  if (status === 429) return '⏳ Too many requests — you\'ve hit the AI rate limit. Please wait a minute and try again.';
  if (status === 500 || status === 502 || status === 503) {
    if (serverMsg?.toLowerCase().includes('openai') || serverMsg?.toLowerCase().includes('api key')) {
      return '🤖 The AI service is unavailable. The OPENAI_API_KEY may not be set on the server. Please contact your administrator.';
    }
    return `❌ Server error (${status}): ${serverMsg || 'Something went wrong on the backend. Check the server logs.'}` ;
  }
  return `❌ Error ${status}: ${serverMsg || 'An unexpected error occurred.'}`;
};


const ChatPage = () => {
  const { t } = useTranslation();
  const { isHR } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [confirmations, setConfirmations] = useState([]); // pending confirmation cards
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      setConfirmations([]); // clear confirmations when switching convos
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, confirmations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getConversationMessages(conversationId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (content) => {
    setLoading(true);
    setConfirmations([]);

    const userMessage = {
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatAPI.sendMessage({
        conversation_id: activeConversation,
        message: content,
      });

      const newConversationId = response.data.conversation_id;

      if (!activeConversation) {
        setActiveConversation(newConversationId);
        await fetchConversations();
      }

      setMessages((prev) => [...prev, response.data.message]);

      // Handle confirmations from AI copilot
      if (response.data.confirmations && response.data.confirmations.length > 0) {
        setConfirmations(response.data.confirmations.map(c => ({
          ...c,
          conversation_id: newConversationId
        })));
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove the optimistically added user message on failure
      setMessages((prev) => prev.slice(0, -1));
      // Push a typed error bubble
      const errMsg = resolveChatError(error);
      setMessages((prev) => [...prev, userMessage, {
        role: 'error',
        content: errMsg,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (confirmation) => {
    try {
      const response = await chatAPI.confirmAction({
        action: confirmation.action,
        params: confirmation.params,
        conversation_id: confirmation.conversation_id || activeConversation,
      });

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `✅ ${response.data.message}`,
        created_at: new Date().toISOString(),
      }]);

      return response.data;
    } catch (error) {
      console.error('Confirm action error:', error);
      const errMsg = resolveChatError(error);
      setMessages((prev) => [...prev, {
        role: 'error',
        content: errMsg,
        created_at: new Date().toISOString(),
      }]);
      throw error;
    }
  };

  const handleRejectAction = (confirmation) => {
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: `🚫 Cancelled: ${confirmation.summary}`,
      created_at: new Date().toISOString(),
    }]);
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setConfirmations([]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await chatAPI.deleteConversation(id);
      if (activeConversation === id) {
        handleNewConversation();
      }
      await fetchConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const suggestions = isHR ? [
    'Who hasn\'t clocked in today?',
    'Show me all pending leave requests',
    'How much overtime did Engineering log this month?',
    'What are the dashboard stats?'
  ] : [
    t('chat.sickLeavePolicy'),
    t('chat.vacationDays'),
    t('chat.needLeave'),
    t('chat.remoteWorkPolicy')
  ];

  return (
    <>
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fadeIn">
      <div className="hidden lg:block w-80 rounded-lg overflow-hidden border border-zinc-200">
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelect={(id) => setActiveConversation(id)}
          onDelete={(id) => setDeleteConfirm(id)}
          onNew={handleNewConversation}
        />
      </div>

      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-zinc-900/40 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-80 z-50 animate-slideIn">
            <ConversationList
              conversations={conversations}
              activeConversation={activeConversation}
              onSelect={(id) => {
                setActiveConversation(id);
                setSidebarOpen(false);
              }}
              onDelete={(id) => setDeleteConfirm(id)}
              onNew={handleNewConversation}
            />
          </div>
        </>
      )}

      <div className="flex-1 bg-white rounded-lg border border-zinc-200 shadow-sm p-0 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <Menu className="w-4 h-4 text-zinc-500" />
          </button>
          <div className="w-10 h-10 bg-[#5B4FE8] rounded-md flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-zinc-900 flex items-center gap-1.5">
              {t('chat.hrAssistant')}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5" /> Copilot
              </span>
            </h2>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t('chat.aiPoweredOnline')}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm px-6">
                <div className="w-16 h-16 bg-[#5B4FE8] rounded-md flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-[18px] font-bold text-zinc-900 mb-2 tracking-tight">
                  {t('chat.welcomeToHrGenie')}
                </h3>
                <p className="text-zinc-500 mb-2 text-[13px] leading-relaxed">
                  {t('chat.imYourAiAssistant')}
                </p>
                <p className="text-zinc-400 mb-8 text-[12px] leading-relaxed">
                  I can query employees, check attendance, manage leave requests, and more. {isHR ? 'As HR, I can also approve leave and create shifts for you.' : ''}
                </p>
                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">
                    {isHR ? '⚡ Try these copilot commands' : t('chat.commonQuestions')}
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(example)}
                        className="w-full text-left px-4 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-700 hover:text-zinc-900 transition-all"
                      >
                        <span className="flex items-center gap-3">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          {example}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}

              {/* Confirmation cards */}
              {confirmations.map((conf, index) => (
                <ConfirmationCard
                  key={`confirm-${index}`}
                  confirmation={conf}
                  onConfirm={handleConfirmAction}
                  onReject={handleRejectAction}
                />
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#5B4FE8] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-lg px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSend={handleSendMessage} loading={loading} />
      </div>
    </div>

    <ConfirmDialog
      isOpen={!!deleteConfirm}
      onClose={() => setDeleteConfirm(null)}
      onConfirm={() => handleDeleteConversation(deleteConfirm)}
      title={t('common.confirmDeleteTitle')}
      message={t('chat.deleteConversation')}
      confirmLabel={t('common.delete')}
    />
  </>
  );
};

export default ChatPage;