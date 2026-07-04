// WEB ONLY — deploy-web/src/components/ApplicationProgress.tsx
interface ApplicationProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function ApplicationProgress({ currentStep, totalSteps = 4 }: ApplicationProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div
            key={step}
            className={cn(
              'h-2 w-8 rounded-full transition-colors',
              isCompleted || isCurrent ? 'bg-primary' : 'bg-surface-container-highest',
            )}
          />
        );
      })}
    </div>
  );
}

// Simple local cn helper until a shared utility exists
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
