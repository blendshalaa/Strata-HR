import React from 'react';
import { Bot, User, CheckCircle } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isFunction = message.function_call;

  if (isFunction) {
    const functionData = typeof message.function_call === 'string' 
      ? JSON.parse(message.function_call) 
      : message.function_call;

    return (
      <div className="flex items-center justify-center my-6">
        <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-zinc-900" />
          <span className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider">
            Action: {functionData.name.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-zinc-900 text-white'
            : 'bg-zinc-50 border border-zinc-200 text-zinc-900'
        }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${isUser ? 'text-zinc-400' : 'text-zinc-400'}`}>
          {new Date(message.created_at).toLocaleTimeString('en', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;