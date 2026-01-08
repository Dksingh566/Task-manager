// DOM Elements
const taskList = document.getElementById("taskList");
const dailyBox = document.getElementById("dailyBox");
const weeklyBox = document.getElementById("weeklyBox");
const dateInput = document.getElementById("taskDate");
const activeTaskCount = document.getElementById("activeTaskCount");

const taskType = document.getElementById("taskType");
const taskName = document.getElementById("taskName");

const sh = document.getElementById("sh");
const sm = document.getElementById("sm");
const sap = document.getElementById("sap");

const eh = document.getElementById("eh");
const em = document.getElementById("em");
const eap = document.getElementById("eap");

// Set today's date and disable past dates
const today = new Date();
dateInput.valueAsDate = today;
dateInput.min = today.toISOString().split('T')[0];

let data = JSON.parse(localStorage.getItem("dailyTask")) || {};

// Enhanced ADD TASK with animation
document.getElementById("addTask").onclick = () => {
    const date = dateInput.value;
    if(!data[date]) data[date] = { tasks: [], completed: [] };

    const type = taskType.value.trim();
    const name = taskName.value.trim();
    const total = calcMinutes();

    if(!type || !name || total <= 0){
        shakeElement(document.querySelector('#addTask'));
        showToast("⚠️ Please enter valid task details!");
        return;
    }

    data[date].tasks.push({ type, name, total, id: Date.now() });
    clearInputs();
    save();
    render();
    
    // Success animation
    const addBtn = document.getElementById("addTask");
    addBtn.classList.add('task-complete');
    setTimeout(() => addBtn.classList.remove('task-complete'), 500);
    
    showActionToast('add', name);
};

// Enhanced RENDER with animations
function render(){
    taskList.innerHTML = "";
    dailyBox.innerHTML = "";
    weeklyBox.innerHTML = "";

    const day = data[dateInput.value];
    const activeCount = day ? day.tasks.length : 0;
    activeTaskCount.textContent = activeCount;
    
    if(!day || day.tasks.length === 0) {
        taskList.innerHTML = '<tr><td colspan="5" class="empty-state">No active tasks yet. Add one above! 🚀</td></tr>';
    } else {
        day.tasks.forEach((t, i)=>{
            const tr = document.createElement("tr");
            tr.className = "interactive-btn cursor-pointer";
            tr.innerHTML = `
                <td class="px-3 py-3 text-sm">${escapeHtml(t.type)}</td>
                <td class="px-3 py-3 text-sm font-medium">${escapeHtml(t.name)}</td>
                <td class="px-3 py-3 text-sm">${formatTime(t.total)}</td>
                <td class="px-3 py-3 text-center">
                    <button onclick="finishTask(${i})" class="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 transition-all duration-300 hover:scale-110 flex items-center justify-center mx-auto">✔</button>
                </td>
                <td class="px-3 py-3 text-center">
                    <button onclick="removeTask(${i})" class="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 transition-all duration-300 hover:scale-110 flex items-center justify-center mx-auto">❌</button>
                </td>
            `;
            
            // Add stagger animation
            tr.style.animationDelay = `${i * 0.05}s`;
            tr.classList.add('animate-fade-in-up');
            
            taskList.appendChild(tr);
        });
    }

    if(day && day.completed.length > 0) {
        updateDaily(day.completed);
    } else {
        dailyBox.innerHTML = '<div class="empty-state">Complete tasks to see your productivity! 💪</div>';
    }

    updateWeekly();
}

// Enhanced FINISH TASK with animation
function finishTask(index){
    const date = dateInput.value;
    const task = data[date].tasks.splice(index, 1)[0];
    data[date].completed.push(task);
    save();
    render();
    
    showActionToast('complete', task.name);
}

// Enhanced REMOVE TASK with confirmation
function removeTask(index){
    const task = data[dateInput.value].tasks[index];
    
    // Create custom confirmation dialog
    if(confirm(`Are you sure you want to delete "${task.name}"?`)) {
        const element = taskList.children[index];
        if(element) {
            element.classList.add('task-delete');
            setTimeout(() => {
                data[dateInput.value].tasks.splice(index, 1);
                save();
                render();
                showActionToast('delete', task.name);
            }, 300);
        } else {
            data[dateInput.value].tasks.splice(index, 1);
            save();
            render();
            showActionToast('delete', task.name);
        }
    }
}

// Enhanced DAILY PRODUCTIVITY with better styling
function updateDaily(completed){
    let summary = {};
    completed.forEach(t=>{
        summary[t.type] = (summary[t.type] || 0) + t.total;
    });

    const totalMinutes = completed.reduce((sum, t) => sum + t.total, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Add summary header
    dailyBox.innerHTML = `
        <div class="stats-card bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-4 text-white mb-4">
            <div class="text-sm opacity-80">Today's Total</div>
            <div class="text-2xl font-bold">${hours}h ${minutes}m</div>
            <div class="text-sm opacity-80 mt-1">${completed.length} tasks completed 🎯</div>
        </div>
    `;

    for(let type in summary){
        const percentage = Math.round((summary[type] / totalMinutes) * 100);
        
        dailyBox.innerHTML += `
            <div class="stats-card bg-white dark:bg-gray-800 rounded-xl p-3 mb-2">
                <div class="flex justify-between items-center mb-2">
                    <b class="text-secondary-700 dark:text-gray-200">${escapeHtml(type)}</b>
                    <span class="text-primary-600 dark:text-primary-400 font-semibold">${formatTime(summary[type])}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${percentage}% of total</div>
            </div>
        `;
    }
}

// Enhanced WEEKLY PRODUCTIVITY
function updateWeekly(){
    let week = {};
    for(let d in data){
        data[d].completed.forEach(t=>{
            const taskType = t.type;
            if(!week[taskType]) {
                week[taskType] = { total: 0, dates: {} };
            }
            week[taskType].total += t.total;
            week[taskType].dates[d] = (week[taskType].dates[d] || 0) + t.total;
        });
    }

    if(Object.keys(week).length === 0) {
        weeklyBox.innerHTML = '<div class="empty-state">No completed tasks this week. Start working! 💪</div>';
        return;
    }

    // Weekly total
    let weeklyTotal = 0;
    let weeklyCount = 0;
    for(let d in data) {
        data[d].completed.forEach(t => {
            weeklyTotal += t.total;
            weeklyCount++;
        });
    }

    weeklyBox.innerHTML = `
        <div class="stats-card bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 text-white mb-4">
            <div class="text-sm opacity-80">This Week's Total</div>
            <div class="text-2xl font-bold">${formatTime(weeklyTotal)}</div>
            <div class="text-sm opacity-80 mt-1">${weeklyCount} tasks completed! 🌟</div>
        </div>
    `;

    for(let type in week){
        let dateBreakdown = '';
        const sortedDates = Object.entries(week[type].dates).sort((a, b) => new Date(b[0]) - new Date(a[0]));
        
        sortedDates.forEach(([date, time]) => {
            dateBreakdown += `
                <div class="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg my-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">📅 ${formatDate(date)}</span>
                    <span class="text-xs font-medium text-primary-600 dark:text-primary-400">${formatTime(time)}</span>
                </div>
            `;
        });
        
        weeklyBox.innerHTML += `
            <div class="stats-card bg-white dark:bg-gray-800 rounded-xl p-3 mb-2">
                <div class="flex justify-between items-center mb-2">
                    <b class="text-secondary-700 dark:text-gray-200">${escapeHtml(type)}</b>
                    <span class="text-primary-600 dark:text-primary-400 font-semibold">${formatTime(week[type].total)}</span>
                </div>
                <div class="mt-2">
                    ${dateBreakdown}
                </div>
            </div>
        `;
    }
}

// Enhanced CLEAR DAILY
document.getElementById("clearDaily").onclick = () => {
    const date = dateInput.value;
    if(data[date] && data[date].completed.length > 0) {
        if(confirm("Clear all completed tasks for today?")) {
            data[date].completed = [];
            save();
            render();
            showToast("🧹 Daily stats cleared!");
        }
    } else {
        showToast("ℹ️ No completed tasks to clear");
    }
};

// Enhanced CLEAR ALL
document.getElementById("clearAll").onclick = () => {
    if(confirm("⚠️ Delete ALL productivity data? This cannot be undone!")){
        localStorage.clear();
        data = {};
        render();
        showActionToast('clear');
    }
};

// TIME CALCULATION
function calcMinutes(){
    const h1 = convert(sh.value, sap.value);
    const h2 = convert(eh.value, eap.value);
    const m1 = parseInt(sm.value) || 0;
    const m2 = parseInt(em.value) || 0;
    
    let totalMinutes = (h2*60 + m2) - (h1*60 + m1);
    
    // Handle overnight tasks (end time before start time)
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Add 24 hours (1440 minutes)
    }
    
    return totalMinutes;
}

function convert(h, ap){
    h = parseInt(h);
    if(ap === "PM" && h !== 12) h += 12;
    if(ap === "AM" && h === 12) h = 0;
    return h;
}

function clearInputs(){
    taskType.value = "";
    taskName.value = "";
    sh.value = sm.value = eh.value = em.value = "";
}

function save(){
    localStorage.setItem("dailyTask", JSON.stringify(data));
}

// Format time to hours and minutes
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes}m`;
    } else if (minutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${minutes}m`;
    }
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Shake animation for errors
function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.5s ease';
}

// Add shake keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize
dateInput.onchange = render;
render();

// Add pulse animation to header on load
document.querySelector('h1').classList.add('animate-pulse-slow');

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('addTask').click();
    }
});

