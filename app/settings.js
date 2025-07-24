import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { auth } from "../firebase";


export default function SettingsScreen() {
  const router = useRouter();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('studyHoursCache')
      await signOut(auth);
      router.replace("/LoginScreen");
    } catch (err) {
      console.error(err);
      Alert.alert("Logout failed", err.message);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Log out?",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "Logout", style: "destructive", onPress: handleLogout },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Dark Theme</Text>
        <Switch value={isDarkTheme} onValueChange={setIsDarkTheme} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>
      <Pressable style={styles.button} onPress={() => router.push("/about")}>
        <Text style={styles.buttonText}>About This App</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.dangerButton]}
        onPress={confirmLogout}
      >
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: { fontSize: 16 },
  button: {
    backgroundColor: "#4b7bec",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  dangerButton: { backgroundColor: "#ff3b30" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { marginTop: 40, alignItems: "center" },
  footerText: { fontSize: 12, color: "#aaa" },
});