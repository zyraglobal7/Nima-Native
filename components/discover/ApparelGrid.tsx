import { View, FlatList, ActivityIndicator } from "react-native";
import { ApparelItemCard, type ApparelItem } from "./ApparelItemCard";
import { Text } from "@/components/ui/Text";
import { Shirt } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface ApparelGridProps {
  items: ApparelItem[];
  isSelectionMode?: boolean;
  selectedItemIds?: Set<Id<"items">>;
  onItemSelect?: (itemId: Id<"items">) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onEndReached?: () => void;
  likedItemIds?: Set<Id<"items">>;
  onToggleLike?: (itemId: Id<"items">) => void;
}

export function ApparelGrid({
  items,
  isSelectionMode = false,
  selectedItemIds = new Set(),
  onItemSelect,
  isLoading = false,
  isLoadingMore = false,
  onEndReached,
  likedItemIds = new Set(),
  onToggleLike,
}: ApparelGridProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator size="large" color="#A67C52" />
        <Text className="text-muted-foreground dark:text-muted-foreground-dark mt-4">
          Loading items...
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <View className="w-16 h-16 rounded-full bg-surface-alt dark:bg-surface-alt-dark items-center justify-center mb-4">
          <Shirt size={32} color="#9C948A" />
        </View>
        <Text className="text-lg font-medium text-foreground dark:text-foreground-dark mb-2">
          No items yet
        </Text>
        <Text className="text-muted-foreground dark:text-muted-foreground-dark max-w-md text-center">
          Check back soon for new apparel items.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{ gap: 16, paddingHorizontal: 16 }}
      renderItem={({ item, index }) => (
        <View className="flex-1">
          <ApparelItemCard
            item={item}
            index={index}
            isSelectionMode={isSelectionMode}
            isSelected={selectedItemIds.has(item._id)}
            onSelect={onItemSelect}
            isLiked={likedItemIds.has(item._id)}
            onToggleLike={onToggleLike}
          />
        </View>
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoadingMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#A67C52" />
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mt-2">
              Loading more...
            </Text>
          </View>
        ) : null
      }
    />
  );
}
