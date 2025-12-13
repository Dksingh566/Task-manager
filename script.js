const taskList = document.getElementById("taskList");
const dailyBox = document.getElementById("dailyBox");
const weeklyBox = document.getElementById("weeklyBox");
const dateInput = document.getElementById("taskDate");

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

// ADD TASK
document.getElementById("addTask").onclick = () => {
    const date = dateInput.value;
    if(!data[date]) data[date] = { tasks: [], completed: [] };

    const type = taskType.value.trim();
    const name = taskName.value.trim();
    const total = calcMinutes();

    if(!type || !name || total <= 0){
        alert("Please enter valid task details");
        return;
    }

    data[date].tasks.push({ type, name, total });
    clearInputs();
    save();
    render();
};

// RENDER
function render(){
    taskList.innerHTML = "";
    dailyBox.innerHTML = "";
    weeklyBox.innerHTML = "";

    const day = data[dateInput.value];
    if(!day || day.tasks.length === 0) {
        taskList.innerHTML = '<tr><td colspan="5" class="empty-state">No active tasks</td></tr>';
    } else {
        day.tasks.forEach((t,i)=>{
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.type}</td>
                <td>${t.name}</td>
                <td>${formatTime(t.total)}</td>
                <td onclick="finishTask(${i})">✔</td>
                <td onclick="removeTask(${i})">❌</td>
            `;
            taskList.appendChild(tr);
        });
    }

    if(day && day.completed.length > 0) {
        updateDaily(day.completed);
    } else {
        dailyBox.innerHTML = '<div class="empty-state">No completed tasks today</div>';
    }

    updateWeekly();
}

// FINISH TASK
function finishTask(index){
    const date = dateInput.value;
    const task = data[date].tasks.splice(index,1)[0];
    data[date].completed.push(task);
    save();
    render();
}

// REMOVE TASK
function removeTask(index){
    data[dateInput.value].tasks.splice(index,1);
    save();
    render();
}

// DAILY PRODUCTIVITY
function updateDaily(completed){
    let summary = {};
    completed.forEach(t=>{
        summary[t.type] = (summary[t.type] || 0) + t.total;
    });

    for(let type in summary){
        dailyBox.innerHTML += `
            <div class="summary-row">
                <b>${type}</b>
                <span>${formatTime(summary[type])}</span>
            </div>
        `;
    }
}

// WEEKLY PRODUCTIVITY
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
        weeklyBox.innerHTML = '<div class="empty-state">No completed tasks this week</div>';
        return;
    }

    for(let type in week){
        let dateBreakdown = '';
        for(let date in week[type].dates) {
            dateBreakdown += `<div style="font-size: 12px; color: #7c3aed; margin-left: 20px;">📅 ${date}: ${formatTime(week[type].dates[date])}</div>`;
        }
        weeklyBox.innerHTML += `
            <div class="summary-row" style="flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <b>${type}</b>
                    <span>${formatTime(week[type].total)}</span>
                </div>
                ${dateBreakdown}
            </div>
        `;
    }
}

// CLEAR DAILY
document.getElementById("clearDaily").onclick = () => {
    const date = dateInput.value;
    if(data[date]){
        data[date].completed = [];
        save();
        render();
    }
};

// CLEAR ALL
document.getElementById("clearAll").onclick = () => {
    if(confirm("Delete all productivity data?")){
        localStorage.clear();
        data = {};
        render();
    }
};

// TIME CALCULATION
function calcMinutes(){
    const h1 = convert(sh.value, sap.value);
    const h2 = convert(eh.value, eap.value);
    const m1 = parseInt(sm.value) || 0;
    const m2 = parseInt(em.value) || 0;
    return (h2*60 + m2) - (h1*60 + m1);
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

dateInput.onchange = render;
render();