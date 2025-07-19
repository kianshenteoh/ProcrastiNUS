import petImages from '@/assets/pet-images';
import { computePetStats } from '@/components/my-pet/my-pet-backend';
import { auth, db } from '@/firebase';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { startOfWeek } from 'date-fns';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LeaderboardScreen() {
  const badgeColors = {
    fire: '#f97316',
    tasks: '#3b82f6',
    sun: '#facc15',
    trophy: '#eab308',
    bolt: '#10b981',
    moon: '#8b5cf6',
  };

const getWeeklyStudySessions = async (friendId) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const ref = collection(db, 'users', friendId, 'StudySessions');
  
  const q = query(ref, where('timestamp', '>=', Timestamp.fromDate(weekStart)));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))
}

const getAllStudySessions = async (friendId) => {
  const ref = collection(db, 'users', friendId, 'StudySessions');

  const snapshot = await getDocs(ref);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))
}

const getWeeklyHours = async (friendId) => {
  const sessions = await getWeeklyStudySessions(friendId);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationInMinutes || 0), 0);
  return (Math.floor(totalMinutes / 30)) * 0.5
}

const getTotalHours = async (friendId) => {
  const sessions = await getAllStudySessions(friendId);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationInMinutes || 0), 0);
  return (Math.floor(totalMinutes / 30)) * 0.5
}

  const [friendsPetsAndHours, setFriendsPetsAndHours] = useState([]);

  const fetchAndSortFriendsPetsAndHours = async () => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return [];

    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const friendsDocRef = doc(db, 'users', userId, 'friends', 'list');
    const friendsSnap = await getDoc(friendsDocRef);
    if (!friendsSnap.exists()) return [];

    const friendIds = Object.keys(friendsSnap.data());

    const friendsData = await Promise.all(friendIds.map(async (fid) => {
      try {
        const petRef = doc(db, 'users', fid, 'pet', 'data');
        const petSnap = await getDoc(petRef);
        if (!petSnap.exists()) return null;

        const rawPet = petSnap.data();
        const { updatedPet } = computePetStats(rawPet, 30, 20, 2);

        // hours
        const hoursWeek = await getWeeklyHours(fid);
        const hoursTotal = await getTotalHours(fid);

        // level
        const level = Math.floor(updatedPet.totalXp / 1000);

        // pet image
        const image = updatedPet.image;
        const pet = petImages[image] || petImages.default;

        // fallback name if not present
        const name = updatedPet.name || 'Unknown';

        // mock badge icons and count
        const badgeIcons = ['fire', 'tasks', 'sun'];
        const totalBadges = badgeIcons.length;

        return {
          id: fid,
          name,
          pet,
          level,
          totalBadges,
          badgeIcons,
          hoursTotal,
          hoursWeek
        };
      } catch (err) {
        console.error(`Failed to load friend (${fid})`, err);
        return null;
      }
    }));

    // sorting and filtering
    const filtered = friendsData.filter(Boolean).sort((a, b) => b.hoursWeek - a.hoursWeek);
    
    return filtered;
  };

  useEffect(() =>{
    const loadFriends = async () => {
      const data = await fetchAndSortFriendsPetsAndHours();
      setFriendsPetsAndHours(data);
    }
    loadFriends();
  }, []);

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.title}>🏆 Weekly Ranking</Text>
      <FlatList
        data={friendsPetsAndHours}
        keyExtractor={item=>item.id}
        scrollEnabled={false} // did this to avoid warning
        contentContainerStyle={{paddingBottom:40}}
        renderItem={({item,index})=> (
          <View style={[styles.card,index<3 &&{borderColor:'#facc15',borderWidth:2}]}> 
            <View style={styles.rank}><Text style={styles.rankTxt}>{index+1}</Text></View>
            <Image source={item.pet} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.ownerId}>Owner ID: {item.id}</Text>
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
  ownerId: { fontSize: 10, color: '#6b7280', marginTop: 2, marginBottom: 4 },
});
