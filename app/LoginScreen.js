import { FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (creds) => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    const mail = creds?.email ?? email;
    const pass = creds?.password ?? password;
    
    try {
      await signInWithEmailAndPassword(auth, mail.trim(), pass);
      router.replace('./(tabs)/tasks');
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      }
      alert(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleQuickLogin1 = () => handleLogin({ email: 'b@gmail.com', password: '123456' });
  const handleQuickLogin2 = () => handleLogin({ email: 'e@gmail.com', password: '123456' });

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <Text style={styles.logoPrimary}>Procrasti</Text>
          <Text style={styles.logoAccent}>NUS</Text>
          <Image source={require('@/assets/images/logo.png')} style={styles.logoImgSmall} />
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable 
          style={[styles.btn, isLoggingIn && { opacity: 0.7 }]} 
          onPress={() => handleLogin()}
          disabled={isLoggingIn}
        >
          <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
          <Text style={styles.btnTxt}>
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Text>
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerTxt}>No account? </Text>
          <Link href="/RegisterScreen"><Text style={styles.registerLink}>Register</Text></Link>
        </View>

        {/* 
        <Pressable style={styles.quickBtn} onPress={handleQuickLogin1}>
          <Text style={styles.quickTxt}>Quick Login Account 1 (Developer)</Text>
        </Pressable>

        <Pressable style={styles.quickBtn} onPress={handleQuickLogin2}>
          <Text style={styles.quickTxt}>Quick Login Account 2 (Developer)</Text>
        </Pressable>
        */}
      </View>
    </View> 
  );
}

const styles = StyleSheet.create({
  wrapper:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f1f5f9',padding:24},
  card:{width:'100%',maxWidth:420,backgroundColor:'#ffffff',padding:30,borderRadius:20,elevation:4,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:6},
  logoRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:24},
  logoPrimary:{fontSize:30,fontWeight:'600',color:'#0f172a'},
  logoAccent:{fontSize:30,fontWeight:'800',color:'#F37021',marginLeft:2},
  logoImgSmall:{width:60,height:60,marginLeft:6},
  input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:14,padding:14,fontSize:16,color:'#0f172a',marginBottom:14,backgroundColor:'#f8fafc'},
  btn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#0ea5e9',paddingVertical:14,borderRadius:16,marginTop:4},
  btnTxt:{color:'#fff',fontWeight:'700',fontSize:16,marginLeft:6},
  registerRow:{flexDirection:'row',justifyContent:'center',marginTop:16},
  registerTxt:{fontSize:14,color:'#475569'},
  registerLink:{fontSize:14,color:'#2563eb',marginLeft:4,fontWeight:'700'},
  quickBtn:{alignSelf:'center',marginTop:16,paddingHorizontal:24,paddingVertical:10,borderRadius:14,backgroundColor:'#f43f5e'},
  quickTxt:{color:'#fff',fontWeight:'700',fontSize:14},
});