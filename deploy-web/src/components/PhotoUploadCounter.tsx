// WEB ONLY — deploy-web/src/components/PhotoUploadCounter.tsx
import { getVendorPhotoCount, getVendorPhotoLimit } from '../lib/subscription';
import { useEffect, useState } from 'react';

interface PhotoUploadCounterProps {
  vendorId: number;
  className?: string;
}

export function PhotoUploadCounter({ vendorId, className = '' }: PhotoUploadCounterProps) {
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [currentCount, currentLimit] = await Promise.all([
          getVendorPhotoCount(vendorId),
          getVendorPhotoLimit(vendorId),
        ]);
        if (!cancelled) {
          setCount(currentCount);
          setLimit(currentLimit);
        }
      } catch (error) {
        console.error('PhotoUploadCounter: failed to load counters', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  if (loading) {
    return <div className={['text-xs text-on-surface-variant', className].join(' ')}>Loading photo limits...</div>;
  }

  const remaining = Math.max(0, limit - count);
  const percentage = limit > 0 ? (count / limit) * 100 : 0;
  let color = '#059669';
  if (percentage >= 100) color = '#DC2626';
  else if (percentage >= 80) color = '#F59E0B';

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-on-surface-variant">Photo uploads</span>
        <span className="font-medium" style={{ color }}>
          {count}/{limit}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-xs text-on-surface-variant">{remaining} remaining</p>
    </div>
  );
}
