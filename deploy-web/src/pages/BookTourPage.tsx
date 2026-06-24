import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, Mail, Phone, Send, ChevronLeft } from 'lucide-react';

export default function BookTourPage() {
  const { id } = useParams<{ id: string }>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm border border-outline-variant">
          <h2 className="font-display text-2xl font-bold text-on-surface">Tour Requested!</h2>
          <p className="mt-4 text-on-surface-variant">We'll contact you shortly to confirm your tour.</p>
          <Link to={`/venue/${id}`} className="mt-6 inline-block text-primary hover:underline">Back to venue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Link to={`/venue/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-xl bg-white p-8 shadow-sm border border-outline-variant">
          <h1 className="font-display text-2xl font-bold text-on-surface">Book a Tour</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Schedule a visit to see this venue in person.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="fx-input pl-10" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="fx-input pl-10" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="fx-input pl-10" placeholder="Your name" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="fx-input pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="fx-input pl-10" placeholder="+27..." />
              </div>
            </div>
            <button type="submit" className="fx-btn-primary w-full"><Send className="mr-2 h-4 w-4" /> Request Tour</button>
          </form>
        </div>
      </div>
    </div>
  );
}
