interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  count?: number;
  countLabel?: string;
}

export function StarRating({ rating, size = 'sm', showNumber = false, count, countLabel = 'reviews' }: StarRatingProps) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1" style={{ color: '#aa7478' }}>
      <div className="flex">
        {stars.map(star => (
          <span
            key={star}
            className={`material-symbols-outlined ${sizeClass}`}
            style={{
              fontVariationSettings: star <= Math.round(rating) ? "'FILL' 1" : "'FILL' 0",
              opacity: star <= Math.round(rating) ? 1 : 0.3,
            }}
          >
            star
          </span>
        ))}
      </div>
      {showNumber && (
        <span className={`font-semibold text-on-surface ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {rating.toFixed(1)}
          {count != null && count > 0 && (
            <span className="ml-1 font-normal text-on-surface-variant">({count} {count === 1 ? countLabel.replace(/s$/, '') : countLabel})</span>
          )}
        </span>
      )}
    </div>
  );
}

export function StarRatingLegend() {
  const levels = [
    { stars: 5, label: 'Excellent', desc: 'Outstanding experience, highly recommended' },
    { stars: 4, label: 'Very Good', desc: 'Great experience with minor issues' },
    { stars: 3, label: 'Average', desc: 'Satisfactory experience' },
    { stars: 2, label: 'Below Average', desc: 'Some issues experienced' },
    { stars: 1, label: 'Poor', desc: 'Did not meet expectations' },
  ];

  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#f7f5f0' }}>
      <h3 className="mb-3 text-sm font-semibold text-on-surface">Ratings Guide</h3>
      <div className="space-y-2">
        {levels.map(level => (
          <div key={level.stars} className="flex items-center gap-3">
            <div className="flex" style={{ color: '#aa7478' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span
                  key={s}
                  className="material-symbols-outlined text-sm"
                  style={{
                    fontVariationSettings: s <= level.stars ? "'FILL' 1" : "'FILL' 0",
                    opacity: s <= level.stars ? 1 : 0.2,
                  }}
                >
                  star
                </span>
              ))}
            </div>
            <div>
              <span className="text-xs font-semibold text-on-surface">{level.label}</span>
              <span className="ml-2 text-xs text-on-surface-variant">{level.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
