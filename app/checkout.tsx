import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/utils/format";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  AlertCircle,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Queries
  const cartItems = useQuery(api.cart.queries.getCart);
  const cartTotal = useQuery(api.cart.queries.getCartTotal);
  const createOrder = useMutation(api.orders.mutations.createOrder);

  const isLoading = cartItems === undefined || cartTotal === undefined;

  // Calculations
  const serviceFee = cartTotal ? Math.round(cartTotal.subtotal * 0.1) : 0;
  const estimatedShipping = 1500;
  const total = cartTotal
    ? cartTotal.subtotal + serviceFee + estimatedShipping
    : 0;
  const currency = cartTotal?.currency || "KES";

  const isAddressValid = () => {
    return (
      address.fullName.trim() !== "" &&
      address.addressLine1.trim() !== "" &&
      address.city.trim() !== "" &&
      address.postalCode.trim() !== "" &&
      address.country.trim() !== "" &&
      address.phone.trim() !== ""
    );
  };

  const handlePlaceOrder = async () => {
    if (!isAddressValid()) {
      Toast.show({
        type: "error",
        text1: "Please fill in all required fields",
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const result = await createOrder({
        shippingAddress: {
          fullName: address.fullName,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          state: address.state || undefined,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
        },
      });

      setOrderNumber(result.orderNumber);
      setOrderPlaced(true);
      Toast.show({ type: "success", text1: "Order placed successfully!" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: e.message || "Failed to place order",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Success View
  if (orderPlaced) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check size={40} className="text-green-600" />
        </View>
        <Text className="text-2xl font-serif font-medium text-foreground mb-2">
          Order Placed!
        </Text>
        <Text className="text-center text-muted-foreground mb-8 font-sans leading-5">
          Thanks for your order! Our Nima Delivers team will start shopping for
          your items soon.
          {orderNumber && `\nOrder #${orderNumber}`}
        </Text>

        <View className="w-full space-y-3">
          <TouchableOpacity
            onPress={() => router.replace("/discover")}
            className="w-full py-3.5 bg-primary rounded-xl flex-row items-center justify-center space-x-2"
          >
            <Sparkles size={20} color="#fff" />
            <Text className="text-primary-foreground font-medium font-sans">
              Continue Shopping
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // Using replace to go back to tabs but maybe push to avoid stack issues?
            // Better to use navigate or replace logic.
            onPress={() => router.replace("/(tabs)/profile")}
            className="w-full py-3.5 bg-surface border border-border rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-foreground font-medium font-sans">
              View Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      {/* Custom Sticky Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background/95 backdrop-blur-md border-b border-border z-10"
      >
        <View className="px-4 py-3 flex-row items-center relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-surface-alt absolute left-4 z-20"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-lg font-serif font-medium text-foreground">
              Checkout
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Items Summary */}
          <View className="bg-surface p-4 rounded-2xl border border-border mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <ShoppingBag size={20} className="text-foreground" />
              <Text className="font-medium text-foreground font-sans">
                Order Items ({cartTotal?.itemCount})
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pl-1"
            >
              {cartItems?.map((item) => (
                <View key={item._id} className="mr-3 w-16">
                  <View className="w-16 h-20 rounded-lg overflow-hidden bg-surface-alt mb-1.5 border border-border">
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        contentFit="cover"
                      />
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-foreground font-sans"
                  >
                    {item.item.name}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground font-sans">
                    x{item.quantity}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Shipping Address */}
          <View className="bg-surface p-4 rounded-2xl border border-border mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <MapPin size={20} className="text-foreground" />
              <Text className="font-medium text-foreground font-sans">
                Shipping Address
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                  Full Name *
                </Text>
                <TextInput
                  value={address.fullName}
                  onChangeText={(t) =>
                    setAddress((prev) => ({ ...prev, fullName: t }))
                  }
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                  Address Line 1 *
                </Text>
                <TextInput
                  value={address.addressLine1}
                  onChangeText={(t) =>
                    setAddress((prev) => ({ ...prev, addressLine1: t }))
                  }
                  placeholder="123 Main Street"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                    City *
                  </Text>
                  <TextInput
                    value={address.city}
                    onChangeText={(t) =>
                      setAddress((prev) => ({ ...prev, city: t }))
                    }
                    placeholder="New York"
                    placeholderTextColor="#9CA3AF"
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                    State
                  </Text>
                  <TextInput
                    value={address.state}
                    onChangeText={(t) =>
                      setAddress((prev) => ({ ...prev, state: t }))
                    }
                    placeholder="NY"
                    placeholderTextColor="#9CA3AF"
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                    Postal Code *
                  </Text>
                  <TextInput
                    value={address.postalCode}
                    onChangeText={(t) =>
                      setAddress((prev) => ({ ...prev, postalCode: t }))
                    }
                    placeholder="10001"
                    placeholderTextColor="#9CA3AF"
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                    Country *
                  </Text>
                  <TextInput
                    value={address.country}
                    onChangeText={(t) =>
                      setAddress((prev) => ({ ...prev, country: t }))
                    }
                    placeholder="USA"
                    placeholderTextColor="#9CA3AF"
                    className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1.5 font-sans">
                  Phone Number *
                </Text>
                <TextInput
                  value={address.phone}
                  onChangeText={(t) =>
                    setAddress((prev) => ({ ...prev, phone: t }))
                  }
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-sans"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Nima Delivers Info */}
          <LinearGradient
            colors={["rgba(192, 141, 93, 0.1)", "rgba(244, 244, 245, 0.1)"]}
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
                Our team will purchase your items from multiple stores and
                consolidate them into one delivery. Estimated delivery: 5-10
                business days.
              </Text>
            </View>
          </LinearGradient>

          {/* Payment Method */}
          <View className="bg-surface p-4 rounded-2xl border border-border mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <CreditCard size={20} className="text-foreground" />
              <Text className="font-medium text-foreground font-sans">
                Payment Method
              </Text>
            </View>
            <View className="bg-surface-alt p-3 rounded-xl flex-row items-center gap-3">
              <AlertCircle size={20} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground font-sans flex-1">
                Payment processing coming soon. Orders will be confirmed
                manually.
              </Text>
            </View>
          </View>

          {/* Order Summary */}
          <View className="bg-surface p-4 rounded-2xl border border-border space-y-3">
            <Text className="font-medium text-foreground font-sans text-base mb-1">
              Order Summary
            </Text>

            <View className="flex-row justify-between">
              <Text className="text-muted-foreground font-sans">Subtotal</Text>
              <Text className="text-foreground font-sans font-medium">
                {formatPrice(cartTotal?.subtotal || 0, currency)}
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
      )}

      {/* Place Order Bar */}
      {!isLoading && !orderPlaced && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-border p-4 z-20"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder || !isAddressValid()}
            className={`w-full py-4 rounded-xl flex-row items-center justify-center space-x-2 shadow-sm ${
              isPlacingOrder || !isAddressValid()
                ? "bg-primary/50"
                : "bg-primary"
            }`}
          >
            {isPlacingOrder ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text className="text-primary-foreground font-medium font-sans text-base ml-2">
                  Placing Order...
                </Text>
              </>
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text className="text-primary-foreground font-medium font-sans text-base">
                  Place Order ({formatPrice(total, currency)})
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!isAddressValid() && (
            <Text className="text-center text-xs text-muted-foreground mt-2 font-sans">
              Please fill in all required fields
            </Text>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
