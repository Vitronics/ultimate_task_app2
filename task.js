
//DOM 
const taskInput = document.getElementById('taskInput');
const priorityTask = document.getElementById('prioritySelect');
const dueDate = document.getElementById('dueDate');
const categoryInput = document.getElementById('categoryInput');
const buttonTask = document.getElementById('buttonTask');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const darkModeToggle = document.getElementById('darkModeToggle');

//audio
const completedAudio = document.getElementById('completedAaudio');
const addAudio = document.getElementById('addAudio');
const deleteAudio = document.getElementById('deleteAudio');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

//start our app

function init(){
    renderTasks();
    updateStats();

    //set default date
    const today = new Date().toISOString().split ('T')[0]
dueDate.value = today;

};

 // Add a new task

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    const newTask = {
        id: Date.now(),
        text,
        completed: false,
        priority: priorityTask.value,  // Changed from prioritySelect.value
        dueDate: dueDate.value,        // Changed from dueDate.value
        category: categoryInput.value.trim() || 'General',  // Changed from categoryInput.value
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    addAudio.play();  // Fixed from onplay()
    
    // Reset fields
    taskInput.value = '';
    categoryInput.value = '';  // Changed from categoryInput.value
    taskInput.focus();
}

//filter operations
function renderTasks(){
    if(tasks.length === 0){
        taskList.innerHTML = `<div class ="empty" >No tasks added yet! Add above to view them here</div>`;
         return;
    };


//Render filtered Tasks

let filteredTasks = [...tasks];
const today = new Date().toISOString().split('T')[0];

switch (currentFilter){
    case 'active':
    filteredTasks = tasks.filter(task => !task.completed);
    break;

    case 'completed':
        filteredTasks = tasks.filter(task => task.completed);
        break;
        
        case 'today':
            filteredTasks = tasks.filter(task => task.dueDate === today && !task.completed);
            break;
            
            case 'overdue':
                filteredTasks = tasks.filter(task => task.dueDate < today && !task.completed);
                break;

                case 'high':
                    filteredTasks = tasks.filter(task => task.priority === 'high');
                    // filteredTasks = tasks.filter(task => task.priority && !task.completed);

};

if(filteredTasks.length === 0){
    taskList.innerHTML = `<div class = "empty">No ${currentFilter} tasks added yet! Add above to view them here </div>`
    return;
}

//sort task in order:Overdue; priority; due date

filteredTasks.sort((a,b) => {
    if(a.dueDate < today && !a.completed && !(b.dueDate < today && !b.completed)) return -1;
    if(!(a.dueDate < today && !a.completed) && !b.dueDate < today && !b.completed) return 1; 

    //priority
    const priorityOrder = {high:3 ,medium:2, low:1};
    if(priorityOrder[a.priority] > priorityOrder[b.priority]) return -1;
    if(priorityOrder[a.priority] < priorityOrder[b.priority]) return 1;

    //Due date
    if(a.dueDate < b.dueDate) return -1;
    if(a.dueDate > b.dueDate) return 1;

    //created At:newer first

    return new Date(b.createdAt) - new Date (a.createdAt);
});


// Render tasks
taskList.innerHTML = filteredTasks.map(task => `
    
    <li class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-priority priority-${task.priority}">${task.priority}</span>
        ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
        <span class="task-text">${task.text}</span>
        ${task.dueDate ? `
            <span class="task-due-date ${
                task.dueDate < today && !task.completed ? 'overdue' : 
                task.dueDate === today && !task.completed ? 'today' : ''
            }">
                📅 ${formatDate(task.dueDate)}
            </span>
        ` : ''}
        <div class="task-actions">
            <button class="task-btn edit-btn" title="Edit">✏️</button>
            <button class="task-btn delete-btn" title="Delete">🗑️</button>
        </div>
    </li>
    
`).join('');

// Add event listeners to the new elements
document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', toggleTaskComplete);
});

document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
});

document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', editTask);
});
}

// Toggle task completion status
function toggleTaskComplete(e) {
const taskId = parseInt(e.target.closest('.task-item').dataset.id);
const task = tasks.find(task => task.id === taskId);
task.completed = e.target.checked;
saveTasks();
renderTasks();
updateStats();

if (task.completed) {
    completedAudio.play();
    if (allTasksCompleted()) {
        triggerConfetti();
    }
}
}

// Delete a task
function deleteTask(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return; // Safety check
    
    const taskId = parseInt(taskItem.dataset.id);
    
    // Find the task to get its text for the prompt
    const taskToDelete = tasks.find(task => task.id === taskId);
    if (!taskToDelete) return; // Task not found
    
    const confirmation = prompt(`Delete this Task? Please note this action is irreversible.\nTask: "${taskToDelete.text}"`, "Type 'DELETE' to confirm");
    
    if (confirmation === 'DELETE') {
        // Filter out the task to delete
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
        deleteAudio.play();
    }
}
// saveTasks();
// renderTasks();
// updateStats();
// deleteAudio.play();
// }

// Edit a task
function editTask(e) {
const taskId = parseInt(e.target.closest('.task-item').dataset.id);
const task = tasks.find(task => task.id === taskId);

// In a real app, you might show a modal or edit form
const newText = prompt('Edit your task:', task.text);
if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    saveTasks();
    renderTasks();
}
}

// Update statistics
function updateStats() {
const today = new Date().toISOString().split('T')[0];
const total = tasks.length;
const completed = tasks.filter(task => task.completed).length;
const dueToday = tasks.filter(task => task.dueDate === today && !task.completed).length;
const overdue = tasks.filter(task => task.dueDate < today && !task.completed).length;

document.getElementById('totalTasks').textContent = total;
document.getElementById('completedTasks').textContent = completed;
document.getElementById('dueToday').textContent = dueToday;
document.getElementById('overdue').textContent = overdue;

// Update progress bar
const progress = total > 0 ? (completed / total) * 100 : 0;
document.getElementById('progressBar').style.width = `${progress}%`;
}

// Check if all tasks are completed
function allTasksCompleted() {
return tasks.length > 0 && tasks.every(task => task.completed);
}

// Save tasks to localStorage
function saveTasks() {
localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Format date for display
function formatDate(dateString) {
const options = { weekday: 'short', month: 'short', day: 'numeric' };
return new Date(dateString).toLocaleDateString(undefined, options);
}

// Confetti celebration
function triggerConfetti() {
for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.innerHTML = ['🎉', '🎊', '✓', '⭐', '🏆'][Math.floor(Math.random() * 5)];
    confetti.style.position = 'fixed';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.fontSize = `${Math.random() * 20 + 10}px`;
    confetti.style.animation = `confetti ${Math.random() * 3 + 2}s linear forwards`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
}
}

// Event Listeners
buttonTask.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') addTask();
});

filterButtons.forEach(button => {
button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderTasks();
});
});

darkModeToggle.addEventListener('click', () => {
document.body.classList.toggle('dark-mode');
darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '' : '';
localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
document.body.classList.add('dark-mode');
darkModeToggle.textContent = '';
}

// Initialize the app
init();
