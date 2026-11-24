const DEFAULT_MINUTES = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

let savedMinutes = JSON.parse(localStorage.getItem('pomodoro_custom_minutes'));
let customMinutes = savedMinutes ? { ...DEFAULT_MINUTES, ...savedMinutes } : { ...DEFAULT_MINUTES };

function getModesInSeconds() {
    return {
        pomodoro: customMinutes.pomodoro * 60,
        shortBreak: customMinutes.shortBreak * 60,
        longBreak: customMinutes.longBreak * 60
    };
}

let MODES = getModesInSeconds();
let currentMode = 'pomodoro';
let timeLeft = MODES[currentMode];
let timerInterval = null;
let isRunning = false;
let sessionCycle = 0;

let tasks = JSON.parse(localStorage.getItem('pomodoro_tasks')) || [];

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

const pomodoroModeBtn = document.getElementById('pomodoro-mode-btn');
const shortModeBtn = document.getElementById('short-mode-btn');
const longModeBtn = document.getElementById('long-mode-btn');

const toggleCustomBtn = document.getElementById('toggle-custom-btn');
const customTimeForm = document.getElementById('custom-time-form');
const customPomodoroInput = document.getElementById('custom-pomodoro');
const customShortInput = document.getElementById('custom-short');
const customLongInput = document.getElementById('custom-long');
const defaultTimeBtn = document.getElementById('default-time-btn');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const taskList = document.getElementById('task-list');

function updateModeLabels() {
    pomodoroModeBtn.textContent = `Pomodoro (${customMinutes.pomodoro}m)`;
    shortModeBtn.textContent = `Short Break (${customMinutes.shortBreak}m)`;
    longModeBtn.textContent = `Long Break (${customMinutes.longBreak}m)`;

    customPomodoroInput.value = customMinutes.pomodoro;
    customShortInput.value = customMinutes.shortBreak;
    customLongInput.value = customMinutes.longBreak;
}


function playChime() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.8);
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


function switchMode(mode) {
    pauseTimer();
    currentMode = mode;
    MODES = getModesInSeconds();
    timeLeft = MODES[mode];
    updateDisplay();

    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}


function handleSessionComplete() {
    pauseTimer();
    playChime();

    if (currentMode === 'pomodoro') {
        sessionCycle++;
        if (sessionCycle % 4 === 0) {
            switchMode('longBreak');
        } else {
            switchMode('shortBreak');
        }
    } else {
        switchMode('pomodoro');
    }
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            handleSessionComplete();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetTimer() {
    pauseTimer();
    MODES = getModesInSeconds();
    timeLeft = MODES[currentMode];
    updateDisplay();
}

function skipTimer() {
    handleSessionComplete();
}

toggleCustomBtn.addEventListener('click', () => {
    customTimeForm.classList.toggle('hidden');
});

customTimeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const pMin = parseInt(customPomodoroInput.value, 10);
    const sMin = parseInt(customShortInput.value, 10);
    const lMin = parseInt(customLongInput.value, 10);

    if (pMin < 1 || sMin < 1 || lMin < 1) return;

    customMinutes = {
        pomodoro: pMin,
        shortBreak: sMin,
        longBreak: lMin
    };

    localStorage.setItem('pomodoro_custom_minutes', JSON.stringify(customMinutes));
    MODES = getModesInSeconds();
    updateModeLabels();
    resetTimer();
    customTimeForm.classList.add('hidden');
});

defaultTimeBtn.addEventListener('click', () => {
    customMinutes = { ...DEFAULT_MINUTES };
    localStorage.removeItem('pomodoro_custom_minutes');
    MODES = getModesInSeconds();
    updateModeLabels();
    resetTimer();
    customTimeForm.classList.add('hidden');
});


startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', skipTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});


function saveTasks() {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
            </div>
            <div class="task-right">
                <span class="badge ${task.priority}">${task.priority}</span>
                <button class="delete-btn" title="Delete Task">&times;</button>
            </div>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            tasks[index].completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        });

        taskList.appendChild(li);
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!text) return;

    tasks.push({
        text: text,
        priority: priority,
        completed: false
    });

    saveTasks();
    renderTasks();
    taskInput.value = '';
});

updateModeLabels();
updateDisplay();
renderTasks();