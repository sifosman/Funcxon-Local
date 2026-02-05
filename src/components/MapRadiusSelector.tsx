import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface MapRadiusSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: Location, radiusKm: number) => void;
  initialLocation?: Location;
  initialRadius?: number;
}

export default function MapRadiusSelector({
  visible,
  onClose,
  onLocationSelected,
  initialLocation = { latitude: -26.2041, longitude: 28.0473 }, // Default: Johannesburg
  initialRadius = 20
}: MapRadiusSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location>(initialLocation);
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<any>(null);

  // Convert radius in km to meters for map circle
  const radiusInMeters = radiusKm * 1000;

  // Radius options (in km)
  const radiusOptions = [5, 10, 20, 50, 100, 200];

  const mapsModule = Platform.OS === 'web' ? null : (() => {
    try {
      return require('react-native-maps');
    } catch (e) {
      console.warn('react-native-maps not available:', e);
      return null;
    }
  })();
  
  const MapView = mapsModule?.default;
  const Circle = mapsModule?.Circle;
  const Marker = mapsModule?.Marker;
  const PROVIDER_GOOGLE = mapsModule?.PROVIDER_GOOGLE;

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd use expo-location here
      // For demo, we'll use a default location
      const currentLocation = { latitude: -26.2041, longitude: 28.0473 };
      setSelectedLocation(currentLocation);
      
      // Center map on current location
      mapRef.current?.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onLocationSelected(selectedLocation, radiusKm);
    onClose();
  };

  const getRadiusDescription = () => {
    if (radiusKm <= 10) return 'Very Local';
    if (radiusKm <= 25) return 'Local Area';
    if (radiusKm <= 75) return 'Extended Area';
    if (radiusKm <= 150) return 'Wide Area';
    return 'Very Wide Area';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Area</Text>
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.locationButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons name="my-location" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Map (native only) */}
        {Platform.OS === 'web' || !MapView ? (
          <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.surfaceMuted }]}>
            <MaterialIcons name="map" size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' }}>
              Map is loading...
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }}>
              Choose a radius below and tap Apply.
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              ...initialLocation,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            onPress={handleMapPress}
          >
            <Circle
              center={selectedLocation}
              radius={radiusInMeters}
              strokeColor={colors.primary}
              fillColor={colors.primary + '30'}
              strokeWidth={2}
            />
            <Marker coordinate={selectedLocation}>
              <View style={styles.marker}>
                <MaterialIcons name="location-on" size={32} color={colors.primary} />
              </View>
            </Marker>
          </MapView>
        )}

        {/* Radius Controls */}
        <View style={styles.radiusControls}>
          <View style={styles.radiusInfo}>
            <Text style={styles.radiusTitle}>Search Radius</Text>
            <Text style={styles.radiusValue}>{radiusKm} km</Text>
            <Text style={styles.radiusDescription}>{getRadiusDescription()}</Text>
          </View>

          <View style={styles.radiusButtons}>
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                onPress={() => handleRadiusChange(radius)}
                style={[
                  styles.radiusButton,
                  radiusKm === radius && styles.radiusButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    radiusKm === radius && styles.radiusButtonTextActive,
                  ]}
                >
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            onPress={handleApply}
            style={styles.applyButton}
          >
            <Text style={styles.applyButtonText}>Apply Search Area</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  locationButton: {
    padding: spacing.sm,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusControls: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  radiusInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radiusTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  radiusValue: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  radiusDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  radiusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    minWidth: 60,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: '#FFFFFF',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
