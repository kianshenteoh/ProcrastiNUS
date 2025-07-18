import { StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';


export default function HomeScreen() {
  return (
    <LoginScreen/>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 16, 
  },
  link: {
    color: 'blue',
    fontSize: 18,
  },
});  