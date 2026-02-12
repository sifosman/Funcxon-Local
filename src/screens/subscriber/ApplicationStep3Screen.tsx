import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep3 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { PhotoUploadCounter } from '../../components/PhotoUploadCounter';
import { canUploadMorePhotos, incrementVendorPhotoCount, decrementVendorPhotoCount } from '../../lib/subscription';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type ProfileStackParamList = {
  ApplicationStep2: undefined;
  ApplicationStep3: undefined;
  ApplicationStep4: undefined;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

type RequiredDocKey = 'bank_confirmation' | 'id_copy' | 'proof_of_residence' | 'company_logo';
type DocKey = RequiredDocKey | 'cipro';

const BUSINESS_DOCS: Array<{ key: DocKey; label: string; required: boolean; acceptLabel?: string }> = [
  { key: 'bank_confirmation', label: 'Bank Confirmation letter', required: true },
  { key: 'id_copy', label: 'ID copy', required: true },
  { key: 'cipro', label: 'CIPRO', required: false, acceptLabel: 'If applicable' },
  { key: 'proof_of_residence', label: 'Proof of residence', required: true },
  { key: 'company_logo', label: 'Company Logo', required: true },
];

export default function ApplicationStep3Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep3 } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendorId, setVendorId] = useState<number | null>(null);

  useEffect(() => {
    async function loadVendorId() {
      if (!user) return;
      const { data } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setVendorId(data.id);
    }
    loadVendorId();
  }, [user]);

  const handlePickImages = async () => {
    try {
      // Check if user can upload more photos (only if they have a vendor record)
      if (vendorId) {
        const canUpload = await canUploadMorePhotos(vendorId);
        if (!canUpload) {
          Alert.alert(
            'Photo Limit Reached',
            'You\'ve reached your photo limit. Upgrade your subscription to add more photos.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 10, // Reasonable limit for batch upload
      });

      if (!result.canceled && result.assets) {
        // Validate file sizes
        const validImages = result.assets.filter((asset) => {
          const fileSize = asset.fileSize || 0;
          if (fileSize > MAX_IMAGE_SIZE) {
            Alert.alert(
              'File Too Large',
              `${asset.fileName || 'Image'} exceeds 10MB limit.`
            );
            return false;
          }
          return true;
        });

        // Add valid images to state
        const newImages = validImages.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        }));

        // Update state with new images
        const updatedImages = [...state.step3.images, ...newImages];
        updateStep3({ images: updatedImages });

        // Increment photo count for each uploaded image (only if vendor exists)
        if (vendorId) {
          for (let i = 0; i < newImages.length; i++) {
            await incrementVendorPhotoCount(vendorId);
          }
        }

        if (validImages.length > 0) {
          Alert.alert('Success', `${validImages.length} image(s) added successfully.`);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const getBusinessDoc = (key: DocKey) =>
    state.step3.documents.find((d) => typeof d.name === 'string' && d.name.startsWith(`${key}__`));

  const upsertBusinessDoc = (key: DocKey, doc: { uri: string; name: string; type: string; size: number }) => {
    const prefix = `${key}__`;
    const kept = state.step3.documents.filter((d) => !(typeof d.name === 'string' && d.name.startsWith(prefix)));
    updateStep3({ documents: [...kept, doc] });
  };

  const handlePickDocumentFor = async (key: DocKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        if (asset.size && asset.size > MAX_DOCUMENT_SIZE) {
          Alert.alert('File Too Large', `${asset.name} exceeds 10MB limit.`);
          return;
        }

        const newDoc = {
          uri: asset.uri,
          name: `${key}__${asset.name}`,
          type: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
        };

        upsertBusinessDoc(key, newDoc);

        Alert.alert('Success', `${asset.name} uploaded successfully.`);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick documents. Please try again.');
    }
  };

  const handleRemoveBusinessDoc = (key: DocKey) => {
    const prefix = `${key}__`;
    const updated = state.step3.documents.filter((d) => !(typeof d.name === 'string' && d.name.startsWith(prefix)));
    updateStep3({ documents: updated });
  };

  const handleDownloadBusinessDoc = async (key: DocKey) => {
    const doc = getBusinessDoc(key);
    if (!doc) return;

    const originalName = doc.name.split('__').slice(1).join('__') || 'document';
    const safeName = originalName.replace(/[\\/:*?"<>|]+/g, '_');

    try {
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          return;
        }

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          safeName,
          doc.type || 'application/pdf',
        );

        const base64 = await FileSystem.readAsStringAsync(doc.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Linking.openURL(contentUri);
        return;
      }

      const destUri = `${FileSystem.documentDirectory}${safeName}`;
      await FileSystem.copyAsync({ from: doc.uri, to: destUri });
      await Linking.openURL(destUri);
    } catch {
      Alert.alert('Unable to download file', 'Please try again.');
    }
  };

  const handlePickVideos = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to upload videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        selectionLimit: 5, // Reasonable limit for videos
      });

      if (!result.canceled && result.assets) {
        // Validate file sizes
        const validVideos = result.assets.filter((asset) => {
          const fileSize = asset.fileSize || 0;
          if (fileSize > MAX_VIDEO_SIZE) {
            Alert.alert(
              'File Too Large',
              `${asset.fileName || 'Video'} exceeds 50MB limit.`
            );
            return false;
          }
          return true;
        });

        // Add valid videos to state
        const newVideos = validVideos.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: asset.mimeType || 'video/mp4',
          size: asset.fileSize || 0,
        }));

        const updatedVideos = [...state.step3.videos, ...newVideos];
        updateStep3({ videos: updatedVideos });

        if (validVideos.length > 0) {
          Alert.alert('Success', `${validVideos.length} video(s) added successfully.`);
        }
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick videos. Please try again.');
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

  const handleNext = () => {
    const validation = validateStep3(state.step3);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    navigation.navigate('ApplicationStep4');
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
              <MaterialIcons name="cloud-upload" size={32} color={colors.primaryTeal} />
              <View>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Documents & Media
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  Page 3 of 4
                </Text>
              </View>
            </View>
            <ApplicationProgress currentStep={3} />
          </View>

          {/* Photo Upload Counter — only shown if user already has a vendor record */}
          {vendorId && (
            <PhotoUploadCounter 
              vendorId={vendorId}
              onUpgradePress={() => {
                navigation.navigate('ApplicationStep4' as any);
              }}
            />
          )}

          {/* Portfolio Images */}
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
                borderColor: colors.primaryTeal,
                borderStyle: 'dashed',
                borderRadius: radii.md,
                padding: spacing.xl,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E0F2F7',
              }}
            >
              <MaterialIcons name="add-photo-alternate" size={48} color={colors.primaryTeal} />
              <Text style={{ ...typography.body, color: colors.primaryTeal, marginTop: spacing.sm, fontWeight: '600' }}>
                Upload Images
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                JPG, PNG (Max 10MB each)
              </Text>
            </TouchableOpacity>
            {errors.images && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.images}
              </Text>
            )}
          </View>

          {/* Videos */}
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
                    <MaterialIcons name="videocam" size={24} color={colors.primaryTeal} />
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
                borderColor: colors.borderSubtle,
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

          {/* Documents */}
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
              Business Documents
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Upload the required business documents below.
            </Text>

            <View style={{ gap: spacing.sm }}>
              {BUSINESS_DOCS.map((d) => {
                const uploaded = getBusinessDoc(d.key);
                const requiredTag = d.required ? 'Required' : d.acceptLabel || 'Optional';

                const errorKey =
                  d.key === 'bank_confirmation'
                    ? 'bankConfirmation'
                    : d.key === 'id_copy'
                      ? 'idCopy'
                      : d.key === 'proof_of_residence'
                        ? 'proofOfResidence'
                        : d.key === 'company_logo'
                          ? 'companyLogo'
                          : null;

                const errorText = errorKey ? errors[errorKey] : undefined;

                return (
                  <View key={d.key}>
                    <View
                      style={{
                        padding: spacing.md,
                        borderRadius: radii.md,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: errorText ? '#EF4444' : colors.borderSubtle,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{d.label}</Text>
                          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                            {uploaded ? uploaded.name.split('__').slice(1).join('__') : requiredTag}
                          </Text>
                        </View>

                        {uploaded ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <MaterialIcons name="check-circle" size={20} color="#22C55E" />
                            <TouchableOpacity
                              onPress={() => handleDownloadBusinessDoc(d.key)}
                              style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: 6,
                                borderRadius: radii.full,
                                backgroundColor: '#E0F2F7',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons name="download" size={16} color={colors.primaryTeal} />
                              <Text style={{ ...typography.caption, color: colors.primaryTeal, fontWeight: '700' }}>Download</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View
                            style={{
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 6,
                              borderRadius: radii.full,
                              backgroundColor: d.required ? '#FEE2E2' : '#FEF3C7',
                            }}
                          >
                            <Text style={{ ...typography.caption, color: d.required ? '#991B1B' : '#92400E', fontWeight: '700' }}>
                              {requiredTag}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                        <TouchableOpacity
                          onPress={() => handlePickDocumentFor(d.key)}
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: colors.primaryTeal,
                            borderRadius: radii.md,
                            paddingVertical: spacing.sm,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: '#FFFFFF',
                          }}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="upload-file" size={18} color={colors.primaryTeal} />
                          <Text style={{ color: colors.primaryTeal, fontWeight: '700' }}>
                            {uploaded ? 'Replace' : 'Upload'}
                          </Text>
                        </TouchableOpacity>

                        {uploaded && (
                          <TouchableOpacity
                            onPress={() => handleRemoveBusinessDoc(d.key)}
                            style={{
                              borderWidth: 1,
                              borderColor: '#EF4444',
                              borderRadius: radii.md,
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.md,
                              alignItems: 'center',
                              flexDirection: 'row',
                              justifyContent: 'center',
                              gap: 6,
                              backgroundColor: '#FFFFFF',
                            }}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="delete" size={18} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontWeight: '700' }}>Remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                        PDF, DOC, DOCX (Max 10MB)
                      </Text>
                    </View>

                    {errorText && (
                      <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                        {errorText}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
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
              Note: Supported formats: JPG, PNG (max 10MB each), MP4, MOV (max 50MB each), PDF, DOC, DOCX (max 10MB each).
              </Text>
            </View>
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
