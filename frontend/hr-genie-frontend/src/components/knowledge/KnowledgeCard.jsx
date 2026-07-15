import React from 'react';
import { BookOpen, Tag } from 'lucide-react';

const KnowledgeCard = ({ article, onClick }) => {
  const categoryColors = {
    policies: 'bg-zinc-100 text-zinc-900 border-zinc-200',
    benefits: 'bg-green-50 text-green-700 border-green-100',
    procedures: 'bg-zinc-50 text-zinc-700 border-zinc-200',
    faq: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  return (
    <div
      onClick={onClick}
      className="card bg-white border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer group p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-md">
          <BookOpen className="w-5 h-5 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-zinc-900 mb-2 group-hover:text-zinc-900 transition-colors">
            {article.title}
          </h3>
          <p className="text-[13px] text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
            {article.content}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${categoryColors[article.category] || 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                {article.category}
              </span>
            )}
            {article.tags && article.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCard;