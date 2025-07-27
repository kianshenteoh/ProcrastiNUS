import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

function CenterTabButton(props) {
  const focused = props.accessibilityState?.selected ?? false;

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
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f5f7fa', 
          borderTopColor:'#f5f7fa',  
          position: 'absolute',
          elevation: 10,             
          shadowColor: '#000',        
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 5,
        },
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <FontAwesome5 size={24} name="tasks" color={focused ? tintColor : '#aaa'} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => (
            <FontAwesome5 size={24} name="user-friends" color={focused ? tintColor : '#aaa'} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: () => null, // icon is handled inside CenterTabButton
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="my-pet"
        options={{
          title: 'My Pet',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons size={28} name="pets" color={focused ? tintColor : '#aaa'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons size={28} name="person" color={focused ? tintColor : '#aaa'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrapper: { top: -10, justifyContent: 'center', alignItems: 'center' },
  centerButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgb(232, 77, 77)', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5 },
  centerFocused: { backgroundColor: '#cc0000' },
}); 