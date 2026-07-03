import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ApplyPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/apply/step1', { replace: true });
  }, [navigate]);
  return null;
}
