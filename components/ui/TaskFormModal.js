import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable, StyleSheet,
    Text, TextInput,
    View
} from 'react-native';

const PRIORITIES = ['High', 'Medium', 'Low'];

export default function TaskFormModal({visible, initial = {}, onSave, onCancel}) {
    const [title, setTitle] = useState(initial.title || '');
    const [priority, setPriority] = useState(initial.priority || 'Medium')
    const [dueDate, setDueDate] = useState(initial.dueDate || new Date());
    const [showPicker, setShowPicker] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        setTitle(initial.title || '');
        setPriority(initial.priority || 'Medium');
        setDueDate(initial.dueDate || new Date());
    }, [initial,visible]);

    function handleSave() {
        if (!title.trim()) return;
        onSave({title: title.trim(), priority, dueDate});
    }

    return(
        <Modal transparent visible = {visible} animationType = "slide">
            <View style = {styles.backdrop}>
                <View style = {styles.container}>
                    <Text style = {styles.header}>
                        {initial.id ? 'Edit Task' : 'New Task'}
                    </Text>

                    <TextInput
                        style = {styles.input}
                        placeholder = "Title"
                        value = {title}
                        onChangeText = {setTitle}
                    />

                    <View style = {styles.priorityRow}>
                        {PRIORITIES.map(p => {
                            <Pressable
                                key = {p}
                                onPress = {() => setPriority(p)}
                                style = {[
                                    styles.priorityButton,
                                    p == priority && styles.priorityButtonActive,
                                ]}>
                                    <Text style = {[
                                        styles.priorityText,
                                        p === priority && styles.priorityTextActive,
                                    ]}>
                                        {p}
                                    </Text>
                            </Pressable>
                        })}
                    </View>

                    <Pressable onPress ={() => setShowPicker(true)} style = {styles.dateButton}>
                        <Text style = {styles.dateText}>
                            Due: {dueDate.toLocaleDateString()}
                        </Text>
                    </Pressable>

                    {showPicker && (
                        <DateTimePicker
                            value = {dueDate}
                            mode = "date"
                            display = {Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange = {(_, d) => {
                                setShowPicker(false);
                                if (d) setDueDate(d);
                            }}/>
                    )}

                    <View style = {styles.actions}>
                        <Pressable onPress = {onCancel} style = {styles.cancelButton}>
                            <Text style = {styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress = {handleSave} style = {styles.saveButton}>
                            <Text style = {styles.saveText}>Save</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#00000099',
        justifyContent: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
    },
    header: {fontSize: 18, fontWeight: '600', marginBottom: 12},
    input: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 6,
        padding: 10,
        marginBottom: 12,
    },
    priorityRow: {flexDirection: 'row', marginBottom: 12},
    priorityButton: {
        flex: 1,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 4,
        backgroundColor: '#EEE',
        alignItems: 'center',
    },
    priorityButtonActive: {backgroundColor: '#3479DB'},
    priorityText: {color: '#333'},
    priorityTextActive: {color: '#FFF', fontWeight: '600'},
    dateButton: {paddingVertical: 8, marginBottom: 16},
    dateText: {fontSize: 16, color: '#3479DB'},
    actions: {flexDirection: 'row', justifyContent: 'flex-end'},
    cancelButton: {marginRight: 12},
    cancelText: {color: '#555'},
    saveButton: {backgroundColor: '#3479DB', borderRadius: 4, padding: 10},
    saveText: {color: '#FFF', fontWeight: '600'},
});