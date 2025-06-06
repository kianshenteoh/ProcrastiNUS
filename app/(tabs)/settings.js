import { Image, View } from 'react-native';
import TopBar from '../../components/ui/TopBar.js';

export default function tasks() {
    
    return (<>
    <View style = {{flex: 1}}> 
    <TopBar />
    <View style = {{flex: 1}}>
        <Image
        source = {require('../../assets/images/settings-image.png')}
        style = {{width: '100%', flex: 1 }}
        resizeMode = 'contain'
        ></Image>
        </View>
    </View>
    </>);
}