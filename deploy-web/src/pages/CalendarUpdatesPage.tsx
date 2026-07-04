import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppAlert } from '../components/AppAlert';

type TaskRow = { id: number; title: string; due_date: string | null; completed: boolean; created_at: string };

type CalendarEvent = { id: number; title: string; date: string; task_id: number | null };

export default function CalendarUpdatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: taskRows }, { data: eventRows }] = await Promise.all([
        supabase.from('action_items').select('id, title, due_date, completed, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('calendar_events').select('id, title, date, task_id').eq('user_id', user.id).order('date', { ascending: true }),
      ]);
      setTasks((taskRows || []) as TaskRow[]);
      setEvents((eventRows || []) as CalendarEvent[]);
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to load calendar.', type: 'error' }); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const addEvent = async () => {
    if (!title.trim() || !date || !user?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('calendar_events').insert({ user_id: user.id, title: title.trim(), date }).select('id, title, date, task_id').single();
      if (error) throw error;
      if (data) setEvents((prev) => [...prev, data as CalendarEvent]);
      setTitle(''); setDate('');
      setAlert({ title: 'Success', message: 'Event added to calendar.', type: 'success' });
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to add event.', type: 'error' }); } finally { setSaving(false); }
  };

  const deleteEvent = async (event: CalendarEvent) => {
    if (!confirm('Remove this event from your calendar?')) return;
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', event.id);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to delete event.', type: 'error' }); }
  };

  const taskEvents = useMemo(() => {
    const map: CalendarEvent[] = [];
    tasks.filter((t) => t.due_date && !t.completed).forEach((t) => {
      map.push({ id: t.id, title: t.title, date: t.due_date as string, task_id: t.id });
    });
    return map;
  }, [tasks]);

  const allEvents = useMemo(() => {
    const combined = [...events, ...taskEvents];
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return combined;
  }, [events, taskEvents]);

  const groupedByMonth = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach((e) => {
      const month = new Date(e.date).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
      if (!map[month]) map[month] = [];
      map[month].push(e);
    });
    return map;
  }, [allEvents]);

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <Link to="/vendor-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Vendor Dashboard</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Calendar Updates</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>Tasks with due dates and calendar events appear here.</p>

        <div className="mb-6 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            <button onClick={addEvent} disabled={saving || !title.trim() || !date} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}><CalendarPlus className="h-4 w-4" /> Add Event</button>
          </div>
        </div>

        {allEvents.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-on-surface-variant">No calendar events yet.</p>
            <p className="mt-2 text-xs text-on-surface-variant">Add due dates to action items or create an event above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">{month}</h2>
                <div className="space-y-3">
                  {monthEvents.map((e) => (
                    <div key={`${e.id}-${e.task_id ?? 'event'}`} className={`flex items-center justify-between rounded-xl border border-outline-variant p-4 ${e.task_id ? 'bg-blue-50 border-blue-100' : 'bg-white shadow-sm'}`}>
                      <div>
                        <p className="font-semibold text-on-surface">{e.title}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(e.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                      {!e.task_id && <button onClick={() => deleteEvent(e)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
