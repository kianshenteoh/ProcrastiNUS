import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutAppScreen() {
  const openLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>About ProcrasiNUS</Text>

      <Text style={styles.sectionText}>
        ProcrastiNUS is a gamified productivity app that motivates you to study by taking care of a virtual pet. 
        As you log more study hours, your pet grows stronger, earns coins, unlocks levels, and stays healthy.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.bullet}>• Log study sessions to feed and level up your pet</Text>
        <Text style={styles.bullet}>• Pomodoro timer</Text>
        <Text style={styles.bullet}>• Earn coins and badges as rewards</Text>
        <Text style={styles.bullet}>• Compete on weekly leaderboards</Text>
        <Text style={styles.bullet}>• Join or create study groups</Text>
        <Text style={styles.bullet}>• Add friends and view their pets</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Version</Text>
        <Text style={styles.sectionText}>v1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developed By</Text>
        <Text style={styles.sectionText}>Teoh Kian Shen (Y2 CS), Danton Yap How Ting (Y2 CS)</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fefce8', paddingTop: 40, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e3a8a', marginBottom: 20, textAlign: 'center' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  bullet: { fontSize: 14, color: '#374151', marginTop: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  linkText: { fontSize: 14, color: '#2563eb', marginLeft: 8 },
});
