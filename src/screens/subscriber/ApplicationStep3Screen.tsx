import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import type { DocKey } from '../../context/ApplicationFormContext';
import { validateStep3 } from '../../utils/formValidation';
import { colors, spacing, radii, typography } from '../../theme';
import { convertBlobToBase64 } from '../../lib/applicationService';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { PhotoUploadCounter } from '../../components/PhotoUploadCounter';
import { canUploadMorePhotos, incrementVendorPhotoCount, decrementVendorPhotoCount } from '../../lib/subscription';
import { getMyVenueEntitlement } from '../../lib/venueSubscription';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ThemedAlert from '../../components/ThemedAlert';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  ApplicationStep2: undefined;
  ApplicationStep3: undefined;
  ApplicationStep4: undefined;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

const BUSINESS_DOCS: Array<{ key: DocKey; label: string; required: boolean; acceptLabel?: string }> = [
  { key: 'id_copy', label: 'ID Copy', required: true },
  { key: 'cipro', label: 'CIPRO / Company Registration', required: false, acceptLabel: 'If applicable' },
  { key: 'company_logo', label: 'Company Logo', required: true },
];

export default function ApplicationStep3Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep3 } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [vendorVideoLimit, setVendorVideoLimit] = useState<number | null>(null);
  const [venueLimits, setVenueLimits] = useState<{ photoLimit: number; videoLimit: number } | null>(null);
  const isDesktop = useIsDesktop();
  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  useEffect(() => {
    async function loadVendorId() {
      if (!user) return;
      const { data } = await supabase
        .from('vendors')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setVendorId(data.id);
        const tier = String((data as any).subscription_tier ?? '').toLowerCase();
        const limit = tier === 'premium_plus' ? 10 : tier === 'premium' ? 5 : 0;
        setVendorVideoLimit(limit);
      } else {
        setVendorVideoLimit(null);
      }
    }
    loadVendorId();
  }, [user]);

  useEffect(() => {
    async function loadVenueLimits() {
      if (!user) return;
      if (state.portfolioType !== 'venues') {
        setVenueLimits(null);
        return;
      }

      const ent = await getMyVenueEntitlement(user.id);
      setVenueLimits({ photoLimit: ent.photoUploadLimit, videoLimit: ent.videoUploadLimit });
    }

    loadVenueLimits();
  }, [state.portfolioType, user]);

  const handlePickImages = async () => {
    try {
      // Venue upload limit enforcement
      if (state.portfolioType === 'venues') {
        const limit = venueLimits?.photoLimit ?? 10;
        const remaining = Math.max(0, limit - state.step3.images.length);
        if (remaining <= 0) {
          setAlertState({ visible: true, title: 'Photo Limit Reached', message: "You've reached your photo upload limit for your current venue plan.", buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          return;
        }
      }

      // Vendor upload limit enforcement (based on subscription tier)
      if (state.portfolioType !== 'venues' && vendorVideoLimit !== null) {
        const remaining = Math.max(0, vendorVideoLimit - state.step3.videos.length);
        if (remaining <= 0) {
          const message = vendorVideoLimit === 0
            ? 'Video uploads are available on paid vendor plans. Please upgrade to upload videos.'
            : "You've reached your video upload limit for your current vendor plan.";
          setAlertState({ visible: true, title: 'Video Limit Reached', message, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          return;
        }
      }

      // Check if user can upload more photos (only if they have a vendor record)
      if (vendorId) {
        const canUpload = await canUploadMorePhotos(vendorId);
        if (!canUpload) {
          setAlertState({ visible: true, title: 'Photo Limit Reached', message: 'You\'ve reached your photo limit. Upgrade your subscription to add more photos.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          return;
        }
      }

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Required', message: 'Please grant access to your photo library to upload images.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        return;
      }

      // Launch image picker
      const venueRemaining =
        state.portfolioType === 'venues'
          ? Math.max(0, (venueLimits?.photoLimit ?? 10) - state.step3.images.length)
          : 10;
      const selectionLimit = Math.max(1, Math.min(10, venueRemaining));
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit, // Cap by plan remaining slots
      });

      if (!result.canceled && result.assets) {
        // Validate file sizes
        const validImages = result.assets.filter((asset) => {
          const fileSize = asset.fileSize || 0;
          if (fileSize > MAX_IMAGE_SIZE) {
            setAlertState({ visible: true, title: 'File Too Large', message: `${asset.fileName || 'Image'} exceeds 10MB limit.` });
            return false;
          }
          return true;
        });

        // Convert valid images to base64 and add to state
        const newImages = await Promise.all(
          validImages.map(async (asset) => {
            let uri = asset.uri;
            
            // Convert blob URL to base64 for web
            if (asset.uri.startsWith('blob:')) {
              try {
                uri = await convertBlobToBase64(asset.uri, asset.mimeType || 'image/jpeg');
              } catch (error) {
                console.error('Failed to convert image to base64:', error);
                // Fallback to original URI if conversion fails
              }
            }
            
            return {
              uri,
              name: asset.fileName || `image_${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
              size: asset.fileSize || 0,
            };
          })
        );

        // Update state with new images
        const updatedImages = [...state.step3.images, ...newImages];

        if (state.portfolioType === 'venues') {
          const limit = venueLimits?.photoLimit ?? 10;
          if (updatedImages.length > limit) {
            setAlertState({ visible: true, title: 'Photo Limit Reached', message: `Your venue plan allows up to ${limit} photo(s).`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            updateStep3({ images: updatedImages.slice(0, limit) });
            return;
          }
        }

        updateStep3({ images: updatedImages });

        // Increment photo count for each uploaded image (only if vendor exists)
        if (vendorId) {
          for (let i = 0; i < newImages.length; i++) {
            await incrementVendorPhotoCount(vendorId);
          }
        }

        if (validImages.length > 0) {
          setAlertState({ visible: true, title: 'Success', message: `${validImages.length} image(s) added successfully.` });
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setAlertState({ visible: true, title: 'Error', message: 'Failed to pick images. Please try again.' });
    }
  };

  const handlePickVideos = async () => {
    try {
      // Venue upload limit enforcement
      if (state.portfolioType === 'venues') {
        const limit = venueLimits?.videoLimit ?? 1;
        const remaining = Math.max(0, limit - state.step3.videos.length);
        if (remaining <= 0) {
          setAlertState({ visible: true, title: 'Video Limit Reached', message: "You've reached your video upload limit for your current venue plan.", buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          return;
        }
      }

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Required', message: 'Please grant access to your photo library to upload videos.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        return;
      }

      // Launch video picker
      const vendorRemaining =
        state.portfolioType !== 'venues' && vendorVideoLimit !== null
          ? Math.max(0, vendorVideoLimit - state.step3.videos.length)
          : 5;
      const venueRemaining =
        state.portfolioType === 'venues'
          ? Math.max(0, (venueLimits?.videoLimit ?? 1) - state.step3.videos.length)
          : vendorRemaining;
      const selectionLimit = Math.max(1, Math.min(5, venueRemaining));
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        selectionLimit, // Cap by plan remaining slots
      });

      if (!result.canceled && result.assets) {
        // Validate file sizes
        const validVideos = result.assets.filter((asset) => {
          const fileSize = asset.fileSize || 0;
          if (fileSize > MAX_VIDEO_SIZE) {
            setAlertState({ visible: true, title: 'File Too Large', message: `${asset.fileName || 'Video'} exceeds 50MB limit.` });
            return false;
          }
          return true;
        });

        // Convert valid videos to base64 and add to state
        const newVideos = await Promise.all(
          validVideos.map(async (asset) => {
            let uri = asset.uri;
            
            // Convert blob URL to base64 for web
            if (asset.uri.startsWith('blob:')) {
              try {
                uri = await convertBlobToBase64(asset.uri, asset.mimeType || 'video/mp4');
              } catch (error) {
                console.error('Failed to convert video to base64:', error);
                // Fallback to original URI if conversion fails
              }
            }
            
            return {
              uri,
              name: asset.fileName || `video_${Date.now()}.mp4`,
              type: asset.mimeType || 'video/mp4',
              size: asset.fileSize || 0,
            };
          })
        );

        const updatedVideos = [...state.step3.videos, ...newVideos];

        if (state.portfolioType === 'venues') {
          const limit = venueLimits?.videoLimit ?? 1;
          if (updatedVideos.length > limit) {
            setAlertState({ visible: true, title: 'Video Limit Reached', message: `Your venue plan allows up to ${limit} video(s).`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            updateStep3({ videos: updatedVideos.slice(0, limit) });
            return;
          }
        }

        updateStep3({ videos: updatedVideos });

        if (validVideos.length > 0) {
          setAlertState({ visible: true, title: 'Success', message: `${validVideos.length} video(s) added successfully.` });
        }
      }
    } catch (error) {
      console.error('Video picker error:', error);
      setAlertState({ visible: true, title: 'Error', message: 'Failed to pick videos. Please try again.' });
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      // Decrement photo count in database
      if (vendorId) await decrementVendorPhotoCount(vendorId);
      
      const newImages = state.step3.images.filter((_, i) => i !== index);
      updateStep3({ images: newImages });
    } catch (error) {
      console.error('Failed to update photo count:', error);
      // Still remove the image locally even if DB update fails
      const newImages = state.step3.images.filter((_, i) => i !== index);
      updateStep3({ images: newImages });
    }
  };

  const handleRemoveVideo = (index: number) => {
    const newVideos = state.step3.videos.filter((_, i) => i !== index);
    updateStep3({ videos: newVideos });
  };

  const handlePickDocument = async (docType: DocKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const fileSize = asset.size || 0;
      if (fileSize > MAX_DOC_SIZE) {
        setAlertState({ visible: true, title: 'File Too Large', message: `${asset.name} exceeds 10MB limit.`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        return;
      }

      // Remove any existing document of the same type (one per type)
      const filtered = state.step3.documents.filter((d) => d.docType !== docType);
      const newDoc = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        docType,
      };
      updateStep3({ documents: [...filtered, newDoc] });
      setAlertState({ visible: true, title: 'Success', message: `${BUSINESS_DOCS.find((d) => d.key === docType)?.label} uploaded successfully.`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } catch (error) {
      console.error('Document picker error:', error);
      setAlertState({ visible: true, title: 'Error', message: 'Failed to pick document. Please try again.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    }
  };

  const handleRemoveDocument = (docType: DocKey) => {
    const newDocs = state.step3.documents.filter((d) => d.docType !== docType);
    updateStep3({ documents: newDocs });
  };

  const handleNext = () => {
    const validation = validateStep3(state.step3);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setAlertState({ visible: true, title: 'Validation Error', message: 'Please fix the errors before continuing' });
      return;
    }

    navigation.navigate('ApplicationStep4');
  };

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
    paddingBottom: spacing.xxl * 6,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={isDesktop ? { ...desktopContainerStyle } as any : { paddingBottom: spacing.xxl * 6 }}
      >
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm }}>
          {!isDesktop && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Back
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ marginBottom: spacing.lg, maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
            <View style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
              <ApplicationProgress currentStep={3} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
              <MaterialIcons name="cloud-upload" size={32} color={colors.textPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={isDesktop ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.titleMedium, color: colors.textPrimary }}>
                  Portfolio Media
                </Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>
                  Page 3 of 4
                </Text>
              </View>
            </View>
          </View>

          <View style={{ maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
          {/* Photo Upload Counter — vendors with an existing record use the full counter;
              venues use an inline summary built from the already-loaded venueLimits */}
          {state.portfolioType !== 'venues' && vendorId && (
            <PhotoUploadCounter
              vendorId={vendorId}
              onUpgradePress={() => {
                navigation.navigate('ApplicationStep4' as any);
              }}
            />
          )}

          {state.portfolioType === 'venues' && venueLimits && (
            <View
              style={{
                backgroundColor: cardSurface,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: cardBorder,
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ ...typography.captionSemiBold, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Uploads limited to subscription plan
              </Text>
              {/* Photos */}
              <View style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="photo-library" size={14} color={colors.textPrimary} />
                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                      Photos: {state.step3.images.length} / {venueLimits.photoLimit}
                    </Text>
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {Math.max(0, venueLimits.photoLimit - state.step3.images.length)} remaining
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: cardBorder, borderRadius: 2, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      backgroundColor:
                        state.step3.images.length >= venueLimits.photoLimit
                          ? '#EF4444'
                          : state.step3.images.length / venueLimits.photoLimit >= 0.8
                          ? '#F59E0B'
                          : colors.primaryTeal,
                      width: `${Math.min(100, (state.step3.images.length / venueLimits.photoLimit) * 100)}%`,
                    }}
                  />
                </View>
              </View>
              {/* Videos */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="videocam" size={14} color={colors.textPrimary} />
                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                      Videos: {state.step3.videos.length} / {venueLimits.videoLimit}
                    </Text>
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {Math.max(0, venueLimits.videoLimit - state.step3.videos.length)} remaining
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: cardBorder, borderRadius: 2, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      backgroundColor:
                        state.step3.videos.length >= venueLimits.videoLimit
                          ? '#EF4444'
                          : state.step3.videos.length / Math.max(1, venueLimits.videoLimit) >= 0.8
                          ? '#F59E0B'
                          : colors.primaryTeal,
                      width: `${Math.min(100, (state.step3.videos.length / Math.max(1, venueLimits.videoLimit)) * 100)}%`,
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Portfolio Images */}
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Portfolio Images *
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Upload images of your work, venue, or services (At least 1 required)
            </Text>

            {state.step3.images.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
                {state.step3.images.map((image, index) => (
                  <View
                    key={index}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: radii.md,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: radii.full,
                        padding: 4,
                      }}
                    >
                      <MaterialIcons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickImages}
              style={{
                borderWidth: 2,
                borderColor: colors.primary,
                borderStyle: 'dashed',
                borderRadius: radii.md,
                padding: spacing.xl,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f2f7ff',
              }}
            >
              <MaterialIcons name="add-photo-alternate" size={48} color={colors.textPrimary} />
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginTop: spacing.sm }}>
                Upload Images
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                JPG, PNG (Max 10MB each)
              </Text>
            </TouchableOpacity>
            {errors.images && (
              <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.images}
              </Text>
            )}
          </View>

          {/* Videos */}
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Videos (Optional)
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Upload promotional videos or showreels
            </Text>

            {state.step3.videos.length > 0 && (
              <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
                {state.step3.videos.map((video, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: spacing.md,
                      backgroundColor: colors.background,
                      borderRadius: radii.md,
                    }}
                  >
                    <MaterialIcons name="videocam" size={24} color={colors.textPrimary} />
                    <Text
                      style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.md, flex: 1 }}
                      numberOfLines={1}
                    >
                      {video.name}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveVideo(index)}>
                      <MaterialIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickVideos}
              style={{
                borderWidth: 2,
                borderColor: cardBorder,
                borderStyle: 'dashed',
                borderRadius: radii.md,
                padding: spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="videocam" size={36} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                Upload Videos
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                MP4, MOV (Max 50MB each)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Business Documents */}
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Business Documents
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Upload required business documents (PDF, DOC, DOCX, PNG, JPG — max 10MB each)
            </Text>

            {BUSINESS_DOCS.map((doc) => {
              const existing = state.step3.documents.find((d) => d.docType === doc.key);
              const hasError = errors[doc.key];
              return (
                <View key={doc.key} style={{ marginBottom: spacing.md }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                      <MaterialIcons name="description" size={18} color={colors.textPrimary} />
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>
                        {doc.label}{doc.required ? ' *' : ''}
                      </Text>
                    </View>
                    {doc.acceptLabel && !existing && (
                      <Text style={{ ...typography.caption, color: colors.textMuted, fontStyle: 'italic' }}>
                        {doc.acceptLabel}
                      </Text>
                    )}
                  </View>

                  {existing ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        backgroundColor: colors.background,
                        borderRadius: radii.md,
                      }}
                    >
                      <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                      <Text
                        style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 }}
                        numberOfLines={1}
                      >
                        {existing.name}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveDocument(doc.key)}>
                        <MaterialIcons name="delete" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handlePickDocument(doc.key)}
                      style={{
                        borderWidth: 2,
                        borderColor: hasError ? '#EF4444' : cardBorder,
                        borderStyle: 'dashed',
                        borderRadius: radii.md,
                        padding: spacing.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="upload-file" size={28} color={colors.textMuted} />
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                        Tap to upload
                      </Text>
                    </TouchableOpacity>
                  )}
                  {hasError && (
                    <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                      {hasError}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Note about uploads */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: radii.md,
              padding: spacing.md,
              flexDirection: 'row',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="info" size={20} color="#F59E0B" style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.caption, color: '#92400E' }}>
              Note: Supported formats: JPG, PNG (max 10MB each), MP4, MOV (max 50MB each), PDF, DOC, DOCX (max 10MB each). Images are saved to your profile gallery.
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: cardSurface,
                borderWidth: 1,
                borderColor: colors.primary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: 16 }}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={{
                flex: 1,
                backgroundColor: colors.cta,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', fontSize: 16, marginRight: spacing.sm }}>
                Next
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
