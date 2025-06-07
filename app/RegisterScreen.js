import { FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../firebase';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

 const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(userCredential.user);
      router.replace('./LoginScreen')
    } catch(error) {
      console.log(error);
      alert(error.message);
    }
  }

    return (<>
     <View style = {{height: 60, backgroundColor: '#3479DB', 
          flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>   
        <Link href = './LoginScreen' asChild>
            <Pressable>
                 <FontAwesome5 size={30} name="arrow-left" color = '#fff'/>
             </Pressable>
       </Link>
      </View>


    <View style = {styles.container}>
        <Text style = {{fontSize: 25}}>Register New User</Text>
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
      <Button title = 'Register' color= "#888" onPress ={handleRegister}/>
    </View>
    </>
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