import { FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async () => {
    try { 
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const userId = email.trim().replace(/[.#$/[\]]/g, '_');

      await Promise.all([
        setDoc(doc(db, 'users', userId, 'friends', 'list'), {}),
        setDoc(doc(db, 'users', userId, 'profile', 'data'), { name: name.trim() })
      ]);
      Alert.alert('Registration Successful', 'You can now log in with your new account.', [
        { text: 'OK', onPress: () => router.replace('./LoginScreen') }
      ]);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.heading}>Create Account</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

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

        <Pressable style={styles.btn} onPress={handleRegister}>
          <FontAwesome5 name="user-plus" size={16} color="#fff" />
          <Text style={styles.btnTxt}>Register</Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginTxt}>Have an account? </Text>
          <Link href="./LoginScreen"><Text style={styles.loginLink}>Login</Text></Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:{flex:1,backgroundColor:'#e0f2fe',justifyContent:'center',alignItems:'center',padding:24},
  topBar:{position:'absolute',top:0,left:0,right:0,height:56,backgroundColor:'#0ea5e9',flexDirection:'row',alignItems:'center',paddingHorizontal:16,justifyContent:'space-between'},
  topTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  card:{width:'100%',maxWidth:420,backgroundColor:'#ffffff',padding:30,borderRadius:20,elevation:4,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:6},
  logo:{width:60,height:60,alignSelf:'center',marginBottom:16},
  heading:{fontSize:22,fontWeight:'800',textAlign:'center',marginBottom:24,color:'#0f172a'},
  input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:14,padding:14,fontSize:16,color:'#0f172a',marginBottom:14,backgroundColor:'#f8fafc'},
  btn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#0ea5e9',paddingVertical:14,borderRadius:16,marginTop:4},
  btnTxt:{color:'#fff',fontWeight:'700',fontSize:16,marginLeft:6},
  loginRow:{flexDirection:'row',justifyContent:'center',marginTop:20},
  loginTxt:{fontSize:14,color:'#475569'},
  loginLink:{fontSize:14,color:'#2563eb',marginLeft:4,fontWeight:'700'},
});
