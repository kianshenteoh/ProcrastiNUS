import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LeaderboardScreen() {
  const [players] = useState([
    { id:'1', name:'Abby',   pet:require('@/assets/images/Pet-Dog-Golden.png'), level:8, totalBadges:8, badgeIcons:['fire','tasks','sun'],  hoursTotal:220, hoursWeek:14 },
    { id:'2', name:'Joseph',   pet:require('@/assets/images/Pet-Cat-Red.png'), level:9, totalBadges:4, badgeIcons:['trophy','tasks','fire'],hoursTotal:240, hoursWeek:12 },
    { id:'3', name:'Ming Yuan',  pet:require('@/assets/images/Pet-Parrot-CottonCandyBlue.png'), level:6, totalBadges:9, badgeIcons:['sun','bolt','moon'],hoursTotal:150, hoursWeek:11 },
    { id:'4', name:'Andrew Yang',    pet:require('@/assets/images/Pet-Axolotl-CottonCandyPink.png'), level:7, totalBadges:12, badgeIcons:['moon','tasks','trophy'],hoursTotal:180, hoursWeek:10 },
    { id:'5', name:'Jovan',    pet:require('@/assets/images/Pet-BearCub-RoseGold.png'), level:5, totalBadges:7, badgeIcons:['bolt','sun','fire'], hoursTotal:130, hoursWeek:9 },
    { id:'6', name:'Fiona',   pet:require('@/assets/images/Pet-Raccoon-Golden.png'), level:4, totalBadges:4, badgeIcons:['tasks','moon','sun'],hoursTotal:110, hoursWeek:8 },
    { id:'7', name:'Xiao Ming',  pet:require('@/assets/images/Pet-Sheep-Shade.png'), level:6, totalBadges:6, badgeIcons:['trophy','fire','bolt'],hoursTotal:160, hoursWeek:7 },
    { id:'8', name:'Lina',    pet:require('@/assets/images/Pet-PandaCub-Turquoise.png'), level:3, totalBadges:11, badgeIcons:['sun','tasks','moon'],hoursTotal:90,  hoursWeek:6 },
  ].sort((a,b)=>b.hoursWeek-a.hoursWeek));

  const badgeColors = {
    fire: '#f97316',
    tasks: '#3b82f6',
    sun: '#facc15',
    trophy: '#eab308',
    bolt: '#10b981',
    moon: '#8b5cf6',
  };

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.title}>🏆 Weekly Ranking</Text>
      <FlatList
        data={players}
        keyExtractor={item=>item.id}
        scrollEnabled={false} // did this to avoid warning
        contentContainerStyle={{paddingBottom:40}}
        renderItem={({item,index})=> (
          <View style={[styles.card,index<3 &&{borderColor:'#facc15',borderWidth:2}]}> 
            <View style={styles.rank}><Text style={styles.rankTxt}>{index+1}</Text></View>
            <Image source={item.pet} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.level}>Lvl {item.level}</Text>
              <View style={styles.badgeRow}>
                {item.badgeIcons.map((icon, i) => (
                  <View key={icon} style={[styles.badgeIcon,{backgroundColor:badgeColors[icon]||'#0ea5e9'}]}>
                    <FontAwesome5 name={icon} size={14} color="#fff" />
                  </View>
                ))}
                <Text style={styles.moreDots}>...</Text>
              </View>
              <Text style={styles.totalBadges}>{item.totalBadges} badges total</Text>
            </View>
            <View style={styles.hoursCol}>
              <View style={styles.hourRow}><MaterialIcons name="query-builder" size={16} color="#60a5fa" /><Text style={styles.hourVal}>{item.hoursWeek}h</Text></View>
              <Text style={styles.weekLbl}>this week</Text>
              <Text style={styles.totalLbl}>{item.hoursTotal}h total</Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper:{flex:1,backgroundColor:'#fffbe6',paddingTop:30},
  title:{fontSize:24,fontWeight:'800',color:'#1e3a8a',alignSelf:'center',marginBottom:20},
  card:{flexDirection:'row',alignItems:'center',marginHorizontal:20,marginVertical:8,padding:14,borderRadius:16,backgroundColor:'#fff',borderWidth:2,borderColor:'rgb(199, 199, 199)'},
  rank:{width:30},rankTxt:{fontSize:18,fontWeight:'800',color:'#065f46'},
  avatar:{width:60,height:60,resizeMode:'contain',marginHorizontal:6},
  infoCol:{flex:1,marginLeft:8},
  name:{fontSize:18,fontWeight:'700',color:'#1f2937'},
  level:{fontSize:14,fontWeight:'600',color:'#f87171'},
  badgeRow:{flexDirection:'row',alignItems:'center',marginTop:4},
  badgeIcon:{width:22,height:22,borderRadius:11,justifyContent:'center',alignItems:'center',marginRight:4},
  totalBadges:{fontSize:10,color:'#6b7280',marginTop:2},
  moreDots:{fontSize:12,color:'#6b7280'},
  hoursCol:{alignItems:'flex-end'},
  hourRow:{flexDirection:'row',alignItems:'center'},
  hourVal:{marginLeft:4,fontSize:20,fontWeight:'700',color:'#0ea5e9'},
  weekLbl:{fontSize:10,color:'#6b7280', marginTop: -2},
  totalLbl:{fontSize:10,color:'#6b7280',marginTop:10},
});
