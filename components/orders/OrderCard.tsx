import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

interface OrderCardProps {
  order: {
    _id: string;
    orderNumber: string;
    status: string;
    createdAt: number;
    itemCount: number;
    total: number;
    currency: string;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-primary text-primary-foreground";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "shipped":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusTextColor = (status: string) => {
    // Helper for native since we can't use text-primary-foreground class easily on native text sometimes inside view
    switch (status) {
      case "delivered":
        return "text-primary-foreground";
      case "processing":
        return "text-blue-800 dark:text-blue-100";
      case "shipped":
        return "text-green-800 dark:text-green-100";
      case "cancelled":
        return "text-red-800 dark:text-red-100";
      default:
        return "text-secondary-foreground";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-primary";
      case "processing":
        return "bg-blue-100 dark:bg-blue-900";
      case "shipped":
        return "bg-green-100 dark:bg-green-900";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900";
      default:
        return "bg-secondary";
    }
  };

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency || "KES",
  }).format(order.total / 100);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/orders/${order.orderNumber}`)}
      className="bg-surface border border-border rounded-xl p-4 mb-3 active:bg-surface-alt"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="font-serif font-bold text-lg text-foreground">
            {order.orderNumber}
          </Text>
          <View
            className={`px-2 py-0.5 rounded-full ${getStatusBgColor(order.status)}`}
          >
            <Text
              className={`text-xs font-medium capitalize ${getStatusTextColor(order.status)}`}
            >
              {order.status.replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-muted-foreground mb-1">
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-foreground font-medium">
              {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
            </Text>
            <Text className="text-sm text-foreground font-bold">
              {formattedPrice}
            </Text>
          </View>
        </View>

        <View className="p-2 bg-secondary/50 rounded-full">
          <ChevronRight
            size={16}
            className="text-muted-foreground"
            color="#9CA3AF"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}