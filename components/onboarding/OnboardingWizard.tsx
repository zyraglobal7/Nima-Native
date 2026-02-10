import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProgressBar } from "./ProgressBar";
import { WelcomeStep } from "./steps/WelcomeStep";
import { GenderAgeStep } from "./steps/GenderAgeStep";
import { StyleVibeStep } from "./steps/StyleVibeStep";
import { SizeFitStep } from "./steps/SizeFitStep";
import { LocationBudgetStep } from "./steps/LocationBudgetStep";
import { PhotoUploadStep } from "./steps/PhotoUploadStep";
import { AccountStep } from "./steps/AccountStep";
import { SuccessStep } from "./steps/SuccessStep";
import { OnboardingFormData, TOTAL_STEPS } from "./types";
import {
  trackStepViewed,
  ONBOARDING_STEPS,
  OnboardingStep,
} from "@/lib/analytics";

interface OnboardingWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

function generateOnboardingToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `onb_${result}`;
}

async function getOrCreateOnboardingToken(): Promise<string> {
  const stored = await AsyncStorage.getItem("nima-onboarding-token");
  if (stored) return stored;

  const newToken = generateOnboardingToken();
  await AsyncStorage.setItem("nima-onboarding-token", newToken);
  return newToken;
}

const initialFormData: OnboardingFormData = {
  gender: "",
  age: "",
  stylePreferences: [],
  shirtSize: "M",
  waistSize: "32",
  height: "170",
  heightUnit: "cm",
  shoeSize: "40",
  shoeSizeUnit: "EU",
  country: "",
  currency: "",
  budgetRange: "mid",
  photos: [],
  uploadedImages: [],
  onboardingToken: "",
  email: "",
};

export function OnboardingWizard({
  onComplete,
  onBack,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);

  // Set onboarding token on mount
  useEffect(() => {
    getOrCreateOnboardingToken().then((token) => {
      setFormData((prev) => ({ ...prev, onboardingToken: token }));
    });
  }, []);

  // Track step views
  useEffect(() => {
    const stepNames: OnboardingStep[] = [
      ONBOARDING_STEPS.WELCOME,
      ONBOARDING_STEPS.GENDER_AGE,
      ONBOARDING_STEPS.STYLE_VIBE,
      ONBOARDING_STEPS.SIZE_FIT,
      ONBOARDING_STEPS.LOCATION_BUDGET,
      ONBOARDING_STEPS.PHOTO_UPLOAD,
      ONBOARDING_STEPS.ACCOUNT,
      ONBOARDING_STEPS.SUCCESS,
    ];
    const stepName = stepNames[currentStep];
    if (stepName) {
      trackStepViewed(stepName);
    }
  }, [currentStep]);

  const updateFormData = useCallback((data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onBack();
    }
  }, [currentStep, onBack]);

  const stepProps = {
    formData,
    updateFormData,
    onNext: handleNext,
    onBack: handleBack,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} />;
      case 1:
        return <GenderAgeStep {...stepProps} />;
      case 2:
        return <StyleVibeStep {...stepProps} />;
      case 3:
        return <SizeFitStep {...stepProps} />;
      case 4:
        return <LocationBudgetStep {...stepProps} />;
      case 5:
        return <PhotoUploadStep {...stepProps} />;
      case 6:
        return <AccountStep {...stepProps} />;
      case 7:
        return <SuccessStep {...stepProps} />;
      default:
        return null;
    }
  };

  // Show progress bar only for steps 1-6 (not welcome or success)
  const showProgressBar = currentStep > 0 && currentStep < TOTAL_STEPS - 1;

  return (
    <View className="flex-1 bg-background">
      {/* Progress bar */}
      {showProgressBar && (
        <View className="border-b border-border/50 px-4">
          <ProgressBar
            currentStep={currentStep - 1}
            totalSteps={TOTAL_STEPS - 2}
          />
        </View>
      )}

      {/* Step content */}
      <View className="flex-1">{renderStep()}</View>
    </View>
  );
}
