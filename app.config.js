export default {
  expo: {
    name: "Nima",
    slug: "nima-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "shopnima",
    newArchEnabled: true,
    splash: {
      image: "./assets/nima-mascott.png",
      resizeMode: "contain",
      backgroundColor: "#FAF8F5",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nima.app",
      associatedDomains: [
        "applinks:www.shopnima.ai",
        "applinks:shopnima.ai",
      ],
    },
    android: {
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/nima-mascott.png",
        backgroundColor: "#FAF8F5",
      },
      edgeToEdgeEnabled: true,
      package: "com.nima.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "www.shopnima.ai", pathPrefix: "/look/" },
            { scheme: "https", host: "www.shopnima.ai", pathPrefix: "/product/" },
            { scheme: "https", host: "www.shopnima.ai", pathPrefix: "/lookbook/" },
            { scheme: "https", host: "shopnima.ai", pathPrefix: "/look/" },
            { scheme: "https", host: "shopnima.ai", pathPrefix: "/product/" },
            { scheme: "https", host: "shopnima.ai", pathPrefix: "/lookbook/" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#5C2A33",
          sounds: ["./assets/confident_543.mp3"],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "2cd055b1-947c-4f4e-9878-0cb65c8cf604",
      },
    },
    owner: "nima-ais-organization",
  },
};