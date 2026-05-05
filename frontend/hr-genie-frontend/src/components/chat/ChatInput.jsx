import React, { useState } from 'react';
import { Send, Loader, Zap } from 'lucide-react';

const ChatInput = ({ onSend, loading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-5 bg-white">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything or give a command — I can take actions for you..."
          className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-3 flex items-center gap-1.5">
        <Zap className="w-3 h-3" />
        Copilot — "Who's on leave today?" · "Approve leave #4" · "Show overtime this month"
      </p>
    </form>
  );
};

export default ChatInput;