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
    </Stack>
  );
}
