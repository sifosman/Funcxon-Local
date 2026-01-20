import { View, Text } from 'react-native';
import { colors, spacing } from '../theme';

interface ApplicationProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function ApplicationProgress({ currentStep, totalSteps = 4 }: ApplicationProgressProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isPending = step > currentStep;

        return (
          <View
            key={step}
            style={{
              width: 32,
              height: 8,
              borderRadius: 4,
              backgroundColor: isCompleted || isCurrent 
                ? colors.primaryTeal 
                : colors.borderSubtle,
            }}
          />
        );
      })}
    </View>
  );
}
