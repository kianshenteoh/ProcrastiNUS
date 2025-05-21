import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Pressable, Text, View } from 'react-native';
import { auth } from '../../firebase';

//Planning to add logo to top left and tab name next to it
export default function TopBar() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('./LoginScreen');
    }


    return (<>
    <View style = {{height: 50, backgroundColor: '#3479DB', 
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>   
        <Pressable onPress={handleLogout}> 
            <Text style = {{fontSize: 25, color: '#FFFFFF'}}>Logout</Text>
            </Pressable>
    </View></>);
}