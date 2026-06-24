import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';

interface PlannerItem {
  id: string;
  name?: string;
  allocated_budget?: number;
  spent_budget?: number;
  event_date?: string;
}

export default function PlannerPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    if (user) fetchPlanner();
    else setLoading(false);
  }, [user]);

  async function fetchPlanner() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_planner_items')
        .select('id, name, allocated_budget, spent_budget, event_date')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching planner:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    if (!newName || !newBudget) return;
    try {
      const { error } = await supabase.from('event_planner_items').insert({
        user_id: user?.id,
        name: newName,
        allocated_budget: Number(newBudget),
        spent_budget: 0,
      });
      if (error) throw error;
      setNewName('');
      setNewBudget('');
      setShowNew(false);
      fetchPlanner();
    } catch (err) {
      console.error('Error adding planner item:', err);
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await supabase.from('event_planner_items').delete().eq('id', id);
      if (error) throw error;
      fetchPlanner();
    } catch (err) {
      console.error('Error deleting planner item:', err);
    }
  }

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to plan your event</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  const totalAllocated = items.reduce((sum, i) => sum + (i.allocated_budget || 0), 0);
  const totalSpent = items.reduce((sum, i) => sum + (i.spent_budget || 0), 0);

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Event Planner</h1>
          <button onClick={() => setShowNew(!showNew)} className="fx-btn-primary">
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </button>
        </div>

        {/* Budget Summary */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
            <p className="text-sm text-on-surface-variant">Total Allocated</p>
            <p className="mt-1 text-2xl font-bold text-primary">R{totalAllocated.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
            <p className="text-sm text-on-surface-variant">Total Spent</p>
            <p className="mt-1 text-2xl font-bold text-destructive">R{totalSpent.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
            <p className="text-sm text-on-surface-variant">Remaining</p>
            <p className="mt-1 text-2xl font-bold text-success">R{(totalAllocated - totalSpent).toLocaleString()}</p>
          </div>
        </div>

        {/* New Item Form */}
        {showNew && (
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
            <h3 className="font-display font-semibold text-on-surface">New Planner Item</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input type="text" placeholder="Item name (e.g. Catering)" value={newName} onChange={e => setNewName(e.target.value)} className="fx-input" />
              <input type="number" placeholder="Budget (R)" value={newBudget} onChange={e => setNewBudget(e.target.value)} className="fx-input" />
              <button onClick={addItem} className="fx-btn-primary">Add</button>
            </div>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <CalendarDays className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No planner items</h3>
            <p className="mt-2 text-on-surface-variant">Start by adding your first budget item.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map(item => {
              const allocated = item.allocated_budget || 0;
              const spent = item.spent_budget || 0;
              const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
              return (
                <div key={item.id} className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-on-surface">{item.name}</h3>
                      {item.event_date && <p className="text-xs text-on-surface-variant">{new Date(item.event_date).toLocaleDateString()}</p>}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-on-surface-variant">Allocated: <strong className="text-on-surface">R{allocated}</strong></span>
                        <span className="text-on-surface-variant">Spent: <strong className="text-destructive">R{spent}</strong></span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="ml-4 rounded-lg p-2 text-on-surface-variant hover:bg-error-container hover:text-error">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
