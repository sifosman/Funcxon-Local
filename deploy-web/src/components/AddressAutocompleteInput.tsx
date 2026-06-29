import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Prediction = {
  description: string;
  place_id: string;
};

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (value: string) => void;
  required?: boolean;
  error?: string;
};

export function AddressAutocompleteInput({
  label,
  placeholder,
  value,
  onChangeValue,
  required,
  error,
}: Props) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestSeq = useRef(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const canSearch = useMemo(() => {
    return query.trim().length >= 3;
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!open) return;

    if (trimmed.length < 3) {
      setPredictions([]);
      return;
    }

    const seq = ++requestSeq.current;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('places-autocomplete', {
          body: { input: trimmed },
        });

        if (seq !== requestSeq.current) return;

        if (error) {
          console.error('Places autocomplete error:', error);
          setPredictions([]);
          return;
        }

        const next: Prediction[] = Array.isArray(data?.predictions)
          ? data.predictions
              .filter((p: any) => typeof p?.description === 'string' && typeof p?.place_id === 'string')
              .map((p: any) => ({ description: p.description, place_id: p.place_id }))
          : [];

        setPredictions(next);
      } catch (err) {
        console.error('Places autocomplete exception:', err);
        if (seq === requestSeq.current) {
          setPredictions([]);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [open, query]);

  const handleSelect = (prediction: Prediction) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    onChangeValue(prediction.description);
    setOpen(false);
    setPredictions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
        {label}
        {required ? ' *' : ''}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChangeValue(e.target.value);
            if (!open) {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setOpen(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => {
              setOpen(false);
            }, 180);
          }}
          className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors ${
            error ? 'border-red-500' : 'border-outline-variant focus:border-primary'
          }`}
          
        />

        <button
          type="button"
          onClick={() => {
            setOpen(true);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-outline-variant bg-white shadow-lg"
        >
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
              <span className="text-xs text-on-surface-variant" >Searching…</span>
            </div>
          )}

          {!loading && canSearch && predictions.length === 0 && (
            <div className="px-4 py-3">
              <p className="text-xs text-on-surface-variant" >No results</p>
            </div>
          )}

          {!loading && query.trim().length < 3 && (
            <div className="px-4 py-3">
              <p className="text-xs text-on-surface-variant" >Type at least 3 characters</p>
            </div>
          )}

          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full border-t border-outline-variant px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-surface-container-low"
              
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
