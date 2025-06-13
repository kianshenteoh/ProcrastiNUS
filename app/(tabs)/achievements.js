import { Image, View } from 'react-native';

export default function achievements() {
    
    return (<>
    <View style = {{flex: 1}}> 
    <View style = {{flex: 1}}>
        <Image
        source = {require('../../assets/images/achievements-image.png')}
        style = {{width: '100%', flex: 1 }}
        resizeMode = 'contain'
        ></Image>
        </View>
    </View>
    </>);
}