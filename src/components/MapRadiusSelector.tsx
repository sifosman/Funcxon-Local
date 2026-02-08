import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import * as Location from 'expo-location';

// Load react-native-maps at module level (not inside component) for native platforms
let RNMaps: any = null;
if (Platform.OS !== 'web') {
  try {
    RNMaps = require('react-native-maps');
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapRadiusSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: LatLng, radiusKm: number) => void;
  initialLocation?: LatLng;
  initialRadius?: number;
}

export default function MapRadiusSelector({
  visible,
  onClose,
  onLocationSelected,
  initialLocation = { latitude: -26.2041, longitude: 28.0473 }, // Default: Johannesburg
  initialRadius = 20
}: MapRadiusSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<LatLng>(initialLocation);
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  // Convert radius in km to meters for map circle
  const radiusInMeters = radiusKm * 1000;

  // Radius options (in km)
  const radiusOptions = [5, 10, 20, 50, 100, 200];

  // Use module-level loaded maps components
  const MapView = RNMaps?.default;
  const Circle = RNMaps?.Circle;
  const Marker = RNMaps?.Marker;
  const PROVIDER_GOOGLE = RNMaps?.PROVIDER_GOOGLE;

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to detect your position.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setSelectedLocation(currentLocation);
      
      // Center map on current location (native)
      mapRef.current?.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
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

        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              title="Google Map"
              style={{ width: '100%', height: '100%', border: 'none' } as any}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBjd1KYtTaAzxzdw5ayGwwMu5Sex-gKQLI&q=${selectedLocation.latitude},${selectedLocation.longitude}&zoom=12`}
              allowFullScreen
            />
          ) : MapView ? (
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
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {Circle && (
                <Circle
                  center={selectedLocation}
                  radius={radiusInMeters}
                  strokeColor={colors.primary}
                  fillColor={colors.primary + '30'}
                  strokeWidth={2}
                />
              )}
              {Marker && (
                <Marker coordinate={selectedLocation}>
                  <View style={styles.marker}>
                    <MaterialIcons name="location-on" size={32} color={colors.primary} />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={[styles.mapFallback, { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.surfaceMuted }]}>
              <MaterialIcons name="map" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' }}>
                Map not available
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }}>
                Choose a radius below and tap Apply.
              </Text>
            </View>
          )}
        </View>

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
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFallback: {
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
