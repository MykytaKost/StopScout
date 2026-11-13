import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingTop: 5,
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Odjazdy",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bus-outline"
              color={String(color ?? "#6B7280")}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
