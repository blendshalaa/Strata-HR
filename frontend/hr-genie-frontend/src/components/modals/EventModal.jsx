import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const EventModal = ({ isOpen, onClose, onEventAdded, initialDate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [attendees, setAttendees] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            // Pre-fill date if provided (from clicking a day cell)
            if (initialDate) {
                const d = new Date(initialDate);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setEventDate(`${yyyy}-${mm}-${dd}T09:00`);
            } else {
                setEventDate('');
            }
            setAttendees('');
            setError(null);
        }
    }, [isOpen, initialDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newEvent = {
                title,
                description,
                event_date: eventDate,
                attendees: attendees ? attendees.split(',').map(s => s.trim()) : []
            };

            const res = await api.post('/events', newEvent);
            onEventAdded(res.data.event);
            onClose();
        } catch (err) {
            console.error('Failed to create event', err);
            setError(err.response?.data?.error || 'An error occurred while creating the event.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fadeIn" style={{backgroundColor:"rgba(15,13,46,0.45)"}}>
            <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden animate-slideUp">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                    <h2 className="text-[16px] font-bold text-zinc-900">{t('eventModal.addNew')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('eventModal.eventTitle')} <span className="text-zinc-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            placeholder="e.g. Quarterly Review"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('eventModal.eventDate')} <span className="text-zinc-400">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('departmentModal.description')}
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
                            placeholder="Details about the event..."
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                            {t('eventModal.attendees')} <span className="text-zinc-400 font-normal">{t('eventModal.attendeesHint')}</span>
                        </label>
                        <input
                            type="text"
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                            placeholder="e.g. all, managers, engineering"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[13px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-[13px] font-bold text-white bg-[#5B4FE8] border border-[#5B4FE8] rounded-md hover:bg-[#4a3fd4] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t('eventModal.creatingEvent') : t('eventModal.createEvent')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
