import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StepProps, UploadedImage } from "../types";
import {
  trackStepCompleted,
  trackBackClicked,
  ONBOARDING_STEPS,
} from "@/lib/analytics";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadingPhoto {
  id: string;
  uri: string;
  status: "uploading" | "error";
  error?: string;
}

interface ExistingImage {
  _id: Id<"user_images">;
  url: string | null;
  filename?: string;
  isPrimary: boolean;
}

export function PhotoUploadStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: StepProps) {
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [showExistingChoice, setShowExistingChoice] = useState<boolean | null>(
    null,
  );

  // Convex mutations
  const generateUploadUrl = useMutation(
    api.userImages.mutations.generateOnboardingUploadUrl,
  );
  const saveUserImage = useMutation(
    api.userImages.mutations.saveOnboardingImage,
  );

  // Check for existing images via onboarding token (rehydration)
  const existingImages = useQuery(api.userImages.queries.getOnboardingImages, {
    onboardingToken: formData.onboardingToken,
  });

  const totalPhotos = formData.uploadedImages.length + uploadingPhotos.length;

  // Handle existing images prompt
  const hasExistingImages = existingImages && existingImages.length > 0;
  const needsExistingChoice =
    hasExistingImages &&
    showExistingChoice === null &&
    formData.uploadedImages.length === 0;

  const handleUseExisting = () => {
    if (existingImages) {
      const uploaded: UploadedImage[] = existingImages.map((img) => ({
        imageId: img._id,
        storageId: img.storageId,
        filename: img.filename || "existing.jpg",
        previewUrl: img.url || "",
      }));
      updateFormData({ uploadedImages: uploaded });
    }
    setShowExistingChoice(true);
  };

  const handleStartFresh = () => {
    setShowExistingChoice(false);
  };

  const pickAndUploadImages = useCallback(async () => {
    const remaining = MAX_PHOTOS - totalPhotos;
    if (remaining <= 0) {
      Alert.alert(
        "Maximum photos",
        `You can upload up to ${MAX_PHOTOS} photos.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to upload photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    for (const asset of result.assets) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const photo: UploadingPhoto = {
        id: tempId,
        uri: asset.uri,
        status: "uploading",
      };

      setUploadingPhotos((prev) => [...prev, photo]);

      try {
        // Get upload URL using onboarding token
        const uploadUrl = await generateUploadUrl({
          onboardingToken: formData.onboardingToken,
        });

        // Fetch the local file as blob
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        if (blob.size > MAX_FILE_SIZE) {
          setUploadingPhotos((prev) =>
            prev.map((p) =>
              p.id === tempId
                ? { ...p, status: "error", error: "File too large (max 10MB)" }
                : p,
            ),
          );
          continue;
        }

        // Upload to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type || "image/jpeg" },
          body: blob,
        });
        const { storageId } = await uploadResponse.json();

        // Save the image record with onboarding token
        const imageId = await saveUserImage({
          storageId,
          filename: asset.fileName || "photo.jpg",
          onboardingToken: formData.onboardingToken,
          imageType: "full_body", // Default to full_body for onboarding
        });

        // Update form data
        const newImage: UploadedImage = {
          imageId: imageId as string,
          storageId,
          filename: asset.fileName || "photo.jpg",
          previewUrl: asset.uri,
        };
        updateFormData({
          uploadedImages: [...formData.uploadedImages, newImage],
        });

        // Remove from uploading list
        setUploadingPhotos((prev) => prev.filter((p) => p.id !== tempId));
      } catch (err) {
        console.error("Upload error:", err);
        setUploadingPhotos((prev) =>
          prev.map((p) =>
            p.id === tempId
              ? { ...p, status: "error", error: "Upload failed. Tap to retry." }
              : p,
          ),
        );
      }
    }
  }, [totalPhotos, generateUploadUrl, saveUserImage, formData, updateFormData]);

  const removePhoto = (imageId: string) => {
    updateFormData({
      uploadedImages: formData.uploadedImages.filter(
        (img) => img.imageId !== imageId,
      ),
    });
  };

  const removeFailedUpload = (tempId: string) => {
    setUploadingPhotos((prev) => prev.filter((p) => p.id !== tempId));
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-4 py-6">
        <View className="max-w-md w-full mx-auto">
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable
              onPress={() => {
                trackBackClicked(ONBOARDING_STEPS.PHOTO_UPLOAD);
                onBack?.();
              }}
              className="p-2 -ml-2 rounded-full"
            >
              <Text className="text-2xl text-muted-foreground">←</Text>
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-serif font-semibold text-foreground">
                Show me you!
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Upload photos so I can style outfits on you
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pb-6"
        contentContainerClassName="max-w-md mx-auto gap-6"
      >
        {/* Existing images choice */}
        {needsExistingChoice && (
          <View className="bg-surface rounded-2xl p-5 gap-4">
            <Text className="text-sm font-medium text-foreground">
              You already have {existingImages?.length} photo(s) uploaded. Would
              you like to use them?
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleUseExisting}
                className="flex-1 bg-primary py-3 rounded-xl items-center"
              >
                <Text className="text-primary-foreground font-medium text-sm">
                  Use existing
                </Text>
              </Pressable>
              <Pressable
                onPress={handleStartFresh}
                className="flex-1 bg-surface-alt py-3 rounded-xl items-center border border-border"
              >
                <Text className="text-foreground font-medium text-sm">
                  Start fresh
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Tips */}
        <View className="bg-surface/80 border border-border/50 rounded-2xl p-4">
          <View className="flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
              <Text className="text-xs text-primary-foreground">📸</Text>
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-sm text-foreground font-medium">
                Tips for great results:
              </Text>
              <Text className="text-xs text-muted-foreground">
                • Full body photo in good lighting
              </Text>
              <Text className="text-xs text-muted-foreground">
                • Face clearly visible
              </Text>
              <Text className="text-xs text-muted-foreground">
                • Plain or simple background
              </Text>
            </View>
          </View>
        </View>

        {/* Photo Grid */}
        <View className="flex-row flex-wrap gap-3">
          {/* Uploaded photos */}
          {formData.uploadedImages.map((img) => (
            <View
              key={img.imageId}
              className="w-[47%] aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border"
            >
              <Image
                source={{ uri: img.previewUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => removePhoto(img.imageId)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">✕</Text>
              </Pressable>
            </View>
          ))}

          {/* Uploading photos */}
          {uploadingPhotos.map((photo) => (
            <View
              key={photo.id}
              className="w-[47%] aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border"
            >
              <Image
                source={{ uri: photo.uri }}
                className="w-full h-full opacity-50"
                resizeMode="cover"
              />
              <View className="absolute inset-0 items-center justify-center">
                {photo.status === "uploading" ? (
                  <ActivityIndicator size="large" color="#5C2A33" />
                ) : (
                  <View className="items-center gap-2">
                    <Text className="text-red-500 text-xs text-center px-2">
                      {photo.error}
                    </Text>
                    <Pressable
                      onPress={() => removeFailedUpload(photo.id)}
                      className="bg-red-500/20 px-3 py-1 rounded-full"
                    >
                      <Text className="text-red-500 text-xs font-medium">
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Add Photo Button */}
          {totalPhotos < MAX_PHOTOS && (
            <Pressable
              onPress={pickAndUploadImages}
              className="w-[47%] aspect-[3/4] rounded-xl border-2 border-dashed border-border items-center justify-center bg-surface/50"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-3xl text-muted-foreground mb-2">+</Text>
              <Text className="text-xs text-muted-foreground">Add Photo</Text>
              <Text className="text-[10px] text-muted-foreground mt-1">
                {totalPhotos}/{MAX_PHOTOS}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Requirement note */}
        <Text className="text-xs text-muted-foreground text-center">
          At least one photo is required for AI try-on styling
        </Text>

        <View className="h-4" />
      </ScrollView>

      {/* Footer CTA */}
      <View className="bg-background border-t border-border/50 p-4">
        <Pressable
          onPress={() => {
            trackStepCompleted(ONBOARDING_STEPS.PHOTO_UPLOAD, {
              photo_count: formData.uploadedImages.length,
              skipped: false,
            });
            onNext();
          }}
          disabled={formData.uploadedImages.length === 0}
          className={`w-full py-4 rounded-full items-center ${
            formData.uploadedImages.length > 0 ? "bg-primary" : "bg-primary/50"
          }`}
          style={({ pressed }) => ({
            opacity: formData.uploadedImages.length > 0 && pressed ? 0.85 : 1,
          })}
        >
          <Text className="text-primary-foreground text-base font-semibold tracking-wide">
            {formData.uploadedImages.length > 0
              ? "Continue"
              : "Upload a photo to continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
