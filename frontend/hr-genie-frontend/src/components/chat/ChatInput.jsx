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
    <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-lg border-t border-zinc-100 shrink-0">
      <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full p-1.5 pl-5 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900 transition-all shadow-sm">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything or give a command..."
          className="w-full bg-transparent text-[14px] font-medium text-zinc-900 focus:outline-none placeholder:text-zinc-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-[#111318] text-white p-2.5 rounded-full hover:bg-[#374151] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center shadow-md"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-center mt-3">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
          <Zap className="w-3 h-3 text-zinc-900" />
          Copilot is active and can take actions
        </p>
      </div>
    </form>
  );
};

export default ChatInput;