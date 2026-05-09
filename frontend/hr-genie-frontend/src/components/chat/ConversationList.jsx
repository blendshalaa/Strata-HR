import React from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

const ConversationList = ({ 
  conversations, 
  activeConversation, 
  onSelect, 
  onDelete, 
  onNew 
}) => {
  return (
    <div className="h-full flex flex-col bg-white border-r border-zinc-200">
      <div className="p-5 border-b border-zinc-100">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-200" />
            <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative p-3 rounded-md cursor-pointer transition-colors ${
                activeConversation === conv.id
                  ? 'bg-zinc-50 border border-zinc-200'
                  : 'hover:bg-zinc-50 border border-transparent'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-md ${activeConversation === conv.id ? 'bg-[#5B4FE8] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate ${activeConversation === conv.id ? 'text-zinc-900' : 'text-zinc-600'}`}>
                    {conv.title}
                  </p>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    {new Date(conv.last_message_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 text-zinc-400 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;