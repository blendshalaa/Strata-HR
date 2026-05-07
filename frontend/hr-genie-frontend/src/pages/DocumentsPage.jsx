import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileText, FileSpreadsheet, Image, Upload, Trash2, Download, Search, FolderOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// File-type icon by MIME
const FileIcon = ({ mime }) => {
    if (!mime) return <FileText className="w-5 h-5 text-zinc-400" />;
    if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-sky-500" />;
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv'))
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (mime.includes('word') || mime.includes('document'))
        return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-zinc-400" />;
};

// Coloured file badge bg by MIME
const fileBg = (mime) => {
    if (!mime) return 'bg-zinc-100';
    if (mime.startsWith('image/')) return 'bg-sky-50';
    if (mime.includes('pdf')) return 'bg-red-50';
    if (mime.includes('sheet') || mime.includes('excel')) return 'bg-emerald-50';
    if (mime.includes('word') || mime.includes('document')) return 'bg-blue-50';
    return 'bg-zinc-100';
};

const CATEGORIES = [
    { value: 'contract', label: 'Contract', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'id_document', label: 'ID Document', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'tax_form', label: 'Tax Form', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'certificate', label: 'Certificate', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'policy', label: 'Policy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { value: 'other', label: 'Other', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
];

const getCategoryInfo = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5];

const DocumentsPage = () => {
    const { user, isHR } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Upload form state
    const [uploadName, setUploadName] = useState('');
    const [uploadCategory, setUploadCategory] = useState('other');
    const [uploadUserId, setUploadUserId] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Users list for HR/admin upload targeting
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchDocuments();
        if (isHR) fetchUsers();
    }, []);

    const fetchDocuments = async () => {
        try {
            const endpoint = isHR ? '/documents/all' : '/documents/me';
            const res = await api.get(endpoint);
            setDocuments(res.data.documents);
        } catch {
            toast.error(t('documents.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users || []);
        } catch { /* silent */ }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) { toast.error(t('documents.selectFile')); return; }
        if (!uploadName.trim()) { toast.error(t('documents.nameRequired')); return; }

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('name', uploadName);
        formData.append('category', uploadCategory);
        if (uploadUserId) formData.append('user_id', uploadUserId);

        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
            toast.success(t('documents.documentUploaded'));
            setShowUpload(false);
            setUploadName('');
            setUploadCategory('other');
            setUploadUserId('');
            setUploadFile(null);
            setUploadProgress(0);
            fetchDocuments();
        } catch (err) {
            toast.error(err.response?.data?.error || t('documents.uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setUploadFile(file);
            if (!uploadName) setUploadName(file.name.replace(/\.[^/.]+$/, ''));
        }
    }, [uploadName]);

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/documents/${id}`);
            toast.success(t('documents.documentDeleted'));
            fetchDocuments();
        } catch {
            toast.error(t('documents.deleteFailed'));
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Documents are stored on Cloudinary — the file_url IS the full public URL
    const handleDownload = (fileUrl, fileName) => {
        if (!fileUrl) return;
        // For Cloudinary URLs, add fl_attachment to force download instead of browser preview
        const downloadUrl = fileUrl.includes('res.cloudinary.com')
            ? fileUrl.replace('/upload/', '/upload/fl_attachment/')
            : fileUrl;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'document';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const filtered = documents.filter(d => {
        if (filterCategory && d.category !== filterCategory) return false;
        if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterEmployee && !d.employee_name?.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
        return true;
    });

    const inputClass = "w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all text-sm font-medium";

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
                        {isHR ? t('documents.titleHR') : t('documents.titleEmployee')}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        {isHR ? t('documents.subtitleHR') : t('documents.subtitleEmployee')}
                    </p>
                </div>
                <button onClick={() => setShowUpload(!showUpload)} className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" /> {t('documents.uploadDocument')}
                </button>
            </div>

            {/* Upload Panel */}
            {showUpload && (
                <div className="bg-white border border-zinc-200 rounded-md p-6 shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">{t('documents.uploadNewDocument')}</h3>
                        <button onClick={() => setShowUpload(false)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                    <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('documents.documentName')}</label>
                            <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)}
                                className={inputClass} placeholder="Employment Contract 2026" required />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('documents.category')}</label>
                            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className={inputClass}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        {isHR && (
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('common.employee')}</label>
                                <select value={uploadUserId} onChange={e => setUploadUserId(e.target.value)} className={inputClass}>
                                    <option value="">{t('common.myself')}</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                        )}

                        {/* Drag-and-drop zone */}
                        <div className={isHR ? '' : 'md:col-span-2'}>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('documents.file')}</label>
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                                    dragOver ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400 bg-white'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setUploadFile(f);
                                            if (!uploadName) setUploadName(f.name.replace(/\.[^/.]+$/, ''));
                                        }
                                    }}
                                    accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                />
                                {uploadFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${fileBg(uploadFile.type)}`}>
                                            <FileIcon mime={uploadFile.type} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[13px] font-bold text-zinc-900 truncate max-w-[200px]">{uploadFile.name}</p>
                                            <p className="text-[11px] text-zinc-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); }}
                                            className="ml-auto p-1 hover:bg-zinc-100 rounded-md transition-colors">
                                            <X className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                                        <p className="text-[13px] font-bold text-zinc-500">Drop file here or <span className="text-zinc-900 underline">browse</span></p>
                                        <p className="text-[11px] text-zinc-400 mt-1">PDF, Word, Excel, JPG, PNG · max 10 MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {uploading && (
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Uploading…</span>
                                    <span className="text-[11px] font-bold text-zinc-900">{uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-900 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowUpload(false)} className="px-5 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">{t('common.cancel')}</button>
                            <button type="submit" disabled={uploading || !uploadFile} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors disabled:opacity-50">
                                {uploading ? `${uploadProgress}%` : t('documents.upload')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Category Tabs + Search */}
            <div className="space-y-3">
                {/* Search row */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 text-sm font-medium outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm"
                            placeholder={t('documents.searchDocuments')} />
                    </div>
                    {isHR && (
                        <div className="relative min-w-[180px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input type="text" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 text-sm font-medium outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm"
                                placeholder="Filter by employee…" />
                        </div>
                    )}
                </div>

                {/* Category tab pills */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterCategory('')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider border transition-colors ${
                            filterCategory === ''
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                        }`}
                    >
                        All
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            filterCategory === '' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                        }`}>{documents.length}</span>
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = documents.filter(d => d.category === cat.value).length;
                        if (count === 0) return null;
                        const isActive = filterCategory === cat.value;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setFilterCategory(isActive ? '' : cat.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider border transition-colors ${
                                    isActive ? 'bg-zinc-900 text-white border-zinc-900' : `${cat.color} hover:opacity-80`
                                }`}
                            >
                                {cat.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-white/60'
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                    {filterCategory && (
                        <span className="text-[12px] text-zinc-400 font-medium self-center">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-md p-16 text-center shadow-sm">
                    <FolderOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-[14px] font-black text-zinc-900 uppercase tracking-widest mb-1">{t('documents.noDocuments')}</p>
                    <p className="text-[13px] font-medium text-zinc-500">{t('documents.uploadFirst')}</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden shadow-sm hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('documents.document')}</th>
                                    {isHR && <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('common.employee')}</th>}
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('documents.category')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('documents.size')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('documents.uploaded')}</th>
                                    <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filtered.map(doc => {
                                    const cat = getCategoryInfo(doc.category);
                                    return (
                                        <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-md border border-zinc-200 flex items-center justify-center shrink-0 ${fileBg(doc.mime_type)}`}>
                                                        <FileIcon mime={doc.mime_type} />
                                                    </div>
                                                    <div>
                                                        <p className="text-zinc-900 font-bold text-[14px]">{doc.name}</p>
                                                        <p className="text-zinc-500 font-medium text-[12px] uppercase">{doc.mime_type?.split('/')[1] || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {isHR && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 text-[11px] font-black">
                                                            {doc.employee_name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <span className="text-zinc-700 font-bold text-[13px]">{doc.employee_name}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${cat.color}`}>
                                                    {cat.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">{formatFileSize(doc.file_size)}</td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">
                                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleDownload(doc.file_url, doc.name)}
                                                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                                        title="Download">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {(isHR || doc.user_id === user?.id) && (
                                                        <button onClick={() => setDeleteConfirm(doc.id)}
                                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filtered.map(doc => {
                            const cat = getCategoryInfo(doc.category);
                            return (
                                <div key={doc.id} className="bg-white border border-zinc-200 rounded-md p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-md border border-zinc-200 flex items-center justify-center shrink-0 ${fileBg(doc.mime_type)}`}>
                                                <FileIcon mime={doc.mime_type} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-zinc-900 font-bold text-[14px] truncate">{doc.name}</p>
                                                <p className="text-zinc-500 font-medium text-[12px] uppercase">{doc.mime_type?.split('/')[1] || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${cat.color}`}>
                                            {cat.label}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 text-[12px] font-medium text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-md border border-zinc-100">
                                        {isHR && doc.employee_name && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('documents.employee')}</span>
                                                <span className="text-zinc-900 font-bold">{doc.employee_name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('documents.sizeLabel')}</span>
                                            <span className="text-zinc-900 font-bold">{formatFileSize(doc.file_size)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('documents.uploadedLabel')}</span>
                                            <span className="text-zinc-900 font-bold">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
                                        <button onClick={() => handleDownload(doc.file_url, doc.name)}
                                            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md font-bold text-[12px] flex items-center gap-2 transition-colors">
                                            <Download className="w-3.5 h-3.5" /> {t('documents.download')}
                                        </button>
                                        {(isHR || doc.user_id === user?.id) && (
                                            <button onClick={() => setDeleteConfirm(doc.id)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-bold text-[12px] flex items-center gap-2 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => handleDelete(deleteConfirm)}
                title={t('documents.deleteDocumentTitle')}
                message={t('documents.deleteDocumentMessage')}
                confirmLabel={t('common.delete')}
            />
        </div>
    );
};

export default DocumentsPage;
