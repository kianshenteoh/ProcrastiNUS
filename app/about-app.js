import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutAppScreen() {
  const openGitHub = () => {
    Linking.openURL('https://github.com/kianshenteoh/ProcrastiNUS');
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.title}>About ProcrastiNUS</Text>

      <Text style={styles.description}>
        ProcrastiNUS is a gamified productivity app that motivates you to study by taking care of a virtual pet. 
        The more you study, the more your pet grows — gaining coins, leveling up, and staying energized.{"\n\n"}
        It also includes rich social features: compete on weekly leaderboards, create or join study groups, and interact with friends through their pets.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.bulletGroup}>
          <Text style={styles.bullet}>• Track and log focused study sessions</Text>
          <Text style={styles.bullet}>• Feed and level up your virtual pet</Text>
          <Text style={styles.bullet}>• Smart task management system</Text>
          <Text style={styles.bullet}>• Built-in calendar for planning & scheduling</Text>
          <Text style={styles.bullet}>• Pomodoro-style timer integration</Text>
          <Text style={styles.bullet}>• Earn coins, badges, and daily rewards</Text>
          <Text style={styles.bullet}>• Weekly study leaderboards to compete with friends</Text>
          <Text style={styles.bullet}>• Join or create collaborative study groups</Text>
          <Text style={styles.bullet}>• View and feed your friends’ pets</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Version</Text>
        <Text style={styles.sectionText}>v1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developed By</Text>
        <Text style={styles.sectionText}>Teoh Kian Shen (Y2 CS), Danton Yap How Ting (Y2 CS)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repository</Text>
        <Pressable onPress={openGitHub}>
          <Text style={styles.link}>github.com/kianshenteoh/ProcrastiNUS</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fefce8', paddingTop: 40, paddingHorizontal: 20 },
  content: { paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e3a8a', textAlign: 'center', marginBottom: 20 },
  description: { fontSize: 15, lineHeight: 22, color: '#374151', marginBottom: 24, textAlign: 'justify' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 10 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  bulletGroup: { paddingLeft: 10 },
  bullet: { fontSize: 14, color: '#374151', marginBottom: 6 },
  link: { fontSize: 14, color: '#2563eb', textDecorationLine: 'underline' }  
});
