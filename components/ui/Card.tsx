import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import React from "react";

export interface CardProps extends ViewProps {
  variant?: "surface" | "surface-alt" | "glass";
}

export function Card({ className, variant = "surface", ...props }: CardProps) {
  let variantStyles = "";

  switch (variant) {
    case "surface":
      variantStyles = "bg-surface border border-border";
      break;
    case "surface-alt":
      variantStyles = "bg-surface-alt border border-border";
      break;
    case "glass":
      variantStyles = "bg-surface/90 border border-border/50"; // Backdrop blur logic needs Reanimated/Expo Blur if strict
      break;
  }

  return (
    <View
      className={cn("rounded-xl p-4 shadow-sm", variantStyles, className)}
      {...props}
    />
  );
}
