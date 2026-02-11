import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { X, Volume2, VolumeX } from "lucide-react-native";
import { WRAPPED_THEMES, WrappedThemeType } from "./themes";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface WrappedContainerProps {
  children: React.ReactNode[];
  theme?: WrappedThemeType;
  onClose?: () => void;
}

export function WrappedContainer({
  children,
  theme = "aurora",
  onClose,
}: WrappedContainerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const totalSlides = React.Children.count(children);
  const currentTheme = WRAPPED_THEMES[theme] || WRAPPED_THEMES.aurora;

  // Animation values
  const progress = useSharedValue(0);
  const slideOpacity = useSharedValue(1);

  // Handle slide change
  const changeSlide = (direction: "next" | "prev") => {
    slideOpacity.value = 0;

    setTimeout(() => {
      if (direction === "next") {
        if (currentIndex < totalSlides - 1) {
          setCurrentIndex((prev) => prev + 1);
          progress.value = 0; // Reset progress for next slide
        } else {
          // End of wrapped
          onClose?.();
        }
      } else {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          progress.value = 0;
        }
      }
      // Fade is handled by key change in React, re-mount triggers entry animation usually
      // But here we can manually fade in
      slideOpacity.value = withTiming(1, { duration: 300 });
    }, 100);
  };

  // Auto-advance (Mock, simplified)
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 5000, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(changeSlide)("next");
        }
      },
    );
  }, [currentIndex]);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    opacity: slideOpacity.value,
    flex: 1,
  }));

  // Pause on press logic could be added here

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LinearGradient
        colors={currentTheme.background as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View key={i} style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                          ? undefined // Use animated width logic if we were animating style directly, but we use shared value
                          : "0%",
                    // For the current index, we want the animated progress
                    flex: i === currentIndex ? undefined : undefined,
                  },
                  i === currentIndex &&
                    useAnimatedStyle(() => ({
                      width: `${progress.value * 100}%`,
                    })),
                ]}
              />
              {i < currentIndex && (
                <View style={[styles.progressBarFill, { width: "100%" }]} />
              )}
            </View>
          ))}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            style={styles.iconButton}
          >
            {isMuted ? (
              <VolumeX color="white" size={20} />
            ) : (
              <Volume2 color="white" size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Slide Content */}
        <Animated.View style={animatedSlideStyle}>
          {React.Children.toArray(children)[currentIndex]}
        </Animated.View>

        {/* Tap Zones */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={{ flexDirection: "row", flex: 1 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => changeSlide("prev")}
            />
            <TouchableOpacity
              style={{ flex: 2 }}
              onPress={() => changeSlide("next")}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 4,
    zIndex: 20,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 20,
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.1)", // Subtle touch target
    borderRadius: 20,
  },
});
