import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

function CenterTabButton(props) {
  const focused =
    props.accessibilityState?.selected ??
    props.selected ??            // Expo Router may pass it this way
    false;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={props.onPress}
      style={styles.centerWrapper}
    >
      <View style={[styles.centerButton, focused && styles.centerFocused]}>
        <FontAwesome5 name="clock" size={26} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <FontAwesome5 size={28} name="tasks" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <FontAwesome5 size={28} name="user-friends" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: () => null, 
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color }) => <FontAwesome5 size={28} name="medal" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrapper: { top: -10, justifyContent: 'center', alignItems: 'center' },
  centerButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ED2939', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5 },
  centerFocused: { backgroundColor: '#cc0000' },
});
