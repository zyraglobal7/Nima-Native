import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/utils/format";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Loader2,
  Trash2,
  Minus,
  Plus,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Queries
  const cartItems = useQuery(api.cart.queries.getCart);
  const cartTotal = useQuery(api.cart.queries.getCartTotal);

  // Mutations
  const removeFromCart = useMutation(api.cart.mutations.removeFromCart);
  const updateQuantity = useMutation(api.cart.mutations.updateQuantity);
  const clearCart = useMutation(api.cart.mutations.clearCart);

  // Local State
  const [updatingId, setUpdatingId] = useState<Id<"cart_items"> | null>(null);
  const [removingId, setRemovingId] = useState<Id<"cart_items"> | null>(null);
  const [clearing, setClearing] = useState(false);

  const isLoading = cartItems === undefined || cartTotal === undefined;
  const isEmpty = !isLoading && cartItems.length === 0;

  // Constants consistent with Web
  const serviceFee = cartTotal ? Math.round(cartTotal.subtotal * 0.1) : 0;
  const estimatedShipping = 1500; // $15.00 roughly or based on currency logic
  const total = cartTotal
    ? cartTotal.subtotal + serviceFee + estimatedShipping
    : 0;
  const currency = cartTotal?.currency || "KES";

  const handleUpdateQuantity = async (
    id: Id<"cart_items">,
    currentQty: number,
    delta: number,
  ) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setUpdatingId(id);
    try {
      await updateQuantity({ cartItemId: id, quantity: newQty });
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update quantity" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (id: Id<"cart_items">) => {
    setRemovingId(id);
    try {
      await removeFromCart({ cartItemId: id });
      Toast.show({ type: "success", text1: "Item removed" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to remove item" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          setClearing(true);
          try {
            await clearCart({});
            Toast.show({ type: "success", text1: "Cart cleared" });
          } catch (e) {
            Toast.show({ type: "error", text1: "Failed to clear cart" });
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background border-b border-border"
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-surface-alt"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-serif font-medium text-foreground">
            Shopping Bag
          </Text>
          {!isEmpty && !isLoading ? (
            <TouchableOpacity onPress={handleClearCart} disabled={clearing}>
              {clearing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Trash2 size={20} className="text-muted-foreground" />
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-9" />
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="text-muted-foreground mt-4 font-sans">
            Loading your items...
          </Text>
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-muted-foreground" />
          </View>
          <Text className="text-xl font-serif font-medium text-foreground mb-2">
            Your cart is empty
          </Text>
          <Text className="text-center text-muted-foreground mb-8 font-sans">
            Discover amazing items and try them on virtually before adding to
            your cart.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/discover")} // Assuming generic discover route
            className="bg-primary px-8 py-3.5 rounded-xl flex-row items-center space-x-2"
          >
            <Sparkles size={20} color="#fff" />
            <Text className="text-primary-foreground font-medium font-sans">
              Start Discovering
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-medium text-foreground font-sans">
                {cartTotal?.itemCount}{" "}
                {cartTotal?.itemCount === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* Cart Items */}
            <View className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <View
                  key={item._id}
                  className="flex-row bg-surface p-3 rounded-xl border border-border space-x-3"
                >
                  {/* Image */}
                  <View className="w-20 h-24 bg-surface-alt rounded-lg overflow-hidden relative">
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        contentFit="cover"
                      />
                    )}
                  </View>

                  {/* Details */}
                  <View className="flex-1 justify-between py-0.5">
                    <View>
                      {item.item.brand && (
                        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans mb-0.5">
                          {item.item.brand}
                        </Text>
                      )}
                      <Text
                        numberOfLines={1}
                        className="font-medium text-foreground font-sans text-base leading-5"
                      >
                        {item.item.name}
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mt-1.5">
                        {item.selectedSize && (
                          <View className="bg-surface-alt px-2 py-0.5 rounded text-xs">
                            <Text className="text-muted-foreground text-xs font-sans">
                              Size: {item.selectedSize}
                            </Text>
                          </View>
                        )}
                        {item.selectedColor && (
                          <View className="bg-surface-alt px-2 py-0.5 rounded text-xs">
                            <Text className="text-muted-foreground text-xs font-sans">
                              Color: {item.selectedColor}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="font-sans font-semibold text-foreground">
                        {formatPrice(
                          item.item.price * item.quantity,
                          item.item.currency,
                        )}
                      </Text>

                      {/* Qty Controls */}
                      <View className="flex-row items-center bg-surface-alt rounded-lg p-0.5">
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(item._id, item.quantity, -1)
                          }
                          disabled={
                            updatingId === item._id || item.quantity <= 1
                          }
                          className="w-7 h-7 items-center justify-center rounded bg-background shadow-sm"
                        >
                          <Minus size={14} className="text-foreground" />
                        </TouchableOpacity>
                        <View className="w-8 items-center justify-center">
                          {updatingId === item._id ? (
                            <ActivityIndicator
                              size="small"
                              className="scale-75"
                            />
                          ) : (
                            <Text className="font-medium font-sans text-foreground">
                              {item.quantity}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(item._id, item.quantity, 1)
                          }
                          disabled={updatingId === item._id}
                          className="w-7 h-7 items-center justify-center rounded bg-background shadow-sm"
                        >
                          <Plus size={14} className="text-foreground" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemove(item._id)}
                        disabled={removingId === item._id}
                        className="p-1.5 ml-2"
                      >
                        {removingId === item._id ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <Trash2 size={18} className="text-muted-foreground" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Nima Delivers Banner */}
            <LinearGradient
              colors={["rgba(192, 141, 93, 0.1)", "rgba(244, 244, 245, 0.1)"]} // Primary/10 to Secondary/10 roughly
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-2xl border border-primary/20 mb-6 flex-row space-x-3"
            >
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Sparkles size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-foreground font-sans text-base">
                  Nima Delivers
                </Text>
                <Text className="text-sm text-muted-foreground mt-1 font-sans leading-5">
                  We handle everything! Nima purchases items from multiple
                  stores and delivers them straight to you in one package.
                </Text>
              </View>
            </LinearGradient>

            {/* Order Summary */}
            <View className="bg-surface p-4 rounded-2xl border border-border space-y-3 mb-6">
              <Text className="font-medium text-foreground font-sans text-base mb-1">
                Order Summary
              </Text>

              <View className="flex-row justify-between">
                <Text className="text-muted-foreground font-sans">
                  Subtotal
                </Text>
                <Text className="text-foreground font-sans font-medium">
                  {formatPrice(cartTotal.subtotal, currency)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-muted-foreground font-sans">
                  Nima Service Fee (10%)
                </Text>
                <Text className="text-foreground font-sans font-medium">
                  {formatPrice(serviceFee, currency)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-muted-foreground font-sans">
                  Est. Shipping
                </Text>
                <Text className="text-foreground font-sans font-medium">
                  {formatPrice(estimatedShipping, currency)}
                </Text>
              </View>

              <View className="h-[1px] bg-border my-2" />

              <View className="flex-row justify-between items-center">
                <Text className="text-foreground font-medium font-sans text-lg">
                  Total
                </Text>
                <Text className="text-foreground font-bold font-sans text-xl">
                  {formatPrice(total, currency)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout Button Bar */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-border p-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <TouchableOpacity
              onPress={() => router.push("/checkout")}
              className="bg-primary w-full py-4 rounded-xl flex-row items-center justify-center space-x-2 shadow-sm active:opacity-90"
            >
              <ShoppingBag size={20} color="#fff" />
              <Text className="text-primary-foreground font-medium font-sans text-base">
                Proceed to Checkout
              </Text>
              <Text className="text-primary-foreground/80 font-medium font-sans text-sm">
                ({formatPrice(total, currency)})
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
