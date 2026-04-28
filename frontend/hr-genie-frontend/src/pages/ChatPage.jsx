import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConversationList from '../components/chat/ConversationList';
import { Bot, Menu, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatPage = () => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    if (window.confirm(t('chat.deleteConversation'))) {
      try {
        await chatAPI.deleteConversation(id);
        if (activeConversation === id) {
          handleNewConversation();
        }
        await fetchConversations();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  const suggestions = [
    t('chat.sickLeavePolicy'),
    t('chat.vacationDays'),
    t('chat.needLeave'),
    t('chat.remoteWorkPolicy')
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fadeIn">
      <div className="hidden lg:block w-80 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelect={(id) => setActiveConversation(id)}
          onDelete={handleDeleteConversation}
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
              onDelete={handleDeleteConversation}
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
          <div className="w-10 h-10 bg-zinc-900 rounded-md flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-zinc-900">{t('chat.hrAssistant')}</h2>
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
                <div className="w-16 h-16 bg-zinc-900 rounded-md flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-[18px] font-bold text-zinc-900 mb-2 tracking-tight">
                  {t('chat.welcomeToHrGenie')}
                </h3>
                <p className="text-zinc-500 mb-8 text-[13px] leading-relaxed">
                  {t('chat.imYourAiAssistant')}
                </p>
                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">{t('chat.commonQuestions')}</p>
                  <div className="space-y-2">
                    {suggestions.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(example)}
                        className="w-full text-left px-4 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-700 hover:text-zinc-900 transition-all shadow-sm"
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
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 shadow-sm">
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
  );
};

export default ChatPage;