import { useState } from 'react';
import {
    Button,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import TopBar from '../../components/ui/TopBar.js';

export default function tasks() {  
  const [tasks, setTasks]       = useState([]);
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState('Medium');
  const [editId, setEditId]     = useState(null);

  const saveTask = () => {
    if (!title.trim()) return;
    if (editId) {
      // update existing
      setTasks(t =>
        t.map(x =>
          x.id === editId
            ? { ...x, title: title.trim(), priority }
            : x
        )
      );
    } else {
      // add new
      setTasks(t => [
        ...t,
        { id: Date.now().toString(), title: title.trim(), priority },
      ]);
    }
    // reset form
    setTitle('');
    setPriority('Medium');
    setEditId(null);
  };

  const startEdit = task => {
    setTitle(task.title);
    setPriority(task.priority);
    setEditId(task.id);
  };

  const deleteTask = id => {
    setTasks(t => t.filter(x => x.id !== id));
    if (id === editId) {
      setTitle('');
      setPriority('Medium');
      setEditId(null);
    }
  };

  // sort by priority: High → Medium → Low
  const sorted = [...tasks].sort((a, b) => {
    const order = { High: 1, Medium: 2, Low: 3 };
    return order[a.priority] - order[b.priority];
  });

    return (
    <View style={styles.container}>
        <TopBar/>
      <Text style={styles.header}>
        {editId ? 'Edit Task' : 'New Task'}
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={styles.input}
      />

      <View style={styles.priorityRow}>
        {['High', 'Medium', 'Low'].map(p => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={[
              styles.priorityBtn,
              priority === p && styles.priorityBtnSelected,
            ]}
          >
            <Text
              style={[
                styles.priorityTxt,
                priority === p && styles.priorityTxtSelected,
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title={editId ? 'Update Task' : 'Add Task'}
        onPress={saveTask}
      />

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowText}>
              {item.title} ({item.priority})
            </Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => startEdit(item)}>
                <Text style={styles.action}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => deleteTask(item.id)}>
                <Text style={[styles.action, styles.delete]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header:    { fontSize: 18, fontWeight: '600', marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },

  priorityRow: { flexDirection: 'row', marginBottom: 12 },
  priorityBtn: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
  },
  priorityBtnSelected: {
    backgroundColor: '#3479DB',
    borderColor: '#3479DB',
  },
  priorityTxt: { color: '#333' },
  priorityTxtSelected: { color: '#fff', fontWeight: '600' },

  list: { marginTop: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 20 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowText: { flex: 1 },

  rowActions: { flexDirection: 'row' },
  action:     { marginHorizontal: 8, color: '#3479DB' },
  delete:     { color: '#C00' },
});