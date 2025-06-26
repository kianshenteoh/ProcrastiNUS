import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" />

      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="settings"
        options={{ headerShown: true, title: 'Settings' }}
      />

      <Stack.Screen
        name="calendar"
        options={{ headerShown: true, title: 'Calendar' }}
      />

      <Stack.Screen
        name="leaderboard"
        options={{ headerShown: true, title: 'Leaderboard' }}
      />

      <Stack.Screen
        name="daily-quests"
        options={{ headerShown: true, title: 'Daily Quests' }}
      />

      <Stack.Screen
        name="view-pet"
        options={{ headerShown: true, title: 'View Pet' }}
      />
    </Stack>
  );
}
