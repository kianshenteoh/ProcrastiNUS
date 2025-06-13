import { Image, View } from 'react-native';

export default function calendar() {
    
    return (<>
    <View style = {{flex: 1}}> 
    <View style = {{flex: 1}}>
        <Image
        source = {require('../../assets/images/timetable-image.png')}
        style = {{width: '100%', flex: 1 }}
        resizeMode = "contain"
        ></Image>
        </View>
    </View>
    </>);
}