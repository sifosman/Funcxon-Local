import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep2 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { serviceCategories, specialServiceFeatures } from '../../config/serviceProfessionals';
import { venueTypes, amenitiesList, venueCapacityOptions, eventTypes } from '../../config/venueTypes';
import { provinces, getCitiesByProvince } from '../../config/locations';

type ProfileStackParamList = {
  ApplicationStep1: undefined;
  ApplicationStep2: undefined;
  ApplicationStep3: undefined;
};

export default function ApplicationStep2Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep2 } = useApplicationForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isVenues = state.portfolioType === 'venues';
  const isVendors = state.portfolioType === 'vendors';

  const updateHall = (index: number, patch: { name?: string; capacity?: string }) => {
    const nextHalls = (state.step2.halls ?? Array.from({ length: 5 }, () => ({ name: '', capacity: '' })) ).map((h, i) =>
      i === index ? { ...h, ...patch } : h
    );
    updateStep2({ halls: nextHalls });
  };

  const toggleArrayItem = (field: keyof typeof state.step2, value: string) => {
    const currentArray = state.step2[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateStep2({ [field]: newArray });
  };

  const toggleProvince = (provinceName: string) => {
    const currentProvinces = state.step2.provinces;
    if (currentProvinces.includes(provinceName)) {
      const newProvinces = currentProvinces.filter((p) => p !== provinceName);
      const citiesToRemove = getCitiesByProvince(provinceName);
      const newCities = state.step2.cities.filter((c) => !citiesToRemove.includes(c));
      updateStep2({ provinces: newProvinces, cities: newCities });
    } else {
      updateStep2({ provinces: [...currentProvinces, provinceName] });
    }
  };

  const getAvailableCities = (): string[] => {
    return state.step2.provinces.flatMap((prov) => getCitiesByProvince(prov));
  };

  const handleNext = () => {
    const validation = validateStep2(state.step2, state.portfolioType);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    navigation.navigate('ApplicationStep3');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <MaterialIcons name="category" size={32} color={colors.primaryTeal} />
              <View>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  {isVenues ? 'Venue Details' : 'Service Category & Coverage'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  Page 2 of 4
                </Text>
              </View>
            </View>
            <ApplicationProgress currentStep={2} />
          </View>

          {/* Venue-specific sections */}
          {isVenues && (
            <>
              {/* Venue Type */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Venue Type *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {venueTypes.map((type) => {
                    const isSelected = state.step2.venueType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => updateStep2({ venueType: type })}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.venueType && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                    {errors.venueType}
                  </Text>
                )}
              </View>

              {/* Venue Capacity */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Venue Capacity *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {venueCapacityOptions.map((capacity) => {
                    const isSelected = state.step2.venueCapacity === capacity;
                    return (
                      <TouchableOpacity
                        key={capacity}
                        onPress={() => updateStep2({ venueCapacity: capacity })}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                          {capacity}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.venueCapacity && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                    {errors.venueCapacity}
                  </Text>
                )}
              </View>

              {/* Amenities */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Amenities
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {amenitiesList.map((amenity) => {
                    const isSelected = state.step2.amenities.includes(amenity);
                    return (
                      <TouchableOpacity
                        key={amenity}
                        onPress={() => toggleArrayItem('amenities', amenity)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                          {amenity}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Event Types */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Event Types *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {eventTypes.map((event) => {
                    const isSelected = state.step2.eventTypes.includes(event);
                    return (
                      <TouchableOpacity
                        key={event}
                        onPress={() => toggleArrayItem('eventTypes', event)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                          {event}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.eventTypes && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                    {errors.eventTypes}
                  </Text>
                )}
              </View>

              {/* Awards / Nominations */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Awards / Nominations
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
                  List any awards or nominations your venue has received
                </Text>
                <TextInput
                  placeholder="e.g., Best Wedding Venue 2024, Top 10 Event Spaces..."
                  value={state.step2.awardsAndNominations ?? ''}
                  onChangeText={(value) => updateStep2({ awardsAndNominations: value })}
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    textAlignVertical: 'top',
                    minHeight: 110,
                  }}
                />
              </View>

              {/* Browser Tags */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Browser Tags
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
                  Add keywords that help users find your venue (comma separated)
                </Text>
                <TextInput
                  placeholder="e.g., outdoor, garden, rustic, modern, luxury..."
                  value={state.step2.browserTags ?? ''}
                  onChangeText={(value) => updateStep2({ browserTags: value })}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              {/* Number of Halls on Property */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Number of Halls on Property
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
                  Add details for each hall/space at your venue (up to 5)
                </Text>

                {Array.from({ length: 5 }, (_, idx) => {
                  const hall = state.step2.halls?.[idx] ?? { name: '', capacity: '' };
                  const hallNumber = idx + 1;
                  return (
                    <View
                      key={`hall-${hallNumber}`}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        borderRadius: radii.lg,
                        padding: spacing.md,
                        marginBottom: spacing.md,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                            Hall {hallNumber} Name
                          </Text>
                          <TextInput
                            placeholder="e.g., Main Hall, Garden Pavilion..."
                            value={hall.name}
                            onChangeText={(value) => updateHall(idx, { name: value })}
                            style={{
                              borderWidth: 1,
                              borderColor: colors.borderSubtle,
                              borderRadius: radii.md,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              backgroundColor: colors.surface,
                              fontSize: 14,
                              color: colors.textPrimary,
                            }}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                            Hall {hallNumber} Capacity
                          </Text>
                          <TextInput
                            placeholder="e.g., 200 guests"
                            value={hall.capacity}
                            onChangeText={(value) => updateHall(idx, { capacity: value })}
                            style={{
                              borderWidth: 1,
                              borderColor: colors.borderSubtle,
                              borderRadius: radii.md,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              backgroundColor: colors.surface,
                              fontSize: 14,
                              color: colors.textPrimary,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Venue Payment Terms & Conditions */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Venue Payment Terms & Conditions
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
                  Describe your payment terms, deposit requirements, and conditions
                </Text>
                <TextInput
                  placeholder="e.g., 50% deposit required to secure booking, balance due 14 days before event..."
                  value={state.step2.paymentTermsAndConditions ?? ''}
                  onChangeText={(value) => updateStep2({ paymentTermsAndConditions: value })}
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    textAlignVertical: 'top',
                    minHeight: 110,
                  }}
                />
              </View>
            </>
          )}

          {/* Vendor-specific sections */}
          {isVendors && (
            <>
              {/* Service Categories */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Service Categories *
                </Text>
                {serviceCategories.map((category) => {
                  const isSelected = state.step2.serviceCategories.includes(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => toggleArrayItem('serviceCategories', category.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                        borderRadius: radii.md,
                        backgroundColor: isSelected ? '#E0F2F7' : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                          {category.name}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                          {category.description}
                        </Text>
                      </View>
                      {isSelected && <MaterialIcons name="check-circle" size={24} color={colors.primaryTeal} />}
                    </TouchableOpacity>
                  );
                })}
                {errors.serviceCategories && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                    {errors.serviceCategories}
                  </Text>
                )}
              </View>

              {/* Service Subcategories */}
              {state.step2.serviceCategories.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                    Service Subcategories
                  </Text>
                  {state.step2.serviceCategories.map((catId) => {
                    const category = serviceCategories.find((c) => c.id === catId);
                    if (!category) return null;
                    return (
                      <View key={catId} style={{ marginBottom: spacing.lg }}>
                        <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
                          {category.name}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                          {category.types.map((type) => {
                            const isSelected = state.step2.serviceSubcategories.includes(type);
                            return (
                              <TouchableOpacity
                                key={type}
                                onPress={() => toggleArrayItem('serviceSubcategories', type)}
                                style={{
                                  paddingHorizontal: spacing.md,
                                  paddingVertical: spacing.sm,
                                  borderRadius: radii.full,
                                  backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                                  borderWidth: 1,
                                  borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                                }}
                              >
                                <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                                  {type}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Special Features */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Special Features
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {specialServiceFeatures.map((feature) => {
                    const isSelected = state.step2.specialFeatures.includes(feature);
                    return (
                      <TouchableOpacity
                        key={feature}
                        onPress={() => toggleArrayItem('specialFeatures', feature)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                          {feature}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* Coverage Areas (for both) */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
              Coverage Areas - Provinces *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {provinces.map((province) => {
                const isSelected = state.step2.provinces.includes(province.name);
                return (
                  <TouchableOpacity
                    key={province.name}
                    onPress={() => toggleProvince(province.name)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.full,
                      backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                      {province.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.provinces && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.provinces}
              </Text>
            )}
          </View>

          {/* Cities */}
          {state.step2.provinces.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Coverage Areas - Cities
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {getAvailableCities().map((city) => {
                  const isSelected = state.step2.cities.includes(city);
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => toggleArrayItem('cities', city)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radii.full,
                        backgroundColor: isSelected ? colors.primaryTeal : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                      }}
                    >
                      <Text style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: 13 }}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Business Description *
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Minimum 50 characters
            </Text>
            <TextInput
              placeholder="Describe your business, services, or venue..."
              value={state.step2.description}
              onChangeText={(value) => updateStep2({ description: value })}
              multiline
              numberOfLines={6}
              style={{
                borderWidth: 1,
                borderColor: errors.description ? '#EF4444' : colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surface,
                fontSize: 14,
                color: colors.textPrimary,
                textAlignVertical: 'top',
                minHeight: 120,
              }}
            />
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
              {state.step2.description.length} characters
            </Text>
            {errors.description && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.description}
              </Text>
            )}
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primaryTeal,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.primaryTeal, fontSize: 16, fontWeight: '600' }}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={{
                flex: 1,
                backgroundColor: colors.primaryTeal,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: spacing.sm }}>
                Next
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
