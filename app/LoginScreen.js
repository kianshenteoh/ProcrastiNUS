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

  const handleLogin = async creds => {
    const mail = creds?.email ?? email;
    const pass = creds?.password ?? password;
    try {
      await signInWithEmailAndPassword(auth, mail.trim(), pass);
      router.replace('./(tabs)/tasks');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickLogin = () => handleLogin({ email: 'test@gmail.com', password: '123456' });

  return (
    <View style={s.wrapper}>
      <View style={s.card}>
        <View style={s.logoRow}>
          <Text style={s.logoPrimary}>Procrasti</Text>
          <Text style={s.logoAccent}>NUS</Text>
          <Image source={require('@/assets/images/logo.png')} style={s.logoImgSmall} />
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={s.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          style={s.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={s.btn} onPress={() => handleLogin()}>
          <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
          <Text style={s.btnTxt}>Login</Text>
        </Pressable>

        <View style={s.registerRow}>
          <Text style={s.registerTxt}>No account? </Text>
          <Link href="/RegisterScreen"><Text style={s.registerLink}>Register</Text></Link>
        </View>

        <Pressable style={s.quickBtn} onPress={handleQuickLogin}>
          <Text style={s.quickTxt}>Quick Login (Developer)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
  quickBtn:{alignSelf:'center',marginTop:24,paddingHorizontal:24,paddingVertical:10,borderRadius:14,backgroundColor:'#f43f5e'},
  quickTxt:{color:'#fff',fontWeight:'700',fontSize:14},
});
