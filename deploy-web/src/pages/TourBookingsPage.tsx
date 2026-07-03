import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TourBookingsPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/bookings', { replace: true });
  }, [navigate]);
  return null;
}
