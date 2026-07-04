import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CalendarDays, Plus, Trash2, CheckSquare, Users, Clock, Wallet, ListTodo, AlertCircle } from 'lucide-react';

interface PlannerItem {
  id: string;
  name?: string;
  category?: string;
  allocated_budget?: number;
  spent_budget?: number;
  event_date?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvp?: 'pending' | 'attending' | 'declined';
}

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
}

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Music', 'Transport', 'Attire', 'Other'];

function storageKey(userId: string, section: 'budget' | 'checklist' | 'guests' | 'timeline') {
  return `funxon.planner.${section}.${userId}`;
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function PlannerPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'budget' | 'checklist' | 'guests' | 'timeline'>('budget');

  // Budget
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newBudget, setNewBudget] = useState('');
  const [newSpent, setNewSpent] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistDate, setNewChecklistDate] = useState('');

  // Guests
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

  // Timeline
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [newTimelineTime, setNewTimelineTime] = useState('');
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (user) {
      setItems(loadFromStorage<PlannerItem>(storageKey(user.id, 'budget')));
      setChecklist(loadFromStorage<ChecklistItem>(storageKey(user.id, 'checklist')));
      setGuests(loadFromStorage<Guest>(storageKey(user.id, 'guests')));
      setTimeline(loadFromStorage<TimelineItem>(storageKey(user.id, 'timeline')));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  async function addBudgetItem() {
    if (!newName || !newBudget || !user) return;
    const item: PlannerItem = {
      id: generateId(),
      name: newName,
      category: newCategory,
      allocated_budget: Number(newBudget),
      spent_budget: Number(newSpent) || 0,
    };
    const next = [...items, item];
    setItems(next);
    saveToStorage(storageKey(user.id, 'budget'), next);
    setNewName('');
    setNewBudget('');
    setNewSpent('');
    setShowNew(false);
  }

  async function deleteBudgetItem(id: string) {
    if (!user) return;
    const next = items.filter(i => i.id !== id);
    setItems(next);
    saveToStorage(storageKey(user.id, 'budget'), next);
  }

  async function addChecklistItem() {
    if (!newChecklistTitle || !user) return;
    const item: ChecklistItem = {
      id: generateId(),
      title: newChecklistTitle,
      due_date: newChecklistDate || undefined,
      completed: false,
    };
    const next = [...checklist, item];
    setChecklist(next);
    saveToStorage(storageKey(user.id, 'checklist'), next);
    setNewChecklistTitle('');
    setNewChecklistDate('');
  }

  async function toggleChecklist(id: string, _completed?: boolean) {
    if (!user) return;
    const next = checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setChecklist(next);
    saveToStorage(storageKey(user.id, 'checklist'), next);
  }

  async function deleteChecklist(id: string) {
    if (!user) return;
    const next = checklist.filter(i => i.id !== id);
    setChecklist(next);
    saveToStorage(storageKey(user.id, 'checklist'), next);
  }

  async function addGuest() {
    if (!newGuestName || !user) return;
    const guest: Guest = {
      id: generateId(),
      name: newGuestName,
      email: newGuestEmail || undefined,
      phone: newGuestPhone || undefined,
      rsvp: 'pending',
    };
    const next = [...guests, guest];
    setGuests(next);
    saveToStorage(storageKey(user.id, 'guests'), next);
    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
  }

  async function updateGuestRsvp(id: string, rsvp: Guest['rsvp']) {
    if (!user) return;
    const next = guests.map(g => g.id === id ? { ...g, rsvp } : g);
    setGuests(next);
    saveToStorage(storageKey(user.id, 'guests'), next);
  }

  async function deleteGuest(id: string) {
    if (!user) return;
    const next = guests.filter(g => g.id !== id);
    setGuests(next);
    saveToStorage(storageKey(user.id, 'guests'), next);
  }

  async function addTimelineItem() {
    if (!newTimelineTitle || !newTimelineTime || !user) return;
    const item: TimelineItem = {
      id: generateId(),
      time: newTimelineTime,
      title: newTimelineTitle,
      description: newTimelineDesc || undefined,
    };
    const next = [...timeline, item];
    setTimeline(next);
    saveToStorage(storageKey(user.id, 'timeline'), next);
    setNewTimelineTime('');
    setNewTimelineTitle('');
    setNewTimelineDesc('');
  }

  async function deleteTimelineItem(id: string) {
    if (!user) return;
    const next = timeline.filter(i => i.id !== id);
    setTimeline(next);
    saveToStorage(storageKey(user.id, 'timeline'), next);
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
  const attendingCount = guests.filter(g => g.rsvp === 'attending').length;
  const declinedCount = guests.filter(g => g.rsvp === 'declined').length;

  const tabs = [
    { key: 'budget', label: 'Budget', icon: Wallet },
    { key: 'checklist', label: 'Checklist', icon: ListTodo },
    { key: 'guests', label: 'Guests', icon: Users },
    { key: 'timeline', label: 'Timeline', icon: Clock },
  ] as const;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Event Planner</h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-outline-variant pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
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

            <button onClick={() => setShowNew(!showNew)} className="mt-6 fx-btn-primary">
              <Plus className="mr-1 h-4 w-4" /> Add Budget Item
            </button>

            {showNew && (
              <div className="mt-4 rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <div className="grid gap-3 md:grid-cols-5">
                  <input type="text" placeholder="Item name" value={newName} onChange={e => setNewName(e.target.value)} className="fx-input md:col-span-2" />
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="fx-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Budget (R)" value={newBudget} onChange={e => setNewBudget(e.target.value)} className="fx-input" />
                  <input type="number" placeholder="Spent (R)" value={newSpent} onChange={e => setNewSpent(e.target.value)} className="fx-input" />
                </div>
                <button onClick={addBudgetItem} className="mt-3 fx-btn-primary">Add</button>
              </div>
            )}

            {loading ? (
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm border border-outline-variant">
                <p className="text-on-surface-variant">No budget items yet. Add your first category.</p>
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
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface-variant">{item.category || 'Other'}</span>
                            <h3 className="font-display font-semibold text-on-surface">{item.name}</h3>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-on-surface-variant">Allocated: <strong className="text-on-surface">R{allocated.toLocaleString()}</strong></span>
                            <span className="text-on-surface-variant">Spent: <strong className="text-destructive">R{spent.toLocaleString()}</strong></span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <button onClick={() => deleteBudgetItem(item.id)} className="ml-4 rounded-lg p-2 text-on-surface-variant hover:bg-error-container hover:text-error">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="mt-6">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
              <div className="grid gap-3 md:grid-cols-4">
                <input type="text" placeholder="Task title" value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} className="fx-input md:col-span-2" />
                <input type="date" value={newChecklistDate} onChange={e => setNewChecklistDate(e.target.value)} className="fx-input" />
                <button onClick={addChecklistItem} className="fx-btn-primary">Add</button>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {checklist.length === 0 && <p className="text-center text-sm text-on-surface-variant">No checklist items yet.</p>}
              {checklist.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleChecklist(item.id, item.completed)} className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant">
                      {item.completed && <CheckSquare className="h-4 w-4 text-success" />}
                    </button>
                    <div>
                      <p className={`font-medium ${item.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{item.title}</p>
                      {item.due_date && <p className="text-xs text-on-surface-variant">Due {new Date(item.due_date).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteChecklist(item.id)} className="rounded-lg p-2 text-on-surface-variant hover:text-error">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <p className="text-sm text-on-surface-variant">Total</p>
                <p className="mt-1 text-2xl font-bold text-on-surface">{guests.length}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <p className="text-sm text-on-surface-variant">Attending</p>
                <p className="mt-1 text-2xl font-bold text-success">{attendingCount}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <p className="text-sm text-on-surface-variant">Declined</p>
                <p className="mt-1 text-2xl font-bold text-error">{declinedCount}</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
              <div className="grid gap-3 md:grid-cols-4">
                <input type="text" placeholder="Name" value={newGuestName} onChange={e => setNewGuestName(e.target.value)} className="fx-input" />
                <input type="email" placeholder="Email" value={newGuestEmail} onChange={e => setNewGuestEmail(e.target.value)} className="fx-input" />
                <input type="tel" placeholder="Phone" value={newGuestPhone} onChange={e => setNewGuestPhone(e.target.value)} className="fx-input" />
                <button onClick={addGuest} className="fx-btn-primary">Add</button>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {guests.length === 0 && <p className="text-center text-sm text-on-surface-variant">No guests added yet.</p>}
              {guests.map(guest => (
                <div key={guest.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-outline-variant">
                  <div>
                    <p className="font-medium text-on-surface">{guest.name}</p>
                    <p className="text-xs text-on-surface-variant">{guest.email} {guest.phone && `• ${guest.phone}`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={guest.rsvp} onChange={e => updateGuestRsvp(guest.id, e.target.value as Guest['rsvp'])} className="fx-input py-1 text-sm">
                      <option value="pending">Pending</option>
                      <option value="attending">Attending</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button onClick={() => deleteGuest(guest.id)} className="rounded-lg p-2 text-on-surface-variant hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="mt-6">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
              <div className="grid gap-3 md:grid-cols-4">
                <input type="time" value={newTimelineTime} onChange={e => setNewTimelineTime(e.target.value)} className="fx-input" />
                <input type="text" placeholder="Event title" value={newTimelineTitle} onChange={e => setNewTimelineTitle(e.target.value)} className="fx-input md:col-span-2" />
                <button onClick={addTimelineItem} className="fx-btn-primary">Add</button>
              </div>
              <input type="text" placeholder="Description (optional)" value={newTimelineDesc} onChange={e => setNewTimelineDesc(e.target.value)} className="fx-input mt-3" />
            </div>
            <div className="relative mt-6 space-y-4 border-l-2 border-outline-variant pl-6">
              {timeline.length === 0 && <p className="text-sm text-on-surface-variant">No timeline items yet.</p>}
              {timeline.map(item => (
                <div key={item.id} className="relative rounded-xl bg-white p-4 shadow-sm border border-outline-variant">
                  <span className="absolute -left-[31px] top-4 h-4 w-4 rounded-full bg-primary" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-primary">{item.time}</span>
                      <h3 className="font-medium text-on-surface">{item.title}</h3>
                      {item.description && <p className="text-sm text-on-surface-variant">{item.description}</p>}
                    </div>
                    <button onClick={() => deleteTimelineItem(item.id)} className="rounded-lg p-2 text-on-surface-variant hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-lg border p-4 shadow-lg ${
            toast.type === 'error'
              ? 'border-error/30 bg-error-container/30 text-error'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-on-surface-variant hover:text-on-surface"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
