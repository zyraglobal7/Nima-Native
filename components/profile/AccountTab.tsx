import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Save, Users, ChevronRight, X } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { FriendsList } from "@/components/friends/FriendsList";

export function AccountTab() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const updateProfile = useMutation(api.users.mutations.updateProfile);

  const [firstName, setFirstName] = useState(currentUser?.firstName || "");
  const [lastName, setLastName] = useState(currentUser?.lastName || "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  // Update local state when user loads
  React.useEffect(() => {
    if (currentUser) {
      if (!firstName && currentUser.firstName)
        setFirstName(currentUser.firstName);
      if (!lastName && currentUser.lastName) setLastName(currentUser.lastName);
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim()) return;

    setSaving(true);
    try {
      await updateProfile({ firstName, lastName });
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your information has been saved successfully.",
      });
      setIsEditingProfile(false);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    if (currentUser) {
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
    }
  };

  if (!currentUser) return <ActivityIndicator />;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Profile Info Tile */}
      <View className="bg-surface rounded-xl border border-border p-4 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-medium text-foreground font-serif">
            Profile Information
          </Text>
          <TouchableOpacity
            onPress={
              isEditingProfile ? cancelEdit : () => setIsEditingProfile(true)
            }
            className="px-3 py-1.5 rounded-lg bg-surface-alt"
          >
            <Text className="text-sm font-medium text-foreground font-sans">
              {isEditingProfile ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditingProfile ? (
          <View className="space-y-4">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1.5 font-sans">
                  First Name
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground font-sans h-10"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1.5 font-sans">
                  Last Name
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground font-sans h-10"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-primary rounded-lg py-2.5 items-center flex-row justify-center space-x-2"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Save size={16} color="#fff" />
                  <Text className="text-primary-foreground font-medium font-sans">
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted-foreground text-sm font-sans">
                Name
              </Text>
              <Text className="text-foreground text-sm font-sans font-medium">
                {currentUser.firstName || "-"} {currentUser.lastName || ""}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted-foreground text-sm font-sans">
                Email
              </Text>
              <Text className="text-foreground text-sm font-sans font-medium">
                {currentUser.email}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted-foreground text-sm font-sans">
                Country
              </Text>
              <Text className="text-foreground text-sm font-sans font-medium">
                {currentUser.country || "-"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Friends Card */}
      <TouchableOpacity
        onPress={() => setShowFriends(true)}
        className="bg-surface rounded-xl border border-border p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-primary/10 p-2 rounded-full">
            <Users size={20} className="text-primary" />
          </View>
          <View>
            <Text className="font-medium text-foreground text-base font-serif">
              Friends
            </Text>
            <Text className="text-sm text-muted-foreground font-sans">
              Manage your connections
            </Text>
          </View>
        </View>
        <ChevronRight size={20} className="text-muted-foreground" />
      </TouchableOpacity>

      {/* Friends Modal */}
      <Modal
        visible={showFriends}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFriends(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="px-4 py-4 border-b border-border flex-row items-center justify-between">
            <Text className="text-xl font-serif font-medium text-foreground">
              Friends
            </Text>
            <TouchableOpacity
              onPress={() => setShowFriends(false)}
              className="p-2 bg-surface-alt rounded-full"
            >
              <X size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-4 pt-4">
            <FriendsList />
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}
