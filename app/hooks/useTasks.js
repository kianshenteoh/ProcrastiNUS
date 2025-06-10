import { getAuth } from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';


export function useTasks() {
    const {currentUser} = getAuth();
    const uid = currentUser.uid;
    const tasksRef = collection(db, 'users', uid, 'tasks')


    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        const q = query(tasksRef, orderBy('dueDate', 'asc'));
        const unsubscribe = onSnapShot(q, (snapshot) => {
            setTasks(
                snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    dueDate: docSnap.data().dueDate.toDate(),
                }))
            );
        });
        return unsubscribe;
    }, []);


    const addTask = async ({title, priority, dueDate}) => {
        await addDoc(tasksRef, {
            title,
            priority,
            dueDate,
            completed: false,
        });
    };


    const updateTask = async (id, updates) => {
        const docRef = doc(tasksRef, id);
        await updateDoc(docRef, updates);
    }


    const deleteTask = async (id) => {
        const docRef = doc(tasksRef, id);
        await deleteDoc(docRef);
    }


    const toggleComplete = async (id, completed) => {
        await updateTask(id, { completed });
    };


    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
    };
}
