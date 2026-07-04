/* NEXEVENT MAIN CONTROLLER — College Role System*/

let currentUser = null;

// ── Live Clock ──
function initLiveClock() {
    const timeEl = document.getElementById('live-time');
    function updateClock() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString(undefined, {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ── Session Check ──
function checkActiveSession() {
    const storedUser = localStorage.getItem('nexevent_session');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            // Re-validate user still exists in storage
            const allUsers = getUsers();
            const freshUser = allUsers.find(u => u.id === currentUser.id);
            if (freshUser) {
                currentUser = freshUser;
                bootstrapLoggedInUser(currentUser);
            } else {
                localStorage.removeItem('nexevent_session');
                showAuthSection();
            }
        } catch (e) {
            localStorage.removeItem('nexevent_session');
            showAuthSection();
        }
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-layout').classList.add('hidden');
}

// ── Auth Tab Switcher ──
function switchAuthTab(tab) {
    const tabLogin    = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin   = document.getElementById('login-form');
    const formRegister= document.getElementById('register-form');

    if (tab === 'login') {
        tabLogin.classList.add('active');    tabRegister.classList.remove('active');
        formLogin.classList.add('active-form'); formRegister.classList.remove('active-form');
    } else {
        tabLogin.classList.remove('active'); tabRegister.classList.add('active');
        formLogin.classList.remove('active-form'); formRegister.classList.add('active-form');
    }
}

// ── Login Handler ──
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;

    const users = getUsers();
    const user  = users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === pass
    );

    if (user) {
        currentUser = user;
        localStorage.setItem('nexevent_session', JSON.stringify(user));
        document.getElementById('login-form').reset();
        showToast(`Welcome back, ${user.name}! 🎓`, 'success');
        bootstrapLoggedInUser(user);
    } else {
        showToast('Invalid email or password.', 'error');
    }
}

// ── Register Handler ──
function handleRegister(event) {
    event.preventDefault();

    const name      = document.getElementById('reg-name').value.trim();
    const email     = document.getElementById('reg-email').value.trim();
    const password  = document.getElementById('reg-password').value;
    const rollNumber= document.getElementById('reg-roll').value.trim();
    const phone     = document.getElementById('reg-phone').value.trim();
    const department= document.getElementById('reg-dept').value;
    const role      = document.querySelector('input[name="reg-role"]:checked').value;

    if (!rollNumber) { showToast('Roll Number / Staff ID is required.', 'error'); return; }
    if (!department) { showToast('Please select your department.', 'error'); return; }

    try {
        registerUser({ name, email, password, rollNumber, phone, department, role });
        showToast('🎉 Registered successfully! You can now sign in.', 'success');
        document.getElementById('register-form').reset();
        switchAuthTab('login');
        document.getElementById('login-email').value = email;
    } catch(e) {
        showToast(e.message, 'error');
    }
}

// ── Logout ──
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('nexevent_session');
    showToast('Signed out of session.', 'info');
    showAuthSection();
}

// ── Bootstrap user interface by role ──
function bootstrapLoggedInUser(user) {
    // 1. Show main layout
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-layout').classList.remove('hidden');

    // 2. Profile card info
    document.getElementById('user-display-name').textContent = user.name;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();

    // 3. Avatar gradient by role
    const avatar = document.getElementById('user-avatar');
    const avatarGrads = {
        president:    'linear-gradient(135deg, #f59e0b, #f97316)',
        vicepresident:'linear-gradient(135deg, #8b5cf6, #6366f1)',
        teamleader:   'linear-gradient(135deg, #06b6d4, #14b8a6)',
        manager:      'linear-gradient(135deg, #10b981, #34d399)',
        user:         'linear-gradient(135deg, #3b82f6, #6366f1)'
    };
    avatar.style.background = avatarGrads[user.role] || avatarGrads['user'];

    // 4. Role badge
    const meta = getRoleMeta(user.role);
    const roleBadge = document.getElementById('user-display-role');
    roleBadge.textContent = meta.label;
    roleBadge.style.background = meta.grad;
    roleBadge.style.color      = meta.color;
    roleBadge.style.border     = `1px solid ${meta.border}`;

    // 5. Nav groups: hide all, show relevant
    const userNavGroup    = document.getElementById('user-nav-links');
    const councilNavGroup = document.getElementById('council-nav-links');
    const coordNavGroup   = document.getElementById('coord-nav-links');

    userNavGroup.classList.add('hidden');
    councilNavGroup.classList.add('hidden');
    coordNavGroup.classList.add('hidden');

    if (isCouncil(user.role)) {
        councilNavGroup.classList.remove('hidden');
        navigateTo('admin-dashboard');
    } else if (isCoordinator(user.role)) {
        coordNavGroup.classList.remove('hidden');
        navigateTo('coord-dashboard');
    } else {
        // Regular student
        userNavGroup.classList.remove('hidden');
        navigateTo('user-dashboard');
    }

    // 6. Update badge counters
    updateBadges();
}

// ── DOMContentLoaded Initializer ──
document.addEventListener('DOMContentLoaded', () => {
    initLiveClock();
    checkActiveSession();
});
