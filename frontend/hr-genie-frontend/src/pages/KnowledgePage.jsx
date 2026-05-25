
import React, { useState, useEffect } from 'react';
import { knowledgeAPI } from '../services/api';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import { Search, BookOpen, X, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const KnowledgePage = () => {
  const { isHR, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchKnowledge();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeAPI.getAll({
        category: selectedCategory,
        search: searchQuery,
      });
      setArticles(response.data.knowledge);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await knowledgeAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await knowledgeAPI.delete(id);
      await fetchKnowledge();
      setSelectedArticle(null);
      toast.success(t('knowledge.articleDeleted'));
    } catch (error) {
      toast.error(t('knowledge.failedToDelete'));
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('knowledge.title')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('knowledge.subtitle')}</p>
        </div>
        {(isHR || isAdmin) && (
          <button
            onClick={() => {
              setEditingArticle(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-[#5B4FE8] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('knowledge.addArticle')}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card bg-white border border-zinc-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('knowledge.searchArticles')}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
            >
              <option value="">{t('knowledge.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-md text-center py-16">
          <BookOpen className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">{t('knowledge.noArticles')}</p>
          <p className="text-[12px] text-zinc-500 mt-1">{t('knowledge.tryDifferentSearch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="relative">
              <KnowledgeCard
                article={article}
                onClick={() => setSelectedArticle(article)}
              />
              {(isHR || isAdmin) && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingArticle(article);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 bg-white border border-zinc-200 rounded-md shadow-sm hover:bg-zinc-50 transition-colors"
                    title="Edit Article"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-600" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(article.id);
                      }}
                      className="p-1.5 bg-white border border-zinc-200 rounded-md shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Article View Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-[20px] font-bold text-zinc-900 mb-2 leading-tight">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.category && (
                  <span className="inline-block px-2 py-0.5 bg-[#5B4FE8] text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {selectedArticle.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed text-[14px]">
                  {selectedArticle.content}
                </p>
              </div>
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{t('knowledge.associatedTags')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px] font-bold uppercase tracking-wider rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Article Modal */}
      {showCreateModal && (
        <CreateArticleModal
          article={editingArticle}
          onClose={() => {
            setShowCreateModal(false);
            setEditingArticle(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingArticle(null);
            fetchKnowledge();
          }}
        />
      )}
    </div>

    <ConfirmDialog
      isOpen={!!deleteConfirm}
      onClose={() => setDeleteConfirm(null)}
      onConfirm={() => handleDelete(deleteConfirm)}
      title={t('common.confirmDeleteTitle')}
      message={t('knowledge.deleteConfirm')}
      confirmLabel={t('common.delete')}
    />
    </>
  );
};

// Create Article Modal Component
const CreateArticleModal = ({ article, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    category: article?.category || 'policies',
    tags: article?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      if (article) {
        await knowledgeAPI.update(article.id, data);
        toast.success(t('knowledge.articleUpdated'));
      } else {
        await knowledgeAPI.create(data);
        toast.success(t('knowledge.articleCreated'));
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || t('knowledge.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 flex items-center justify-between z-10">
          <h2 className="text-[18px] font-bold text-zinc-900">
            {article ? t('knowledge.editArticle') : t('knowledge.createArticle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md text-[13px] text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">
              {t('knowledge.titleLabel')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
              placeholder={t('knowledge.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">
              {t('knowledge.categoryLabel')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
              required
            >
              <option value="policies">Policies</option>
              <option value="benefits">Benefits</option>
              <option value="procedures">Procedures</option>
              <option value="faq">FAQ</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">
              {t('knowledge.contentLabel')}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors min-h-[200px]"
              placeholder={t('knowledge.contentPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-1.5">
              {t('knowledge.tagsLabel')}
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., leave, policy, hr"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-zinc-100 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5B4FE8] text-white px-4 py-2.5 rounded-md hover:bg-[#4a3fd4] transition-colors disabled:opacity-50 text-[12px] font-bold uppercase tracking-wider"
            >
              {loading ? t('common.saving') : article ? t('knowledge.updateArticle') : t('knowledge.createArticle')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-[12px] font-bold uppercase tracking-wider"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgePage;
