import { logToAllGroupLogs } from '@/util/logActivity';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { auth, db } from '../../firebase';


export default function TasksScreen() {
  const nav = useNavigation();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(null);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadge, setNewBadge] = useState(null);


  useEffect(() => {
    const loadAndCleanTasks = async () => {
      const now = Date.now();
      if (lastFetched && now - lastFetched < 5 * 60 * 1000) return;

      const rawEmail = auth.currentUser?.email;
      if (!rawEmail) return;

      const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
      await initializeWallet();
      
      const tasksCollection = collection(db, 'users', userId, 'tasks');
      const snapshot = await getDocs(tasksCollection); 

      const oneDay = 24 * 60 * 60 * 1000;
      const validTasks = [];
      const tasksToDelete = [];

      snapshot.forEach(docSnap => {
        const task = { id: docSnap.id, ...docSnap.data() };
        const isOldCompleted =
          task.completed &&
          task.createdAt &&
          now - new Date(task.createdAt).getTime() > oneDay;

        if (isOldCompleted) {
          tasksToDelete.push(task.id);
        } else {
          validTasks.push(task);
        }
      });

      await Promise.all(
        tasksToDelete.map(id =>
          deleteDoc(doc(db, 'users', userId, 'tasks', id))
        )
      );

      setTasks(validTasks);
      setLastFetched(now);
    };

    loadAndCleanTasks();
  }, [lastFetched]);



  const trackTaskEvent = async eventType => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const todayStr = new Date().toDateString();
    const statsRef = doc(db, 'users', userId, 'dailyStats', 'data');

    try {
      const statsSnap = await getDoc(statsRef);
   
      if (!statsSnap.exists() || statsSnap.data().date !== todayStr) {
        await setDoc(statsRef, { 
          created: 0, 
          completed: 0, 
          hasOverdue: false,
          date: todayStr
        });
      }

      const updateObj = {};
      if (eventType === 'created') updateObj.created = increment(1);
      if (eventType === 'completed') updateObj.completed = increment(1);

      await updateDoc(statsRef, updateObj);
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  const initializeWallet = async () => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    const walletRef = doc(db, 'users', userId, 'wallet', 'data');
    
    try {
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        await setDoc(walletRef, { coins: 100, claimedQuests: {} });
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPriority('Medium');
    setDueDate(null);
    setHasDueDate(false);
    setEditId(null);
  };

  const saveTask = async () => {
    if (!title.trim()) return;

    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    const task = {
      title: title.trim(),
      priority,
      dueDate: hasDueDate && dueDate instanceof Date ? dueDate : null,
      completed: false,
      createdAt: new Date()
    };

    try {
      if (editId) {
        const ref = doc(db, 'users', userId, 'tasks', editId);
        await updateDoc(ref, task);
        setTasks(t => t.map(x => (x.id === editId ? { ...x, ...task } : x)));
      } else {
        const ref = await addDoc(collection(db, 'users', userId, 'tasks'), task);
        setTasks(t => [{ id: ref.id, ...task }, ...t]);
        trackTaskEvent('created');
        await logToAllGroupLogs(userId, 'created task', title.trim());
        
        // Check for badges after creating a task
        const badge = await checkForBadges();
        if (badge) {
          setNewBadge(badge);
          setShowBadgeModal(true);
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }

    resetForm();
    setModalVisible(false);
  };

  const startEdit = task => {
    setTitle(task.title);
    setPriority(task.priority);
    setDueDate(
      task.dueDate
        ? (typeof task.dueDate.toDate === 'function'
            ? task.dueDate.toDate()
            : new Date(task.dueDate))
        : null
    );
    setHasDueDate(!!task.dueDate);
    setEditId(task.id);
    setModalVisible(true);
  };

  const deleteTask = async id => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    try {
      const ref = doc(db, 'users', userId, 'tasks', id);
      await deleteDoc(ref);
      setTasks(t => t.filter(x => x.id !== id));
      if (id === editId) resetForm();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const completeTask = async (id) => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    const taskRef = doc(db, 'users', userId, 'tasks', id);
    const profileRef = doc(db, 'users', userId, 'profile', 'data');

    try {
      // First check if task exists and isn't already completed
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists() || taskSnap.data().completed) return;

      // Optimistically update UI
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: true } : t)));

      // Perform all updates in a single batch
      const batch = writeBatch(db);
      
      // Mark task as completed
      batch.update(taskRef, { completed: true });
      
      // Increment tasksCompleted in profile
      batch.update(profileRef, { tasksCompleted: increment(1) });

      await batch.commit();
      trackTaskEvent('completed');

      await logToAllGroupLogs(userId, 'completed task', taskSnap.data().title);
      
      // Check for badges after completing a task
      const badge = await checkForBadges();
      if (badge) {
        setNewBadge(badge);
        setShowBadgeModal(true);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      // Rollback UI if error occurs
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: false } : t)));
    }
  };

  const groupTasks = () => {
    const priorities = ['High', 'Medium', 'Low'];
    return priorities.map(priority => {
      const tasksByPriority = tasks.filter(t => t.priority === priority && !t.completed);
      const withDueDate = tasksByPriority.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      const withoutDueDate = tasksByPriority.filter(t => !t.dueDate);
      return { priority, tasks: [...withDueDate, ...withoutDueDate] };
    });
  };

  const PrioritySelector = () => (
    <View style={styles.priorityRow}>
      {['High', 'Medium', 'Low'].map(p => (
        <Pressable key={p} onPress={() => setPriority(p)} style={[styles.priorityBtn, priority === p && styles.priorityBtnSelected]}>
          <Text style={[styles.priorityTxt, priority === p && styles.priorityTxtSelected]}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );

const renderRightActions = (progress, dragX, task) => {
  const scale = dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const isCompleted = task.completed;
  const actionText = isCompleted ? '↺ Undo' : '✓ Complete';
  const actionColor = isCompleted ? '#f0a500' : 'green';
  const onPress = isCompleted ? () => uncompleteTask(task.id) : () => completeTask(task.id);

  return (
    <Pressable onPress={onPress} style={[styles.completeAction, { backgroundColor: actionColor }]}>
      <Animated.Text style={[styles.completeText, { transform: [{ scale }] }]}>
        {actionText}
      </Animated.Text>
    </Pressable>
  );
};

  const uncompleteTask = async (id) => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');

    const taskRef = doc(db, 'users', userId, 'tasks', id);
    const profileRef = doc(db, 'users', userId, 'profile', 'data');

    try {
      // Optimistically update UI
      setTasks(t => t.map(task => task.id === id ? { ...task, completed: false } : task));

      // Perform all updates in a single batch
      const batch = writeBatch(db);
      
      // Mark task as not completed
      batch.update(taskRef, { completed: false });
      
      // Decrement tasksCompleted in profile
      batch.update(profileRef, { tasksCompleted: increment(-1) });

      await batch.commit();
      
    } catch (error) {
      console.error('Error marking task as incomplete:', error);
      // Rollback UI if error occurs
      setTasks(t => t.map(task => task.id === id ? { ...task, completed: true } : task));
    }
  };

  const checkForBadges = async () => {
    const rawEmail = auth.currentUser?.email;
    if (!rawEmail) return;
    const userId = rawEmail.replace(/[.#$/[\]]/g, '_');
    
    try {
      // Get current tasks count from profile
      const profileRef = doc(db, 'users', userId, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);
      const tasksCompleted = profileSnap.exists() ? profileSnap.data().tasksCompleted || 0 : 0;

      // Get current badges
      const badgesRef = doc(db, 'users', userId, 'badges', 'data');
      const badgesSnap = await getDoc(badgesRef);
      const currentBadges = badgesSnap.exists() ? badgesSnap.data().earned || [] : [];
      const newBadges = [...currentBadges];
      let badgeAwarded = null;

      // Check for First Task badge
      if (tasksCompleted === 1 && !currentBadges.includes('firstTask')) {
        newBadges.push('firstTask');
        badgeAwarded = {
          id: 'firstTask',
          name: 'First Task',
          icon: 'star',
          color: '#ffbf00'
        };
      }
      // Check for Task Master badge (5 tasks)
      else if (tasksCompleted === 5 && !currentBadges.includes('taskMaster')) {
        newBadges.push('taskMaster');
        badgeAwarded = {
          id: 'taskMaster',
          name: 'Task Master',
          icon: 'tasks',
          color: '#3b82f6'
        };
      }
      // Check for Productivity Pro badge (10 tasks)
      else if (tasksCompleted === 10 && !currentBadges.includes('productivityPro')) {
        newBadges.push('productivityPro');
        badgeAwarded = {
          id: 'productivityPro',
          name: 'Productivity Pro',
          icon: 'bolt',
          color: '#10b981'
        };
      }

      if (badgeAwarded) {
        await setDoc(badgesRef, { earned: newBadges }, { merge: true });
        return badgeAwarded;
      }
    } catch (error) {
      console.error('Error updating badges:', error);
    }
    return null;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0 }}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Pressable onPress={() => nav.navigate('daily-quests')} style={styles.dailyBtn}>
          <FontAwesome6 name="list-check" size={24} color="#3479DB" />
        </Pressable>
      </View>

        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Task</Text>
        </Pressable>

        <ScrollView style={styles.list}>
          <Text style={styles.swipeToCompleteText}>Swipe left to complete a task</Text>
          {groupTasks().map(group => (
            <View key={group.priority}>
              <Text style={styles.groupHeader}>{group.priority} Priority</Text>
              {group.tasks.length === 0 ? (
                <Text style={styles.empty}>No tasks</Text>
              ) : (
                group.tasks.map(item => (
                  <Swipeable key={item.id} renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
                    <View style={styles.card}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>
                          {item.dueDate
                            ? `Due: ${(item.dueDate.toDate?.() || new Date(item.dueDate)).toLocaleString('en-US', {
                                year: 'numeric',
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : 'No due date'}
                        </Text>
                      </View>
                      <View style={styles.cardActions}>
                        <Pressable onPress={() => startEdit(item)}><Text style={styles.action}>Edit</Text></Pressable>
                        <Pressable onPress={() => deleteTask(item.id)}><Text style={[styles.action, styles.delete]}>Delete</Text></Pressable>
                      </View>
                    </View>
                  </Swipeable>
                ))
              )}
            </View>
          ))}

          <View style={{ paddingBottom: 120 }}>          
          <Text style={[styles.groupHeader, {color: 'green'}]}>✓ Completed Tasks</Text>
            {tasks.filter(t => t.completed).length === 0 ? (
              <Text style={[styles.empty, {marginVertical: 10}]}>No completed tasks</Text>
            ) : (
              <>
              <Text style={[styles.swipeToCompleteText, {marginVertical: 10}]}>Swipe left to undo a completed task</Text>
              {tasks
              .filter(t => t.completed)
              .sort((a, b) => b.createdAt - a.createdAt)
              .map(item => (
                <Swipeable key={item.id} renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
                  <View style={[styles.card, styles.cardCompleted]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, styles.completedText]}>{item.title}</Text>
                      <Text style={styles.cardSubtitle}>
                        {item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleString()}` : 'No due date'}
                        {/* {console.log('Due date:', item.dueDate)} */}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => deleteTask(item.id)}>
                        <Text style={[styles.action, styles.delete]}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </Swipeable>
              ))}
              </>
            )}
          </View>
        </ScrollView>

        <Pressable onPress={() => nav.navigate('calendar', { refresh: Date.now() })} style={styles.calendarBtn}>
          <FontAwesome6 name="calendar-days" size={30} color="#fff" />
        </Pressable>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>{editId ? 'Edit Task' : 'New Task'}</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.input} />
              <PrioritySelector />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Has Due Date</Text>
                <Switch value={hasDueDate} onValueChange={setHasDueDate} />
              </View>
              {hasDueDate && (
                <>
                  <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                    <Text style={styles.datePickerText}>{dueDate ? (dueDate.toDate?.() || dueDate).toLocaleString('en-US', { year: 'numeric', weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pick due date & time'}</Text>
                  </Pressable>
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="datetime"
                    date={dueDate || new Date()}
                    onConfirm={date => {
                      setShowDatePicker(false);
                      setDueDate(date);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                  />
                </>
              )}
              <View style={styles.modalBtns}>
                <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => { resetForm(); setModalVisible(false); }}><Text style={styles.btnTxt}>Cancel</Text></Pressable>
                <Pressable style={[styles.btn, styles.saveBtn]} onPress={saveTask}><Text style={[styles.btnTxt, { color: '#fff' }]}>{editId ? 'Update' : 'Save'}</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showBadgeModal} transparent animationType="fade">
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>🎉 New Badge Unlocked!</Text>
      
      {newBadge && (
        <View style={[styles.badgeCard, { backgroundColor: newBadge.color + '55', marginBottom: 16 }]}>
          <View style={[styles.badgeIconWrap, { backgroundColor: newBadge.color }]}>
            <FontAwesome5 name={newBadge.icon} size={24} color="#fff" />
          </View>
          <Text style={styles.badgeLabel}>{newBadge.name}</Text>
        </View>
      )}
      
      <Text style={{ textAlign: 'center', marginBottom: 16 }}>
        You've earned a new badge for your achievements!
      </Text>
      
      <Pressable 
        onPress={() => setShowBadgeModal(false)}
        style={{ backgroundColor: '#4b7bec', padding: 10, borderRadius: 6, width: '100%' }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Awesome!</Text>
      </Pressable>
    </View>
  </View>
</Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingTop: 40},
  headerTitle: { fontSize: 28, fontWeight: '700', paddingLeft: 16, paddingTop: 10},
  addBtn: { backgroundColor: '#3479DB', margin: 16, padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  swipeToCompleteText: { textAlign: 'center', color: '#999', marginVertical: 5 },
  list: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#999', marginBottom: 10 },
  groupHeader: { fontSize: 18, fontWeight: '700', marginVertical: 10 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  cardActions: { justifyContent: 'center' },
  action: { marginLeft: 12, color: '#3479DB', fontWeight: '600' },
  delete: { color: '#C00' },
  dailyBtn: { padding: 18, borderRadius: 6 },
  priorityRow: { flexDirection: 'row', marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, alignItems: 'center' },
  priorityBtnSelected: { backgroundColor: '#3479DB', borderColor: '#3479DB' },
  priorityTxt: { color: '#333' },
  priorityTxtSelected: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 },
  cancelBtn: { backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#3479DB' },
  btnTxt: { fontWeight: '600' },
  datePickerBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 16 },
  datePickerText: { color: '#333' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { fontSize: 16 },
  completeAction: { backgroundColor: 'green', justifyContent: 'center', alignItems: 'center', width: 100, borderRadius: 10, marginBottom: 12 },
  completeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  calendarBtn:{position:'absolute',bottom:30,right:20,backgroundColor:'#ff7a00',padding:20,borderRadius:25,elevation:4,shadowColor:'#000',shadowOpacity:.3,shadowOffset:{width:0,height:2},shadowRadius:4},
  badgeCard: {
  width: 120,
  alignItems: 'center',
  paddingVertical: 12,
  borderRadius: 16,
},
badgeIconWrap: {
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 6,
},
badgeLabel: {
  color: '#1f2937',
  fontWeight: '600',
  textAlign: 'center',
  fontSize: 12,
},
});