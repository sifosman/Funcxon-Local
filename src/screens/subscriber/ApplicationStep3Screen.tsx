import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        // Validate file sizes
        const validDocuments = result.assets.filter((asset) => {
          if (asset.size && asset.size > MAX_DOCUMENT_SIZE) {
            Alert.alert(
              'File Too Large',
              `${asset.name} exceeds 10MB limit.`
            );
            return false;
          }
          return true;
        });

        // Add valid documents to state
        const newDocuments = validDocuments.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
        }));

        const updatedDocuments = [...state.step3.documents, ...newDocuments];
        updateStep3({ documents: updatedDocuments });

        if (validDocuments.length > 0) {
          Alert.alert('Success', `${validDocuments.length} document(s) added successfully.`);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick documents. Please try again.');
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

  const handleRemoveDocument = (index: number) => {
    const newDocuments = state.step3.documents.filter((_, i) => i !== index);
    updateStep3({ documents: newDocuments });
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
              Business Documents (Optional)
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Upload business registration, certificates, insurance, etc.
            </Text>

            {state.step3.documents.length > 0 && (
              <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
                {state.step3.documents.map((doc, index) => (
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
                    <MaterialIcons name="description" size={24} color={colors.primaryTeal} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={{ ...typography.body, color: colors.textPrimary }} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        {(doc.size / 1024).toFixed(1)} KB
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveDocument(index)}>
                      <MaterialIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickDocuments}
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
              <MaterialIcons name="upload-file" size={36} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                Upload Documents
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                PDF, DOC, DOCX (Max 10MB each)
              </Text>
            </TouchableOpacity>
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
