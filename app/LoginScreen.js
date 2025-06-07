// LoginScreen.js
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../firebase';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(userCredential.user);
      router.replace('./(tabs)/tasks');
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  }


  return (
    <View style={styles.container}>
      <View style = {{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
        <View style = {{flexDirection: 'row' }}>
      <Text style={{color: '#00205B', fontSize: 40}}>Procrasti</Text>
      <Text style={{color: '#F37021', fontSize: 40}}>NUS</Text>
      </View>
      <Image 
        source = {require('../assets/images/logo.png')}
        style = {{width: 75, height: 75}}></Image>
        </View>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <View style = {{ marginTop: 20}}/>
        <Button title="Login" onPress={handleLogin} />
      <View style = {{ marginTop: 20}}/>
      <View style = {{flexDirection: 'row'}}>
      <Text style = {{fontSize:15}}>Don't have an account? Register</Text>
        <Link href = "/RegisterScreen">
         <Text style = {{fontSize: 15, color: '#0000FF'}}> here</Text>
        </Link>
        </View> 
        <View style = {{marginTop: 50}}>                     
        <Button title = "Quick Login (temporary)" color = '#FF2400' onPress = {() => router.replace('./(tabs)/tasks')}/>
          </View>
    </View> 
  ); 
} 

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 8,
    padding: 12,
    borderRadius: 6,
  },
  title: {
    fontSize: 40,
    marginBottom: 2,
    textAlign: 'center',
  },
});