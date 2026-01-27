import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { 
  formatPhotoCountText, 
  getPhotoCountColor 
} from '../lib/subscription';

type PhotoUploadCounterProps = {
  vendorId: number;
  onUpgradePress?: () => void;
};

export function PhotoUploadCounter({ vendorId, onUpgradePress }: PhotoUploadCounterProps) {
  const [subscription, setSubscription] = useState<{
    subscription_tier: string;
    photo_limit: number;
    photo_count: number;
    remaining_photos: number;
    usage_percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptionInfo() {
      try {
        const { data, error } = await supabase
          .rpc('get_vendor_subscription_info', { vendor_id: vendorId });
        
        if (!error && data && data.length > 0) {
          setSubscription(data[0]);
        }
      } catch (err) {
        console.error('Failed to load subscription info:', err);
      } finally {
        setLoading(false);
      }
    }

    if (vendorId) {
      loadSubscriptionInfo();
    }
  }, [vendorId]);

  if (loading || !subscription) {
    return null;
  }

  const { photo_count, photo_limit, remaining_photos, usage_percentage, subscription_tier } = subscription;
  const isAtLimit = remaining_photos === 0;
  const isNearLimit = usage_percentage >= 80;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.counterRow}>
          <MaterialIcons 
            name="photo-library" 
            size={16} 
            color={getPhotoCountColor(photo_count, photo_limit)} 
          />
          <Text style={[
            styles.counterText,
            { color: getPhotoCountColor(photo_count, photo_limit) }
          ]}>
            {formatPhotoCountText(photo_count, photo_limit)}
          </Text>
        </View>
        
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>
            {subscription_tier?.toUpperCase() || 'FREE'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { 
                width: `${Math.min(usage_percentage, 100)}%`,
                backgroundColor: isAtLimit ? colors.destructive : (isNearLimit ? '#F59E0B' : colors.primary)
              }
            ]}
          />
        </View>
        <Text style={styles.percentageText}>
          {usage_percentage}% used
        </Text>
      </View>

      {/* Upgrade prompt */}
      {(isAtLimit || isNearLimit) && onUpgradePress && (
        <TouchableOpacity 
          style={[
            styles.upgradePrompt,
            isAtLimit && styles.upgradePromptUrgent
          ]}
          onPress={onUpgradePress}
        >
          <MaterialIcons 
            name="cloud-upload" 
            size={16} 
            color={isAtLimit ? colors.primaryForeground : colors.primary} 
          />
          <Text style={[
            styles.upgradePromptText,
            isAtLimit && styles.upgradePromptTextUrgent
          ]}>
            {isAtLimit 
              ? 'Photo limit reached. Upgrade to add more photos.' 
              : `${remaining_photos} photos remaining. Upgrade for more space.`
            }
          </Text>
          <MaterialIcons 
            name="arrow-forward" 
            size={16} 
            color={isAtLimit ? colors.primaryForeground : colors.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  counterText: {
    ...typography.caption,
    fontWeight: '600',
  },
  tierBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  tierText: {
    ...typography.caption,
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 10,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  upgradePromptUrgent: {
    backgroundColor: colors.primary,
  },
  upgradePromptText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  upgradePromptTextUrgent: {
    color: colors.primaryForeground,
  },
});
