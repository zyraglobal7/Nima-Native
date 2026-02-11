
export const WRAPPED_THEMES = {
  aurora: {
    background: ["#1a2a6c", "#b21f1f", "#fdbb2d"],
    text: "#ffffff",
    accent: "#fdbb2d",
  },
  geometric: {
    background: ["#232526", "#414345"],
    text: "#ffffff",
    accent: "#00d2ff",
  },
  fluid: {
    background: ["#ee9ca7", "#ffdde1"],
    text: "#2D2926",
    accent: "#ff8008",
  },
  midnight: {
    background: ["#0f2027", "#203a43", "#2c5364"],
    text: "#ffffff",
    accent: "#00c6ff",
  },
  sunset: {
    background: ["#FF512F", "#DD2476"],
    text: "#ffffff",
    accent: "#ffecd2",
  },
} as const;

export type WrappedThemeType = keyof typeof WRAPPED_THEMES;
