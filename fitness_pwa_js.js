// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
}

// PWA Install Prompt
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installPrompt.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// App Data Structure
const weeks = {
    1: {
        title: "Week 1: Foundation Building",
        wakeTarget: "6:05am",
        focus: "Establishing the habit",
        workouts: 3,
        schedule: {
            Monday: { type: "rest", activity: "Practice wake-up routine" },
            Tuesday: { type: "workout", activity: "Upper Body + 20min cardio (45min)", location: "Gym" },
            Wednesday: { type: "rest", activity: "Rest day - focus on sleep routine" },
            Thursday: { type: "workout", activity: "Lower Body + Core (45min)", location: "Gym" },
            Friday: { type: "flex", activity: "Flexible yoga or walk (30min)", location: "Home" },
            Saturday: { type: "rest", activity: "Weekend activities" },
            Sunday: { type: "prep", activity: "Meal prep & planning" }
        },
        goals: [
            "Complete 3 planned workouts",
            "Establish 9:30pm bedtime",
            "Wake at 6:05am consistently",
            "Practice evening prep routine"
        ]
    },
    2: {
        title: "Week 2: Habit Formation",
        wakeTarget: "5:50am",
        focus: "Routine refinement",
        workouts: 5,
        schedule: {
            Monday: { type: "workout", activity: "Strength Focus (60min)", location: "Home" },
            Tuesday: { type: "workout", activity: "Upper Body Circuit (50min)", location: "Gym" },
            Wednesday: { type: "workout", activity: "Lower + Core (50min)", location: "Gym" },
            Thursday: { type: "workout", activity: "Total Body Circuit (50min)", location: "Gym" },
            Friday: { type: "workout", activity: "Active Recovery (45min)", location: "Home" },
            Saturday: { type: "rest", activity: "Optional outdoor activity" },
            Sunday: { type: "prep", activity: "Week 3 preparation" }
        },
        goals: [
            "Complete all 5 planned sessions",
            "Wake at 5:50am consistently",
            "Increase workout intensity",
            "Perfect timing routine"
        ]
    },
    3: {
        title: "Week 3: Target Achievement",
        wakeTarget: "5:45am",
        focus: "Full schedule implementation",
        workouts: 5,
        schedule: {
            Monday: { type: "workout", activity: "Advanced Strength (75min)", location: "Home" },
            Tuesday: { type: "workout", activity: "Upper + Rowing (60min)", location: "Gym" },
            Wednesday: { type: "workout", activity: "Lower + Incline Walk (60min)", location: "Gym" },
            Thursday: { type: "workout", activity: "Total Body Circuit (60min)", location: "Gym" },
            Friday: { type: "workout", activity: "Active Recovery (60-90min)", location: "Home" },
            Saturday: { type: "rest", activity: "Assessment weekend" },
            Sunday: { type: "prep", activity: "Week 4-6 planning" }
        },
        goals: [
            "Master 5:45am wake-up",
            "Complete full 5-day schedule",
            "Perfect morning timing",
            "Consistent 7:50am departure"
        ]
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    currentWeek: 'fitnessTracker_currentWeek',
    dailyData: 'fitnessTracker_dailyData',
    progress: 'fitnessTracker_progress',
    startDate: 'fitnessTracker_startDate'
};

// Initialize App
class FitnessTracker {
    constructor() {
        this.currentWeek = this.loadData(STORAGE_KEYS.currentWeek) || 1;
        this.dailyData = this.loadData(STORAGE_KEYS.dailyData) || {};
        this.progress = this.loadData(STORAGE_KEYS.progress) || {
            totalWorkouts: 0,
            currentStreak: 0,
            longestStreak: 0,
            badges: []
        };
        this.startDate = this.loadData(STORAGE_KEYS.startDate) || new Date().toISOString().split('T')[0];
        
        this.init();
    }
    
    init() {
        this.updateWeekInfo();
        this.updateTodayInfo();
        this.loadTodayData();
        this.updateProgress();
        this.updateSchedule();
        this.checkWeatherAlert();
        
        // Auto-save every 5 seconds if there are changes
        setInterval(() => this.saveAllData(), 5000);
    }
    
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading data:', e);
            return null;
        }
    }
    
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }
    
    saveAllData() {
        this.saveData(STORAGE_KEYS.currentWeek, this.currentWeek);
        this.saveData(STORAGE_KEYS.dailyData, this.dailyData);
        this.saveData(STORAGE_KEYS.progress, this.progress);
        this.saveData(STORAGE_KEYS.startDate, this.startDate);
    }
    
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }
    
    updateWeekInfo() {
        const week = weeks[this.currentWeek] || weeks[1];
        document.getElementById('currentWeekTitle').textContent = week.title;
        document.getElementById('wakeTarget').textContent = week.wakeTarget;
        document.getElementById('weekFocus').textContent = week.focus;
        document.getElementById('todayWakeTarget').textContent = week.wakeTarget;
        document.getElementById('weekNumber').textContent = this.currentWeek;
    }
    
    updateTodayInfo() {
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-IE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('todayDate').innerHTML = `<strong>${todayStr}</strong>`;
        
        // Update today's workout
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const week = weeks[this.currentWeek] || weeks[1];
        const todaySchedule = week.schedule[dayName];
        
        if (todaySchedule) {
            document.getElementById('todayWorkout').textContent = todaySchedule.activity;
        }
    }
    
    loadTodayData() {
        const todayKey = this.getTodayKey();
        const todayData = this.dailyData[todayKey] || {};
        
        // Load checkin states
        ['wakeup', 'workout', 'departure', 'energy', 'sleep'].forEach(item => {
            if (todayData[item]) {
                this.setCheckinComplete(item, true);
            }
        });
        
        // Load specific values
        if (todayData.wakeTime) {
            document.getElementById('actualWakeTime').value = todayData.wakeTime;
        }
        
        if (todayData.energyLevel) {
            document.getElementById('energyLevel').value = todayData.energyLevel;
            this.updateEnergyDisplay();
        }
    }
    
    setCheckinComplete(itemId, completed) {
        const item = document.getElementById(itemId);
        const checkbox = item.querySelector('.checkin-checkbox');
        
        if (completed) {
            item.classList.add('completed');
            checkbox.classList.add('completed');
        } else {
            item.classList.remove('completed');
            checkbox.classList.remove('completed');
        }
        
        this.saveTodayData();
        this.updateProgress();
    }
    
    saveTodayData() {
        const todayKey = this.getTodayKey();
        const todayData = {};
        
        // Save checkin states
        ['wakeup', 'workout', 'departure', 'energy', 'sleep'].forEach(item => {
            todayData[item] = document.getElementById(item).classList.contains('completed');
        });
        
        // Save specific values
        todayData.wakeTime = document.getElementById('actualWakeTime').value;
        todayData.energyLevel = document.getElementById('energyLevel').value;
        todayData.date = new Date().toISOString();
        
        this.dailyData[todayKey] = todayData;
        this.saveData(STORAGE_KEYS.dailyData, this.dailyData);
    }
    
    updateProgress() {
        // Calculate weekly progress
        const weekStart = this.getWeekStartDate();
        let completedDays = 0;
        let totalWorkouts = 0;
        let energySum = 0;
        let energyCount = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = this.dailyData[dateKey];
            
            if (dayData) {
                if (dayData.wakeup && dayData.workout && dayData.departure) {
                    completedDays++;
                }
                if (dayData.workout) {
                    totalWorkouts++;
                }
                if (dayData.energyLevel) {
                    energySum += parseInt(dayData.energyLevel);
                    energyCount++;
                }
            }
        }
        
        const weeklyPercentage = Math.round((completedDays / 7) * 100);
        document.getElementById('weeklyProgress').style.width = weeklyPercentage + '%';
        document.getElementById('weeklyProgress').textContent = weeklyPercentage + '%';
        
        // Update stats
        this.progress.totalWorkouts = Object.values(this.dailyData)
            .filter(day => day.workout).length;
        
        document.getElementById('totalWorkouts').textContent = this.progress.totalWorkouts;
        document.getElementById('currentStreak').textContent = this.calculateStreak();
        
        const avgEnergy = energyCount > 0 ? Math.round(energySum / energyCount) : 0;
        document.getElementById('avgEnergy').textContent = avgEnergy;
        
        this.updateBadges();
    }
    
    calculateStreak() {
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = this.dailyData[dateKey];
            
            if (dayData && dayData.wakeup && dayData.workout) {
                streak++;
            } else if (i > 0) { // Don't break streak on today if not completed yet
                break;
            }
        }
        
        return streak;
    }
    
    getWeekStartDate() {
        const start = new Date(this.startDate);
        const weeksToAdd = (this.currentWeek - 1) * 7;
        start.setDate(start.getDate() + weeksToAdd);
        
        // Adjust to start of week (Monday)
        const dayOfWeek = start.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(start.getDate() - daysToSubtract);
        
        return start;
    }
    
    updateSchedule() {
        const week = weeks[this.currentWeek] || weeks[1];
        const scheduleContainer = document.getElementById('weeklySchedule');
        const goalsContainer = document.getElementById('weekGoals');
        
        // Generate schedule
        let scheduleHTML = '';
        Object.entries(week.schedule).forEach(([day, info]) => {
            const typeClass = info.type === 'workout' ? 'workout' : 
                             info.type === 'rest' ? 'rest' : 'flex';
            const icon = info.type === 'workout' ? '💪' :
                        info.type === 'rest' ? '😴' : 
                        info.type === 'flex' ? '🧘' : '📋';
            
            scheduleHTML += `
                <div class="checkin-item" style="margin-bottom: 8px;">
                    <div class="checkin-text">
                        <div class="checkin-title">${icon} ${day}</div>
                        <div class="checkin-detail">${info.activity}</div>
                        ${info.location ? `<div class="checkin-detail">📍 ${info.location}</div>` : ''}
                    </div>
                </div>
            `;
        });
        scheduleContainer.innerHTML = scheduleHTML;
        
        // Generate goals
        let goalsHTML = '';
        week.goals.forEach(goal => {
            goalsHTML += `
                <div class="checkin-item" style="margin-bottom: 8px;">
                    <div class="checkin-text">
                        <div class="checkin-detail">🎯 ${goal}</div>
                    </div>
                </div>
            `;
        });
        goalsContainer.innerHTML = goalsHTML;
    }
    
    updateBadges() {
        const badges = [];
        const streak = this.calculateStreak();
        const totalWorkouts = this.progress.totalWorkouts;
        
        // Streak badges
        if (streak >= 3) badges.push({ emoji: '🔥', text: '3 Day Streak' });
        if (streak >= 7) badges.push({ emoji: '⚡', text: 'Week Warrior' });
        if (streak >= 14) badges.push({ emoji: '💪', text: '2 Week Champion' });
        if (streak >= 30) badges.push({ emoji: '🏆', text: 'Month Master' });
        
        // Workout badges
        if (totalWorkouts >= 5) badges.push({ emoji: '🌟', text: 'Getting Started' });
        if (totalWorkouts >= 15) badges.push({ emoji: '💎', text: 'Consistent' });
        if (totalWorkouts >= 30) badges.push({ emoji: '👑', text: 'Dedicated' });
        
        // Week progression badges
        if (this.currentWeek >= 2) badges.push({ emoji: '📈', text: 'Week 2 Reached' });
        if (this.currentWeek >= 3) badges.push({ emoji: '🎯', text: '5:45am Achieved' });
        
        // Early bird badges
        const todayKey = this.getTodayKey();
        const todayData = this.dailyData[todayKey];
        if (todayData && todayData.wakeTime && todayData.wakeTime <= '05:45') {
            badges.push({ emoji: '🌅', text: 'Early Bird' });
        }
        
        const badgesContainer = document.getElementById('badges');
        badgesContainer.innerHTML = badges.map(badge => 
            `<div style="background: #e3f2fd; padding: 8px 12px; border-radius: 15px; font-size: 12px;">
                ${badge.emoji} ${badge.text}
             </div>`
        ).join('');
    }
    
    checkWeatherAlert() {
        // Simple weather check - in a real app, you'd use a weather API
        const hour = new Date().getHours();
        const isEarlyMorning = hour >= 5 && hour <= 8;
        const weatherAlert = document.getElementById('weatherAlert');
        
        // Show weather alert during workout hours
        if (isEarlyMorning) {
            weatherAlert.classList.add('show');
        }
        
        // You could integrate with a weather API here
        // For now, we'll show backup plans occasionally
        if (Math.random() > 0.7) { // 30% chance
            weatherAlert.classList.add('show');
            const backupPlans = [
                "Heavy rain expected: Try the 20-min home HIIT routine",
                "Foggy morning: Indoor bodyweight circuit recommended",
                "Cold and wet: Perfect day for yoga and stretching",
                "Stormy weather: Use resistance bands for strength training"
            ];
            document.getElementById('backupPlan').textContent = 
                backupPlans[Math.floor(Math.random() * backupPlans.length)];
        }
    }
    
    // Week progression logic
    checkWeekProgression() {
        const weekStart = this.getWeekStartDate();
        const today = new Date();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // If it's Sunday and week is mostly complete, suggest progression
        if (today.getDay() === 0 && today > weekEnd) {
            const weeklyProgress = this.calculateWeeklyCompletion();
            if (weeklyProgress >= 0.8 && this.currentWeek < 12) {
                this.showWeekProgressionPrompt();
            }
        }
    }
    
    calculateWeeklyCompletion() {
        const weekStart = this.getWeekStartDate();
        let completedDays = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = this.dailyData[dateKey];
            
            if (dayData && dayData.wakeup && dayData.workout) {
                completedDays++;
            }
        }
        
        return completedDays / 7;
    }
    
    showWeekProgressionPrompt() {
        if (confirm(`🎉 Great job completing Week ${this.currentWeek}! Ready to advance to Week ${this.currentWeek + 1}?`)) {
            this.advanceWeek();
        }
    }
    
    advanceWeek() {
        if (this.currentWeek < 12) {
            this.currentWeek++;
            this.updateWeekInfo();
            this.updateSchedule();
            this.saveAllData();
            
            // Show week advancement celebration
            this.showCelebration(`Welcome to Week ${this.currentWeek}! 🎊`);
        }
    }
    
    showCelebration(message) {
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        celebration.innerHTML = `
            <h3>${message}</h3>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #333;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                margin-top: 10px;
                cursor: pointer;
            ">Continue</button>
        `;
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            if (celebration.parentElement) {
                celebration.remove();
            }
        }, 5000);
    }
}

// Global functions for HTML event handlers
function toggleCheckin(itemId) {
    const item = document.getElementById(itemId);
    const isCompleted = item.classList.contains('completed');
    app.setCheckinComplete(itemId, !isCompleted);
    
    // Special handling for workout completion
    if (itemId === 'workout' && !isCompleted) {
        app.showCelebration('Workout completed! 💪 Great job!');
    }
    
    // Check for daily completion
    setTimeout(() => {
        const todayKey = app.getTodayKey();
        const todayData = app.dailyData[todayKey];
        if (todayData && todayData.wakeup && todayData.workout && 
            todayData.departure && todayData.energy && todayData.sleep) {
            app.showCelebration('Perfect day completed! 🌟');
        }
    }, 100);
}

function updateEnergyDisplay() {
    const energyLevel = document.getElementById('energyLevel').value;
    document.getElementById('energyDisplay').textContent = energyLevel;
    app.saveTodayData();
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Special actions for different sections
    if (sectionName === 'progress') {
        app.updateProgress();
        app.checkWeekProgression();
    }
}

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FitnessTracker();
    
    // Set up notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Daily reminder notifications
    if ('Notification' in window && Notification.permission === 'granted') {
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(21, 0, 0, 0); // 9 PM reminder
        
        if (now < reminderTime) {
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            setTimeout(() => {
                new Notification('🌙 Evening Prep Time!', {
                    body: 'Time to prepare for tomorrow\'s 5:45am wake-up. Lay out clothes and set your alarm!',
                    icon: '/icon-192.png'
                });
            }, timeUntilReminder);
        }
    }
});

// Morning wake-up celebration
function checkMorningWakeup() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 100 + minute;
    
    // Check if it's around wake-up time
    if (time >= 545 && time <= 630) {
        const todayKey = app.getTodayKey();
        const todayData = app.dailyData[todayKey] || {};
        
        if (!todayData.morningGreeting) {
            app.showCelebration('Good morning! 🌅 You\'re up early - great start to the day!');
            todayData.morningGreeting = true;
            app.dailyData[todayKey] = todayData;
            app.saveAllData();
        }
    }
}

// Check for morning greeting every minute
setInterval(checkMorningWakeup, 60000);

// Export data function for backup
function exportData() {
    const data = {
        currentWeek: app.currentWeek,
        dailyData: app.dailyData,
        progress: app.progress,
        startDate: app.startDate,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}