import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { cssInterop } from "nativewind";
import { cn } from "@/lib/utils";
import React from "react";

cssInterop(RNText, { className: "style" });

export interface TextProps extends RNTextProps {
  className?: string;
  variant?:
    | "default"
    | "muted"
    | "large"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "caption";
}

export function Text({
  className,
  variant = "default",
  style,
  ...props
}: TextProps) {
  let variantApi = "";

  switch (variant) {
    case "h1":
      variantApi = "text-4xl font-serif font-semibold text-foreground";
      break;
    case "h2":
      variantApi = "text-3xl font-serif font-semibold text-foreground";
      break;
    case "h3":
      variantApi = "text-2xl font-serif font-semibold text-foreground";
      break;
    case "h4":
      variantApi = "text-xl font-serif font-medium text-foreground";
      break;
    case "large":
      variantApi = "text-lg font-sans text-foreground";
      break;
    case "muted":
      variantApi = "text-sm font-sans text-muted-foreground";
      break;
    case "caption":
      variantApi = "text-xs font-sans text-muted-foreground";
      break;
    default:
      variantApi = "text-base font-sans text-foreground";
      break;
  }

  return (
    <RNText className={cn(variantApi, className)} style={style} {...props} />
  );
}
