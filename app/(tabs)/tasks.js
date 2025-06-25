import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate?.() || null,
        }));
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };
      loadTasks();
  }, []);

  const resetForm = () => {
    setTitle('');
    setPriority('Medium');
    setDueDate(null);
    setHasDueDate(false);
    setEditId(null);
  };

  const saveTask = async () => {
    if (!title.trim()) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const task = {
      title: title.trim(),
      priority,
      dueDate: hasDueDate ? dueDate : null,
      completed: false,
      createdAt: new Date()
    };

    try {
      if (editId) {
        const ref = doc(db, 'users', uid, 'tasks', editId);
        await updateDoc(ref, task);
        setTasks(t => t.map(x => (x.id === editId ? { ...x, ...task } : x)));
      } else {
        const ref = await addDoc(collection(db, 'users', uid, 'tasks'), task);
        setTasks(t => [{ id: ref.id, ...task }, ...t]);
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
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setHasDueDate(!!task.dueDate);
    setEditId(task.id);
    setModalVisible(true);
  };

  const deleteTask = async id => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, 'users', uid, 'tasks', id);
      await deleteDoc(ref);
      setTasks(t => t.filter(x => x.id !== id));
      if (id === editId) resetForm();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const completeTask = async id => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, 'users', uid, 'tasks', id);
      await updateDoc(ref, { completed: true });
      setTasks(t => t.map(task => task.id === id ? { ...task, completed: true } : task));
    } catch (error) {
      console.error('Error marking task as complete:', error);
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

  const uncompleteTask = async id => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const ref = doc(db, 'users', uid, 'tasks', id);
      await updateDoc(ref, { completed: false });
      setTasks(t => t.map(task => task.id === id ? { ...task, completed: false } : task));
    } catch (error) {
      console.error('Error marking task as incomplete:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>

        <Text style={[styles.headerTitle]}>My Tasks</Text>

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
                          {item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleString()}` : 'No due date'}
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

        <Pressable onPress={() => nav.navigate('calendar')} style={styles.calendarBtn}>
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
                    <Text style={styles.datePickerText}>{dueDate ? new Date(dueDate).toLocaleString() : 'Pick due date & time'}</Text>
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
  calendarBtn:{position:'absolute',bottom:30,right:20,backgroundColor:'#ff7a00',padding:20,borderRadius:25,elevation:4,shadowColor:'#000',shadowOpacity:.3,shadowOffset:{width:0,height:2},shadowRadius:4}
});
