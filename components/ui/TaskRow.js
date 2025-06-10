import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TaskRow({ task, onCheck, onEdit, onDelete}) {
    return (
        <View style = {styles.row}>
            <View style = {styles.info}>
                <Text style = {styles.title}>{task.title}</Text>
                <Text style = {[styles.priority, styles[task.priority.toLowerCase()]]}>{task.priority}</Text>
                <Text style = {styles.date}>{task.dueDate.toLocaleDateString()}</Text>
            </View>

            <View style = {styles.actions}>
                <Pressable onPress = {() => onCheck(task.id)}>
                    <FontAwesome5
                        name = {task.completed ? 'undo' : 'check-circle'}
                        size = {20}
                        color = {task.completed ? '#999' : '#3479DB'}
                        style = {styles.icon}/>
                </Pressable>
                <Pressable onPress = {() => onEdit(task)}>
                    <FontAwesome5 name = "edit" size = {20} color = '#666' style = {styles.icon}/>
                </Pressable>
                <Pressable onPress = {() => onDelete(task.id)}>
                    <FontAwesome5 name = "trash" size = {20} color = '#C00' style = {styles.icon}/>
                </Pressable>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        padding: 12,
        marginVertical: 6,
        backgroundColor: '#FFF',
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 1},
    },
    info: {flex: 1},
    title: {fontSize:16, fontWeight: '600'},
    priority: {
        marginTop: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        color: '#FFF',
        fontSize: 12,
        overflow: 'hidden',
    },
    high: {backgroundColor: '#D33'},
    medium: {backgroundColor: '#DBA534'},
    low: {backgroundColor: '#3A7'},
    date: {marginTop: 4, fontSize: 12, color: '#666'},
    actions: {flexDirection: 'row', alignItems: 'center'},
    icon: {marginLeft: 12},
    });