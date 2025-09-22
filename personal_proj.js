// Data and state management
const state = {
    activities: JSON.parse(localStorage.getItem('ecoActivities')) || [
        { id: 1, type: 'transport', detail: 'car', amount: 15, date: new Date(), emission: 3.6 },
        { id: 2, type: 'energy', detail: 'electricity', amount: 8, date: new Date(Date.now() - 86400000), emission: 4.2 },
        { id: 3, type: 'food', detail: 'beef', amount: 0.5, date: new Date(Date.now() - 172800000), emission: 15.5 }
    ],
    goals: JSON.parse(localStorage.getItem('ecoGoals')) || [
        { id: 1, type: 'reduce_emissions', target: 50, current: 12.3, deadline: '2024-12-31', description: 'Reduce monthly carbon emissions by 50kg', status: 'in-progress' },
        { id: 2, type: 'energy_saving', target: 20, current: 8.5, deadline: '2024-10-15', description: 'Save 20kWh of electricity per month', status: 'in-progress' }
    ],
    emissionFactors: {
        car: 0.24, // kg CO2 per km
        bus: 0.10, // kg CO2 per km
        train: 0.06, // kg CO2 per km
        bicycle: 0, // kg CO2 per km
        motorcycle: 0.12, // kg CO2 per km
        electricity: 0.52, // kg CO2 per kWh
        natural_gas: 2.0, // kg CO2 per m³
        heating_oil: 2.68, // kg CO2 per liter
        beef: 31.0, // kg CO2 per kg
        lamb: 24.0, // kg CO2 per kg
        chicken: 6.0, // kg CO2 per kg
        pork: 7.0, // kg CO2 per kg
        fish: 5.0, // kg CO2 per kg
        cheese: 13.5, // kg CO2 per kg
        clothing: 15.0, // kg CO2 per item (average)
        electronics: 50.0, // kg CO2 per item (average)
        furniture: 30.0, // kg CO2 per item (average)
        plastic: 6.0, // kg CO2 per kg
    },
    units: {
        transport: 'km',
        energy: 'kWh',
        food: 'kg',
        shopping: 'units'
    },
    currentSection: 'dashboard'
};

// DOM Elements
const activityModal = document.getElementById('activity-modal');
const activityForm = document.getElementById('activity-form');
const activityType = document.getElementById('activity-type');
const activityDetail = document.getElementById('activity-detail');
const addActivityBtn = document.getElementById('add-activity-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeBtn = document.querySelector('.close-btn');
const activitiesList = document.getElementById('activities-list');
const totalFootprintEl = document.getElementById('total-footprint');
const energyUsageEl = document.getElementById('energy-usage');
const transportDistanceEl = document.getElementById('transport-distance');
const recommendationsList = document.getElementById('recommendations-list');
const goalsSection = document.getElementById('goals-section');
const goalsContainer = document.getElementById('goals-container');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalModal = document.getElementById('goal-modal');
const goalForm = document.getElementById('goal-form');
const closeGoalBtn = document.getElementById('close-goal-btn');
const cancelGoalBtn = document.getElementById('cancel-goal-btn');
const tipsSection = document.getElementById('tips-section');
const tipsContainer = document.getElementById('tips-container');

// Navigation links
const dashboardLink = document.querySelector('nav a.active');
const insightsLink = document.getElementById('insights-link');
const goalsLink = document.getElementById('goals-link');
const tipsLink = document.getElementById('tips-link');

// Initialize the app
function init() {
    renderActivities();
    updateSummary();
    renderRecommendations();
    renderGoals();
    renderTips();
    setupEventListeners();
    initCharts();
}

// Set up event listeners
function setupEventListeners() {
    // Activity modal
    addActivityBtn.addEventListener('click', () => {
        activityModal.style.display = 'flex';
    });
    
    cancelBtn.addEventListener('click', closeActivityModal);
    closeBtn.addEventListener('click', closeActivityModal);
    
    activityType.addEventListener('change', updateActivityDetails);
    
    activityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addActivity();
    });
    
    // Goal modal
    addGoalBtn.addEventListener('click', () => {
        goalModal.style.display = 'flex';
    });
    
    closeGoalBtn.addEventListener('click', closeGoalModal);
    cancelGoalBtn.addEventListener('click', closeGoalModal);
    
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addGoal();
    });
    
    // Navigation
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('dashboard');
    });
    
    insightsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('insights');
    });
    
    goalsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('goals');
    });
    
    tipsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('tips');
    });
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('goal-deadline').valueAsDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
}

// Show/hide sections based on navigation
function showSection(section) {
    // Hide all sections
    document.querySelector('.dashboard').style.display = 'none';
    document.querySelector('.recommendations').style.display = 'none';
    goalsSection.style.display = 'none';
    tipsSection.style.display = 'none';
    
    // Remove active class from all nav links
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section and set active nav link
    switch(section) {
        case 'dashboard':
            document.querySelector('.dashboard').style.display = 'grid';
            document.querySelector('.recommendations').style.display = 'block';
            dashboardLink.classList.add('active');
            break;
        case 'insights':
            document.querySelector('.dashboard').style.display = 'grid';
            document.querySelector('.recommendations').style.display = 'block';
            insightsLink.classList.add('active');
            break;
        case 'goals':
            goalsSection.style.display = 'block';
            goalsLink.classList.add('active');
            break;
        case 'tips':
            tipsSection.style.display = 'block';
            tipsLink.classList.add('active');
            break;
    }
    
    state.currentSection = section;
}

// Update activity details based on type
function updateActivityDetails() {
    const type = activityType.value;
    activityDetail.innerHTML = '<option value="">Select specific activity</option>';
    
    if (type === 'transport') {
        addOptions(['car', 'bus', 'train', 'bicycle', 'motorcycle']);
    } else if (type === 'energy') {
        addOptions(['electricity', 'natural_gas', 'heating_oil']);
    } else if (type === 'food') {
        addOptions(['beef', 'lamb', 'chicken', 'pork', 'fish', 'cheese']);
    } else if (type === 'shopping') {
        addOptions(['clothing', 'electronics', 'furniture', 'plastic']);
    }
}

function addOptions(options) {
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ');
        activityDetail.appendChild(opt);
    });
}

// Add a new activity
function addActivity() {
    const type = activityType.value;
    const detail = activityDetail.value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    
    // Calculate emission based on activity type and amount
    const emission = calculateEmission(detail, amount);
    
    const activity = {
        id: Date.now(),
        type,
        detail,
        amount,
        date: new Date(date),
        emission
    };
    
    state.activities.unshift(activity);
    saveActivities();
    renderActivities();
    updateSummary();
    renderRecommendations();
    updateCharts();
    updateGoalsProgress();
    closeActivityModal();
}

// Add a new goal
function addGoal() {
    const target = parseFloat(document.getElementById('goal-target').value);
    const description = document.getElementById('goal-description').value;
    const deadline = document.getElementById('goal-deadline').value;
    
    const goal = {
        id: Date.now(),
        target,
        current: 0,
        deadline,
        description,
        status: 'in-progress'
    };
    
    state.goals.push(goal);
    saveGoals();
    renderGoals();
    closeGoalModal();
}

// Close activity modal
function closeActivityModal() {
    activityModal.style.display = 'none';
}

// Close goal modal
function closeGoalModal() {
    goalModal.style.display = 'none';
}

// Save activities to localStorage
function saveActivities() {
    localStorage.setItem('ecoActivities', JSON.stringify(state.activities));
}

// Save goals to localStorage
function saveGoals() {
    localStorage.setItem('ecoGoals', JSON.stringify(state.goals));
}

// Format date as "Today", "Yesterday", or "MMM DD, YYYY"
function formatDate(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    // Format as e.g., Sep 21, 2025
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(undefined, options);
}

// Render activities list
function renderActivities() {
    activitiesList.innerHTML = '';
    state.activities.forEach(activity => {
        const activityEl = document.createElement('div');
        activityEl.classList.add('activity-item');
        activityEl.innerHTML = `
            <span class="activity-date">${formatDate(activity.date)}</span>
            <span class="activity-detail">${activity.type} - ${activity.detail}</span>
            <span class="activity-amount">${activity.amount} ${state.units[activity.type]}</span>
            <span class="activity-emission">${activity.emission.toFixed(2)} kg CO2</span>
        `;
        activitiesList.appendChild(activityEl);
    });
}

// Calculate emission based on activity type and amount
function calculateEmission(detail, amount) {
    return state.emissionFactors[detail] * amount;
}

// Update summary with total footprint
function updateSummary() {
    const totalEmissions = state.activities.reduce((acc, activity) => acc + activity.emission, 0);
    totalFootprintEl.textContent = `${totalEmissions.toFixed(2)} kg CO2`;
    
    const totalEnergy = state.activities.filter(activity => activity.type === 'energy')
        .reduce((acc, activity) => acc + activity.amount, 0);
    energyUsageEl.textContent = `${totalEnergy.toFixed(2)} kWh`;
    
    const totalTransport = state.activities.filter(activity => activity.type === 'transport')
        .reduce((acc, activity) => acc + activity.amount, 0);
    transportDistanceEl.textContent = `${totalTransport.toFixed(2)} km`;
}

// Render recommendations
function renderRecommendations() {
    recommendationsList.innerHTML = '';
    recommendationsList.innerHTML = `
        <p>To reduce your carbon footprint, consider:</p>
        <ul>
            <li>Switching to public transport or biking instead of using your car.</li>
            <li>Reducing electricity consumption by turning off unused appliances.</li>
            <li>Reducing meat consumption, especially beef, to lower your carbon footprint.</li>
        </ul>
    `;
}

// Render goals
function renderGoals() {
    goalsContainer.innerHTML = '';
    state.goals.forEach(goal => {
        const goalEl = document.createElement('div');
        goalEl.classList.add('goal-item');
        goalEl.innerHTML = `
            <h3>${goal.description}</h3>
            <p>Target: ${goal.target} kg CO2</p>
            <p>Progress: ${goal.current} kg CO2</p>
            <p>Deadline: ${goal.deadline}</p>
            <p>Status: ${goal.status}</p>
        `;
        goalsContainer.appendChild(goalEl);
    });
}

// Render tips
function renderTips() {
    tipsContainer.innerHTML = '';
    tipsContainer.innerHTML = `
        <p>Here are some tips to live a more eco-friendly life:</p>
        <ul>
            <li>Consider going vegetarian or vegan for a lower environmental impact.</li>
            <li>Buy locally-sourced products to reduce emissions from transportation.</li>
            <li>Consider installing solar panels for clean energy.</li>
        </ul>
    `;
}

// Initialize app
init();
