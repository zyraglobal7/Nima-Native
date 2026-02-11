import { View, TextInput, TouchableOpacity, Platform } from "react-native";
import { useState, useRef } from "react";
import { Send } from "lucide-react-native";
import { useTheme } from "@/lib/contexts/ThemeContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
}

export function ChatInput({
  onSend,
  placeholder = "Describe what you're looking for...",
  disabled = false,
  disabledPlaceholder,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage("");
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View
      className="bg-background dark:bg-background-dark border-t border-border/40 dark:border-border-dark/40"
      style={{
        paddingBottom: Platform.OS === "ios" ? 24 : 12,
        paddingTop: 10,
        paddingHorizontal: 16,
      }}
    >
      <View className="flex-row items-end gap-2">
        {/* Text input */}
        <View
          className="flex-1 flex-row items-end bg-surface dark:bg-surface-dark rounded-2xl px-4 border border-border/30 dark:border-border-dark/30"
          style={{ minHeight: 44 }}
        >
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            placeholder={
              disabled ? disabledPlaceholder || placeholder : placeholder
            }
            placeholderTextColor={isDark ? "#7A7269" : "#9C948A"}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
            editable={!disabled}
            style={{
              flex: 1,
              fontSize: 16,
              lineHeight: 22,
              color: isDark ? "#E0D8CC" : "#2D2926",
              fontFamily: "DMSans_400Regular",
              paddingTop: Platform.OS === "ios" ? 12 : 10,
              paddingBottom: Platform.OS === "ios" ? 12 : 10,
              maxHeight: 100,
              textAlignVertical: "center",
            }}
          />
        </View>

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: canSend
              ? isDark
                ? "#C9A07A"
                : "#A67C52"
              : isDark
                ? "#3D3731"
                : "#EDE8E0",
          }}
        >
          <Send
            size={20}
            color={canSend ? "#FAF8F5" : isDark ? "#7A7269" : "#9C948A"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
