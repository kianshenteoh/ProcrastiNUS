import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, Pressable, Text, View } from 'react-native';
import { auth } from '../../firebase';

//Planning to add logo to top left and tab name next to it
export default function TopBar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
         await signOut(auth);
         router.replace('../../LoginScreen');
        } catch (error) {
            console.log(error);
            alert(error.message)
        }
    }

    const confirmLogout = () => {
        Alert.alert('Log out?',
            'Are you sure you want to log out?',
            [
                {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                {text: 'Logout', 
                style: 'destructive',
                onPress: handleLogout}
            ], 
            {cancelable: true}
        );
    }
 
    return (<>
    <View style = {{height: 50, backgroundColor: '#3479DB', 
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>   
        <Pressable onPress = { confirmLogout }> 
            <Text style = {{fontSize: 25, color: '#FFFFFF'}}>Logout</Text>
            </Pressable>
    </View></>);
}