import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import NotificationBell from './NotificationBell';
import { useIsDesktop } from '../hooks/useIsDesktop';

export default function AppHeader() {
  const { user, session, userRole } = useAuth();
  const navigation = useNavigation<any>();
  const isLister = userRole === 'vendor';
  const isDesktop = useIsDesktop();

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

  const navItems = [
    { label: 'Home', onPress: () => navigation.navigate('Main', { screen: 'Home', params: { screen: 'VendorList' } }) },
    { label: 'Venues', onPress: () => openDiscover({ category: 'venues', searchTitle: 'Discover Venues' }) },
    { label: 'Vendors', onPress: () => openDiscover({ category: 'vendors', searchTitle: 'Discover Vendors and services' }) },
    {
      label: 'Listers Portal',
      onPress: () => {
        if (session && isLister) {
          navigation.navigate('Main', { screen: 'Account', params: { screen: 'ListerPortfolio' } });
        } else {
          navigation.navigate('Main', { screen: 'Home', params: { screen: 'ListersPortal' } });
        }
      },
    },
  ];

  // ─── Desktop Layout ───
  if (isDesktop) {
    return (
      <View style={styles.wrapper as any}>
        <View style={styles.desktopContainer as any}>
          {/* Logo - Left */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Main', { screen: 'Home', params: { screen: 'VendorList' } })}
            style={styles.desktopLogoContainer}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={styles.desktopLogo as any}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Navigation Links - Center */}
          <View style={styles.desktopNav as any}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                testID={item.label === 'Vendors' ? 'nav-vendors' : undefined}
                style={styles.desktopNavItem}
                onPress={item.onPress}
              >
                <Text style={styles.desktopNavText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions - Right */}
          <View style={styles.desktopActions}>
            <Image
              source={require('../../assets/sa-icon.png')}
              style={styles.flagImage as any}
              resizeMode="contain"
            />
            {session && <NotificationBell />}
            {session ? (
              <TouchableOpacity
                style={styles.userContainer}
                onPress={() => navigation.navigate('Account')}
              >
                <MaterialIcons name="person" size={20} color={colors.primary} />
                {username && (
                  <Text style={styles.greeting}>Hi {username}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginIcon}
                onPress={() => navigation.navigate('Auth', { screen: 'SignIn' })}
              >
                <MaterialIcons name="person" size={20} color={colors.primary} />
                <Text style={styles.desktopLoginText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ─── Mobile Layout (unchanged) ───
  return (
    <View style={styles.wrapper as any}>
      <View style={styles.container as any}>
        {/* Logo - Left side */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo as any}
            resizeMode="contain"
          />
        </View>

        {/* Right side - Flag and User */}
        <View style={styles.rightContainer}>
          {/* SA Flag */}
          <Image
            source={require('../../assets/sa-icon.png')}
            style={styles.flagImage as any}
            resizeMode="contain"
          />

          {session && <NotificationBell />}

          {session ? (
            <TouchableOpacity
              style={styles.userContainer}
              onPress={() => navigation.navigate('Account')}
            >
              <MaterialIcons name="person" size={20} color={colors.primary} />
              {username && (
                <Text style={styles.greeting}>Hi {username}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginIcon}
              onPress={() => navigation.navigate('Auth', { screen: 'SignIn' })}
            >
              <MaterialIcons name="person" size={20} color={colors.primary} />
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
          <MaterialIcons name="home" size={18} color={colors.primary} />
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openDiscover({ category: 'venues', searchTitle: 'Discover Venues' })}
        >
          <MaterialIcons name="location-city" size={18} color={colors.primary} />
          <Text style={styles.navButtonText}>Venues</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="nav-vendors"
          style={styles.navButton}
          onPress={() => openDiscover({ category: 'vendors', searchTitle: 'Discover Vendors and services' })}
        >
          <MaterialIcons name="store" size={18} color={colors.primary} />
          <Text style={styles.navButtonText}>Vendors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (session && isLister) {
              navigation.navigate('Main', { screen: 'Account', params: { screen: 'ListerPortfolio' } });
            } else {
              navigation.navigate('Main', { screen: 'Home', params: { screen: 'ListersPortal' } });
            }
          }}
        >
          <MaterialIcons name="list" size={18} color={colors.primary} />
          <Text style={styles.navButtonText}>Listers Portal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const baseWrapper: any = {
  backgroundColor: '#f7f5f0',
};

const baseContainer: any = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
  backgroundColor: '#f7f5f0',
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
    backgroundColor: colors.surface,
  },
  greeting: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  loginIcon: {
    padding: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#f7f5f0',
  } as any,
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: '#f7f5f0',
  },
  navButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 11,
  },
  // ─── Desktop styles ───
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: spacing.marginDesktop,
    paddingVertical: spacing.md,
    backgroundColor: '#f7f5f0',
    minHeight: 80,
  } as any,
  desktopLogoContainer: {
    flex: 0,
  },
  desktopLogo: {
    height: 48,
    width: 140,
  } as any,
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  } as any,
  desktopNavItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
  } as any,
  desktopNavText: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.onSurfaceVariant,
  },
  desktopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  desktopLoginText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
    marginLeft: spacing.xs,
  },
});
