/* ==========================================
   NEXEVENT DATABASE LAYER (College Role Schema)
   ========================================== */

const STORAGE_KEYS = {
    USERS: 'nexevent_users',
    EVENTS: 'nexevent_events',
    APPLICATIONS: 'nexevent_applications',
    NOTIFICATIONS: 'nexevent_notifications'
};

// --- DATA ACCESS HELPERS ---
function getFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        const parsed = JSON.parse(data);
        return parsed !== null ? parsed : defaultValue;
    } catch (e) {
        console.error("Corrupted key in localStorage:", key, e);
        localStorage.removeItem(key);
        return defaultValue;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// --- INITIAL DATA BOOTSTRAP ---
function bootstrapData() {
    // 1. Initial College Role Directory
    let users = getFromStorage(STORAGE_KEYS.USERS);
    
    const pres = users.find(u => u.email === 'president@clg.com');
    const vp   = users.find(u => u.email === 'vp@clg.com');
    const tl   = users.find(u => u.email === 'tl@clg.com');
    const mgr  = users.find(u => u.email === 'mgr@clg.com');
    const std  = users.find(u => u.email === 'student@clg.com');

    // Re-seed if empty, has old 'admin' role, has outdated passwords, or missing any pre-set account
    if (users.length === 0 || 
        users.find(u => u.role === 'admin') || 
        users.find(u => u.password === 'password123') ||
        !pres || pres.password !== 'Pres@2026' ||
        !vp || vp.password !== 'VP@2026' ||
        !tl || tl.password !== 'TL@2026' ||
        !mgr || mgr.password !== 'Mgr@2026' ||
        !std || std.password !== 'Student@2026'
    ) {
        users = [
            { 
                id: 'usr_pres', 
                name: 'President Alex', 
                email: 'president@clg.com', 
                password: 'Pres@2026', 
                role: 'president',
                rollNumber: 'PRES-01',
                department: 'Student Council',
                phone: '9876543210'
            },
            { 
                id: 'usr_vp', 
                name: 'VP Sarah', 
                email: 'vp@clg.com', 
                password: 'VP@2026', 
                role: 'vicepresident',
                rollNumber: 'VP-02',
                department: 'Student Council',
                phone: '9876543211'
            },
            { 
                id: 'usr_tl1', 
                name: 'TL Charlie', 
                email: 'tl@clg.com', 
                password: 'TL@2026', 
                role: 'teamleader',
                rollNumber: 'TL-101',
                department: 'Computer Science',
                phone: '9876543212'
            },
            { 
                id: 'usr_mgr1', 
                name: 'Manager Diana', 
                email: 'mgr@clg.com', 
                password: 'Mgr@2026', 
                role: 'manager',
                rollNumber: 'MGR-201',
                department: 'Electronics',
                phone: '9876543213'
            },
            { 
                id: 'usr_student1', 
                name: 'Student Alice', 
                email: 'student@clg.com', 
                password: 'Student@2026', 
                role: 'user',
                rollNumber: 'CS-402',
                department: 'Computer Science',
                phone: '9876543214'
            }
        ];
        saveToStorage(STORAGE_KEYS.USERS, users);
    }

    // 2. Initial Sample Events with Coordinator Assignments
    let events = getFromStorage(STORAGE_KEYS.EVENTS);
    if (events.length === 0 || !events[0].hasOwnProperty('coordinatorId')) {
        events = [
            {
                id: 'evt_1',
                title: 'Inter-College Hackathon 2026',
                category: 'Tech',
                date: '2026-07-15',
                time: '09:00',
                location: 'College Seminar Hall & Tech Lab',
                banner: 'tech1',
                description: '24-hour coding challenge. Show off your software engineering and artificial intelligence compilation skills. Hosted by the CS Student Council chapter.',
                capacity: 100,
                registeredCount: 0,
                coordinatorId: 'usr_tl1' // Assigned to TL Charlie
            },
            {
                id: 'evt_2',
                title: 'Neon Beats Culturals 2026',
                category: 'Music',
                date: '2026-07-28',
                time: '18:00',
                location: 'Open Air Theater Auditorium',
                banner: 'music1',
                description: 'The annual inter-college music and dance extravaganza. Spectacular lighting configurations, live performances, and food stalls.',
                capacity: 50,
                registeredCount: 0,
                coordinatorId: 'usr_mgr1' // Assigned to Manager Diana
            },
            {
                id: 'evt_3',
                title: 'Youth Entrepreneurship Summit',
                category: 'Business',
                date: '2026-08-05',
                time: '14:00',
                location: 'College Conference Hall',
                banner: 'business1',
                description: 'Pitch your business prototype ideas to startup founders and venture capital firms. Win development grants up to $5000.',
                capacity: 120,
                registeredCount: 0,
                coordinatorId: 'usr_tl1' // Assigned to TL Charlie
            }
        ];
        saveToStorage(STORAGE_KEYS.EVENTS, events);
    }

    // 3. Initial Applications Mock
    let applications = getFromStorage(STORAGE_KEYS.APPLICATIONS);
    if (applications.length === 0 || applications.find(a => a.userId === 'usr_1')) {
        applications = [
            { id: 'app_1', userId: 'usr_student1', eventId: 'evt_1', dateApplied: '2026-06-29T10:15:30.000Z', status: 'approved' },
            { id: 'app_2', userId: 'usr_student1', eventId: 'evt_2', dateApplied: '2026-06-29T11:40:00.000Z', status: 'pending' }
        ];
        saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
        
        // Sync active count for approved event
        const evt1 = events.find(e => e.id === 'evt_1');
        if (evt1) {
            evt1.registeredCount = 1;
            saveToStorage(STORAGE_KEYS.EVENTS, events);
        }
    }

    // 4. Initial Notifications Mock
    let notifications = getFromStorage(STORAGE_KEYS.NOTIFICATIONS);
    if (notifications.length === 0 || notifications.find(n => n.userId === 'usr_1')) {
        notifications = [
            {
                id: 'notif_1',
                userId: 'usr_student1',
                eventId: 'evt_1',
                title: 'Application Selected',
                message: 'Your registration application for "Inter-College Hackathon 2026" has been APPROVED by the Council. Your pass is ready.',
                dateCreated: '2026-06-29T12:00:00.000Z',
                read: false
            }
        ];
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
}

// Call immediately on loading script
bootstrapData();

// --- EVENTS MANAGEMENT CRUD ---
function getEvents() {
    return getFromStorage(STORAGE_KEYS.EVENTS);
}

function saveEvents(events) {
    saveToStorage(STORAGE_KEYS.EVENTS, events);
}

function addEvent(eventData) {
    const events = getEvents();
    const newEvent = {
        id: 'evt_' + Date.now(),
        title: eventData.title,
        category: eventData.category,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        banner: eventData.banner,
        description: eventData.description,
        capacity: parseInt(eventData.capacity) || 50,
        registeredCount: 0,
        coordinatorId: eventData.coordinatorId || '' // Assigned Team Leader/Manager
    };
    events.push(newEvent);
    saveEvents(events);
    return newEvent;
}

function deleteEvent(eventId) {
    let events = getEvents();
    events = events.filter(e => e.id !== eventId);
    saveEvents(events);

    // Clean up applications related to deleted event
    let apps = getApplications();
    apps = apps.filter(a => a.eventId !== eventId);
    saveApplications(apps);
}

// Get events assigned to a specific coordinator
function getEventsForCoordinator(coordId) {
    const events = getEvents();
    return events.filter(e => e.coordinatorId === coordId);
}

// --- USERS MANAGEMENT ---
function getUsers() {
    return getFromStorage(STORAGE_KEYS.USERS);
}

function saveUsers(users) {
    saveToStorage(STORAGE_KEYS.USERS, users);
}

function getCoordinators() {
    const users = getUsers();
    return users.filter(u => u.role === 'teamleader' || u.role === 'manager');
}

function registerUser(userData) {
    const users = getUsers();

    // SECURITY: Only students (role='user') may self-register.
    // Council and coordinator accounts are pre-set and cannot be created via the portal.
    const allowedSelfRegisterRoles = ['user'];
    if (!allowedSelfRegisterRoles.includes(userData.role)) {
        throw new Error('Council and coordinator accounts are pre-set. Only students may register here.');
    }

    // Check if email already registered
    const existingEmail = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingEmail) {
        throw new Error('Email is already registered on the portal.');
    }

    // Check if Roll Number already registered
    const existingRoll = users.find(u => u.rollNumber && u.rollNumber.toUpperCase() === userData.rollNumber.toUpperCase());
    if (existingRoll) {
        throw new Error(`Roll Number "${userData.rollNumber}" is already registered.`);
    }

    const newUser = {
        id: 'usr_' + Date.now(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: 'user', // Always force 'user' regardless of submitted value
        rollNumber: userData.rollNumber.toUpperCase(),
        department: userData.department,
        phone: userData.phone
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// --- APPLICATIONS & REGISTRATION LOGIC ---
function getApplications() {
    return getFromStorage(STORAGE_KEYS.APPLICATIONS);
}

function saveApplications(apps) {
    saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);
}

function applyForEvent(userId, eventId) {
    const apps = getApplications();
    const events = getEvents();
    
    // 1. Find event and check capacity
    const event = events.find(e => e.id === eventId);
    if (!event) {
        throw new Error('Event does not exist.');
    }
    if (event.registeredCount >= event.capacity) {
        throw new Error('This event is already fully booked.');
    }

    // 2. Check if user already applied to this specific event
    const alreadyApplied = apps.find(a => a.userId === userId && a.eventId === eventId);
    if (alreadyApplied) {
        throw new Error(`You have already applied for this event. Current Status: ${alreadyApplied.status.toUpperCase()}`);
    }

    // 3. ENFORCE USER EVENT LIMIT RULE: Maximum 2 applications total
    const userApps = apps.filter(a => a.userId === userId);
    if (userApps.length >= 2) {
        throw new Error('Application Limit Reached: You are only allowed to apply for a maximum of 2 college events.');
    }

    // 4. Create application
    const newApp = {
        id: 'app_' + Date.now(),
        userId: userId,
        eventId: eventId,
        dateApplied: new Date().toISOString(),
        status: 'pending' // Defaults to pending organizer review
    };
    apps.push(newApp);
    saveApplications(apps);

    return newApp;
}

function processApplication(applicationId, newStatus) {
    const apps = getApplications();
    const events = getEvents();
    
    const appIndex = apps.findIndex(a => a.id === applicationId);
    if (appIndex === -1) {
        throw new Error('Application not found.');
    }
    
    const app = apps[appIndex];
    const prevStatus = app.status;
    
    if (prevStatus === newStatus) return; // No change

    const event = events.find(e => e.id === app.eventId);
    if (!event) {
        throw new Error('Associated event not found.');
    }

    // Handle registration capacities
    if (newStatus === 'approved') {
        if (event.registeredCount >= event.capacity) {
            throw new Error('Cannot approve. The event is already at full capacity.');
        }
        event.registeredCount++;
    } else if (prevStatus === 'approved') {
        // Decrement capacity if moving away from approved state
        event.registeredCount = Math.max(0, event.registeredCount - 1);
    }

    // Update status
    app.status = newStatus;
    saveApplications(apps);
    saveEvents(events);

    // Trigger Notification to User
    const title = newStatus === 'approved' ? 'Application Selected' : 'Application Rejected';
    const message = newStatus === 'approved' 
        ? `Congratulations! Your application to participate in "${event.title}" has been SELECTED by the Student Council. Access your pass on the ticket portal.`
        : `We regret to inform you that your application for "${event.title}" was not selected. Keep checking for other events.`;
    
    sendNotification(app.userId, app.eventId, title, message);
}

// --- NOTIFICATIONS LAYER ---
function getNotifications() {
    return getFromStorage(STORAGE_KEYS.NOTIFICATIONS);
}

function saveNotifications(notifs) {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

function sendNotification(userId, eventId, title, message) {
    const notifs = getNotifications();
    const newNotif = {
        id: 'notif_' + Date.now(),
        userId: userId,
        eventId: eventId,
        title: title,
        message: message,
        dateCreated: new Date().toISOString(),
        read: false
    };
    notifs.unshift(newNotif); // Add to beginning (newest first)
    saveNotifications(notifs);
    return newNotif;
}

function getNotificationsForUser(userId) {
    const notifs = getNotifications();
    return notifs.filter(n => n.userId === userId);
}

function markAllNotificationsAsRead(userId) {
    const notifs = getNotifications();
    notifs.forEach(n => {
        if (n.userId === userId) n.read = true;
    });
    saveNotifications(notifs);
}

function clearUserNotifications(userId) {
    let notifs = getNotifications();
    notifs = notifs.filter(n => n.userId !== userId);
    saveNotifications(notifs);
}
