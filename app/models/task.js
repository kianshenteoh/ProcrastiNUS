import uuid from 'react-native-uuid';

 /**
  * @typedef {'High' | 'Medium' | 'Low'} Priority
  */

 /**
  * @typedef {Object} Task      
  * @property {string} id
  * @property {string} title
  * @property {Priority} priority 
  * @property {Date} dueDate
  * @property {boolean} completed
  */

 export function createTask(title, priority, dueDate) {
    return {
        id: uuid.v4(),
        title,
        priority,
        dueDate,
        completed: false,
    };
 }
