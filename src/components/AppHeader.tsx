import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';

export default function AppHeader() {
  const { user, session } = useAuth();
  const navigation = useNavigation<any>();

  const openDiscover = (params?: {
    category?: 'all' | 'venues' | 'vendors' | 'services';
    searchTitle?: string;
    presetFilter?: 'location' | 'categories' | 'amenities' | 'services' | 'featured';
    showFilters?: boolean;
  }) => {
    navigation.navigate('Main', {
      screen: 'Home',
      params: {
        screen: 'Discover',
        params,
      },
    });
  };

  // Get username from user metadata or email
  const getUsername = () => {
    if (!user) return null;
    // Try to get display name from user metadata
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
    if (displayName) return displayName;
    // Fallback to email prefix
    if (user.email) {
      return user.email.split('@')[0];
    }
    return null;
  };

  const username = getUsername();

  return (
    <View style={styles.wrapper as any}>
      <View style={styles.container as any}>
        {/* Logo - Left side */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../logo.jpg')}
            style={styles.logo as any}
            resizeMode="contain"
          />
        </View>

        {/* Right side - Flag and User */}
        <View style={styles.rightContainer}>
          {/* South African Flag */}
          <Image
            source={require('../../assets/flag.jpg')}
            style={styles.flagImage as any}
            resizeMode="contain"
          />

          {session ? (
            <TouchableOpacity
              style={styles.userContainer}
              onPress={() => navigation.navigate('Account')}
            >
              <MaterialIcons name="person" size={20} color={colors.textPrimary} />
              {username && (
                <Text style={styles.greeting}>Hi {username}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginIcon}
              onPress={() => navigation.navigate('Auth', { screen: 'SignIn' })}
            >
              <MaterialIcons name="person-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navBar as any}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Main', { screen: 'Home', params: { screen: 'VendorList' } })}
        >
          <MaterialIcons name="home" size={18} color={colors.textPrimary} />
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openDiscover({ category: 'venues', searchTitle: 'Discover Venues' })}
        >
          <MaterialIcons name="location-city" size={18} color={colors.textPrimary} />
          <Text style={styles.navButtonText}>Venues</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openDiscover({ category: 'vendors', searchTitle: 'Discover Vendors' })}
        >
          <MaterialIcons name="store" size={18} color={colors.textPrimary} />
          <Text style={styles.navButtonText}>Vendors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Main', { screen: 'Home', params: { screen: 'ListersPortal' } })}
        >
          <MaterialIcons name="list" size={18} color={colors.textPrimary} />
          <Text style={styles.navButtonText}>Listers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const baseWrapper: any = {
  backgroundColor: colors.surface,
};

const baseContainer: any = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderSubtle,
};

if (Platform.OS === 'web') {
  baseWrapper.position = 'sticky';
  baseWrapper.top = 0;
  baseWrapper.zIndex = 1000;
  baseWrapper.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
  baseContainer.boxShadow = 'none';
} else if (Platform.OS === 'ios') {
  baseWrapper.shadowColor = '#000';
  baseWrapper.shadowOpacity = 0.08;
  baseWrapper.shadowRadius = 8;
  baseWrapper.shadowOffset = { width: 0, height: 2 };
  baseWrapper.elevation = 8;
} else {
  baseWrapper.elevation = 8;
}

const styles = StyleSheet.create({
  wrapper: baseWrapper,
  container: baseContainer,
  logoContainer: {
    flex: 0,
  },
  logo: {
    height: 50,
    width: 120,
  } as any,
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flagImage: {
    height: 25,
    width: 40,
  } as any,
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundAlt,
  },
  greeting: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  loginIcon: {
    padding: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundAlt,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  } as any,
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  navButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    fontSize: 11,
  },
});
