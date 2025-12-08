import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { RootNavigator } from './RootNavigator';
import { AuthNavigator } from './AuthNavigator';
import { colors } from '../theme';

export function AppNavigator() {
  const { session } = useAuth();

  if (session === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <AuthNavigator />;
  }

  return <RootNavigator />;
}
