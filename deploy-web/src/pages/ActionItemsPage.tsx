import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppAlert } from '../components/AppAlert';

type TaskRow = { id: number; user_id: string; title: string; completed: boolean; due_date: string | null; priority: string | null; created_at: string };

export default function ActionItemsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('action_items').select('id, user_id, title, completed, due_date, priority, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200);
      setTasks((data || []) as TaskRow[]);
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to load tasks.', type: 'error' }); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const addTask = async () => {
    if (!title.trim() || !user?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('action_items').insert({ user_id: user.id, title: title.trim(), priority }).select('id, user_id, title, completed, due_date, priority, created_at').single();
      if (error) throw error;
      if (data) setTasks((prev) => [data as TaskRow, ...prev]);
      setTitle('');
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to add task.', type: 'error' }); } finally { setSaving(false); }
  };

  const toggleTask = async (task: TaskRow) => {
    try {
      const { error } = await supabase.from('action_items').update({ completed: !task.completed }).eq('id', task.id);
      if (error) throw error;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to update task.', type: 'error' }); }
  };

  const deleteTask = async (task: TaskRow) => {
    if (!confirm('Remove this task?')) return;
    try {
      const { error } = await supabase.from('action_items').delete().eq('id', task.id);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to delete task.', type: 'error' }); }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <Link to="/vendor-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Vendor Dashboard</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Action Items</h1>
        <p className="mb-6 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>{completedCount} of {tasks.length} completed</p>

        <div className="mb-6 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Add a new task..." className="flex-1 rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button onClick={addTask} disabled={saving || !title.trim()} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60" style={{ background: '#123f5c' }}><Plus className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="space-y-4">
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant">No tasks yet. Add one above.</p>
          )}

          {pendingTasks.length > 0 && <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Pending</h2>}
          {pendingTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTask(t)} className="text-primary hover:text-primary-container"><Circle className="h-5 w-5" /></button>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{t.priority} priority</p>
                </div>
              </div>
              <button onClick={() => deleteTask(t)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}

          {completedTasks.length > 0 && <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Completed</h2>}
          {completedTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container p-4 opacity-70">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTask(t)} className="text-primary"><CheckCircle2 className="h-5 w-5" /></button>
                <p className="text-sm text-on-surface line-through">{t.title}</p>
              </div>
              <button onClick={() => deleteTask(t)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
