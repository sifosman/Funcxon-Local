import { Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

export default function AdminDashboardScreen() {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Admin dashboard</Text>
    </View>
  );
}
