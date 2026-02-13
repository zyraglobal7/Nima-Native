import { Tabs } from "expo-router";
import { Sparkles, BookOpen, User, MessageCircle } from "lucide-react-native";
import { useTheme } from "@/lib/contexts/ThemeContext";

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#C9A07A" : "#5C2A33",
        tabBarInactiveTintColor: isDark ? "#8C8078" : "#6B635B",
        tabBarStyle: {
          backgroundColor: isDark ? "#1A1614" : "#FAF8F5",
          borderTopColor: isDark ? "#3D3835" : "#E0D8CC",
          borderTopWidth: 0.5,
          paddingBottom: 0,
          paddingTop: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Sparkles color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask Nima",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lookbooks"
        options={{
          title: "Lookbooks",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
