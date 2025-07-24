import { Stack } from 'expo-router';
import { UserProvider } from '../components/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
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
          options={{ headerShown: true, title: `Friend's Pet` }}
        />

        <Stack.Screen
          name="study-group"
          options={{ headerShown: true, title: 'Study Group' }}
        />

        <Stack.Screen
          name="activity-log"
          options={{ headerShown: true, title: 'Activity Log' }}
        />

        <Stack.Screen
          name="group-leaderboard"
          options={{ headerShown: true, title: 'Group Leaderboard' }}
        />
      </Stack>
    </UserProvider>
  );
}
