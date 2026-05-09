import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, X } from 'lucide-react';
import EventModal from '../components/modals/EventModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarPage = () => {
    const { isHR, isAdmin } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [clickedDate, setClickedDate] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data.events || []);
        } catch (err) {
            console.error('Failed to fetch events', err);
            toast.error('Failed to load calendar events');
        } finally {
            setLoading(false);
        }
    };

    // Build the calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        // getDay() returns 0=Sun, we want 0=Mon
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const days = [];

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, inMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }

        // Current month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({ day: d, inMonth: true, date: new Date(year, month, d) });
        }

        // Next month padding (fill to 42 cells = 6 rows)
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({ day: d, inMonth: false, date: new Date(year, month + 1, d) });
        }

        return days;
    }, [year, month]);

    // Map events to dates
    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach(ev => {
            const d = new Date(ev.event_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!map[key]) map[key] = [];
            map[key].push(ev);
        });
        return map;
    }, [events]);

    const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const today = new Date();
    const isToday = (date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('calendar.title')}</h1>
                    <p className="text-zinc-500 text-sm mt-1">{t('calendar.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {(isHR || isAdmin) && (
                        <button
                            onClick={() => setIsEventModalOpen(true)}
                            className="px-4 py-2 bg-[#5B4FE8] text-white text-[12px] font-bold uppercase tracking-wider rounded-md hover:bg-[#4a3fd4] transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t('calendar.addEvent')}
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Container */}
            <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        <button onClick={goToPrevMonth} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <ChevronLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <button onClick={goToNextMonth} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                        </button>
                        <h2 className="text-[18px] font-black text-zinc-900 tracking-tight">{monthName}</h2>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200">
                    {DAYS.map(day => (
                        <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 border-r border-zinc-100 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((cell, idx) => {
                        const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
                        const dayEvents = eventsByDate[key] || [];
                        const isTodayCell = isToday(cell.date);

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (isHR || isAdmin) {
                                        setClickedDate(cell.date);
                                        setIsEventModalOpen(true);
                                    }
                                }}
                                className={`
                                    min-h-[110px] border-b border-r border-zinc-100 p-2 transition-colors
                                    ${cell.inMonth ? 'bg-white' : 'bg-zinc-50/50'}
                                    ${isTodayCell ? 'bg-zinc-50' : ''}
                                    ${(isHR || isAdmin) ? 'cursor-pointer hover:bg-zinc-50/80' : ''}
                                `}
                            >
                                {/* Date Number */}
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className={`
                                        text-[13px] font-bold leading-none
                                        ${isTodayCell
                                            ? 'bg-[#5B4FE8] text-white w-7 h-7 rounded-full flex items-center justify-center'
                                            : cell.inMonth ? 'text-zinc-900' : 'text-zinc-300'
                                        }
                                    `}>
                                        {cell.day}
                                    </span>
                                </div>

                                {/* Events in cell */}
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(ev);
                                            }}
                                            className="w-full text-left px-1.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors group"
                                        >
                                            <p className="text-[11px] font-bold text-zinc-700 truncate leading-tight group-hover:text-zinc-900">
                                                {ev.title}
                                            </p>
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <p className="text-[10px] font-bold text-zinc-400 px-1.5">
                                            {t('calendar.more', { count: dayEvents.length - 3 })}
                                         </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Detail Popover */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-zinc-900/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white border border-zinc-200 rounded-md max-w-md w-full shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
                            <h3 className="text-[16px] font-bold text-zinc-900">{selectedEvent.title}</h3>
                            <button onClick={() => setSelectedEvent(null)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#5B4FE8] p-2.5 rounded-md flex flex-col items-center justify-center min-w-[3.5rem] text-white">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                        {new Date(selectedEvent.event_date).toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-black leading-none mt-0.5">
                                        {new Date(selectedEvent.event_date).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(selectedEvent.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <p className="text-[12px] text-zinc-400 mt-0.5">
                                        {new Date(selectedEvent.event_date).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[13px] text-zinc-600 leading-relaxed">
                                {selectedEvent.description || t('calendar.noDetails')}
                            </p>
                            {selectedEvent.attendees && (
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pt-3 border-t border-zinc-100">
                                    {t('calendar.invited')} <span className="text-zinc-900">{Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees.join(', ') : t('calendar.everyone')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <EventModal 
                isOpen={isEventModalOpen} 
                onClose={() => {
                    setIsEventModalOpen(false);
                    setClickedDate(null);
                }} 
                onEventAdded={(newEvent) => { setEvents([newEvent, ...events]); }} 
                initialDate={clickedDate}
            />
        </div>
    );
};

export default CalendarPage;
