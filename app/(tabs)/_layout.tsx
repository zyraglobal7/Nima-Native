import { Tabs } from "expo-router";
import { Sparkles, BookOpen, User } from "lucide-react-native";
import { View, Text } from "react-native";

// Custom icon wrapper for the Ask Nima tab (chat bubble)
function AskNimaIcon({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.85, color }}>💬</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5C2A33",
        tabBarInactiveTintColor: "#6B635B",
        tabBarStyle: {
          backgroundColor: "#FAF8F5",
          borderTopColor: "#E0D8CC",
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
            <AskNimaIcon color={color} size={size} />
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
