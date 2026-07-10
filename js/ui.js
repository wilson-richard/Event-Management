/* ==========================================
   NEXEVENT UI RENDERING — College Role System
   ========================================== */

// ── Role utilities ──
const ROLE_META = {
    president:    { label: 'PRESIDENT',    icon: 'fa-crown',        color: '#fcd34d', grad: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(249,115,22,0.15))', border: 'rgba(245,158,11,0.45)' },
    vicepresident:{ label: 'VICE PRESIDENT',icon:'fa-medal',        color: '#c4b5fd', grad: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.15))', border: 'rgba(139,92,246,0.45)' },
    teamleader:   { label: 'TEAM LEADER',  icon: 'fa-people-group', color: '#67e8f9', grad: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(20,184,166,0.15))', border: 'rgba(6,182,212,0.45)' },
    manager:      { label: 'MANAGER',      icon: 'fa-briefcase',    color: '#6ee7b7', grad: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(52,211,153,0.15))', border: 'rgba(16,185,129,0.45)' },
    user:         { label: 'STUDENT',      icon: 'fa-user-graduate',color: '#93c5fd', grad: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(99,102,241,0.15))', border: 'rgba(59,130,246,0.45)' }
};

function getRoleMeta(role) {
    return ROLE_META[role] || ROLE_META['user'];
}

function isCouncil(role) {
    return role === 'president' || role === 'vicepresident';
}

function isCoordinator(role) {
    return role === 'teamleader' || role === 'manager';
}

// ── Global navigation router ──
function navigateTo(panelId) {
    const panels = document.querySelectorAll('.content-panel');
    panels.forEach(p => p.classList.remove('active-panel'));

    const activePanel = document.getElementById(`panel-${panelId}`);
    if (activePanel) activePanel.classList.add('active-panel');

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const onclick = link.getAttribute('onclick') || '';
        if (onclick.includes(`'${panelId}'`)) link.classList.add('active');
    });

    const titleEl = document.getElementById('page-title');
    const descEl  = document.getElementById('page-description');

    switch (panelId) {
        case 'user-dashboard':
            titleEl.textContent = 'Student Dashboard';
            descEl.textContent  = 'Track your registrations, entry passes, and campus notifications.';
            renderUserDashboard();
            break;
        case 'browse-events':
            titleEl.textContent = 'Campus Events';
            descEl.textContent  = 'Browse, discover, and apply for upcoming college events.';
            renderEventCatalog();
            break;
        case 'my-applications':
            titleEl.textContent = 'My Applications';
            descEl.textContent  = 'Review status updates on events you applied to.';
            renderUserApplications();
            break;
        case 'user-notifications':
            titleEl.textContent = 'Notifications';
            descEl.textContent  = 'Messages and updates from the Student Council.';
            renderUserNotifications();
            if (currentUser) {
                markAllNotificationsAsRead(currentUser.id);
                updateBadges();
            }
            break;
        // Council (President / VP)
        case 'admin-dashboard':
            titleEl.textContent = 'Council Overview';
            descEl.textContent  = 'Platform analytics — events, members, and pending requests.';
            renderAdminDashboard();
            break;
        case 'manage-events':
            titleEl.textContent = 'Manage Events';
            descEl.textContent  = 'Publish new campus events and assign coordinators.';
            renderAdminEventsList();
            populateCoordinatorDropdown();
            break;
        case 'review-applications':
            titleEl.textContent = 'Review Applications';
            descEl.textContent  = 'Approve or reject student registration requests.';
            renderAdminReviews();
            break;
        case 'manage-users':
            titleEl.textContent = 'Member Directory';
            descEl.textContent  = 'Manage all student and staff accounts.';
            renderAdminUsers();
            break;
        // Coordinator (TL / Manager)
        case 'coord-dashboard':
            titleEl.textContent = 'My Assigned Events';
            descEl.textContent  = 'Overview of events you are coordinating.';
            renderCoordinatorDashboard();
            break;
        case 'coord-roster':
            titleEl.textContent = 'Attendee Rosters';
            descEl.textContent  = 'View approved student lists for each coordinated event.';
            renderCoordinatorRosterPage();
            break;
    }

    // Auto-close mobile navigation drawer
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-active');
}

// ── Toast notifications ──
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error')   iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Sidebar badge counters ──
function updateBadges() {
    if (!currentUser) return;

    if (isCouncil(currentUser.role)) {
        const apps = getApplications();
        const pendingCount = apps.filter(a => a.status === 'pending').length;
        const pendingBadge = document.getElementById('nav-pending-badge');
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount;
            pendingCount > 0 ? pendingBadge.classList.remove('hidden') : pendingBadge.classList.add('hidden');
        }
    } else if (currentUser.role === 'user') {
        const notifs = getNotificationsForUser(currentUser.id);
        const unreadCount = notifs.filter(n => !n.read).length;
        const notifBadge = document.getElementById('nav-notif-badge');
        if (notifBadge) {
            notifBadge.textContent = unreadCount;
            unreadCount > 0 ? notifBadge.classList.remove('hidden') : notifBadge.classList.add('hidden');
        }
    }
}

// ─────────────────────────────────────────
// STUDENT (USER) MODULE
// ─────────────────────────────────────────

function renderUserDashboard() {
    if (!currentUser) return;

    const apps    = getApplications();
    const userApps = apps.filter(a => a.userId === currentUser.id);
    const approvedCount = userApps.filter(a => a.status === 'approved').length;
    const pendingCount  = userApps.filter(a => a.status === 'pending').length;

    document.getElementById('user-stat-applied').textContent  = `${userApps.length} / 2`;
    document.getElementById('user-stat-approved').textContent = approvedCount;
    document.getElementById('user-stat-pending').textContent  = pendingCount;

    // Approved Passes
    const ticketsContainer = document.getElementById('user-dashboard-tickets');
    const approvedApps = userApps.filter(a => a.status === 'approved');
    const events = getEvents();

    if (approvedApps.length > 0) {
        ticketsContainer.innerHTML = '';
        approvedApps.forEach(app => {
            const event = events.find(e => e.id === app.eventId);
            if (!event) return;
            const card = document.createElement('div');
            card.className = 'glass-card border-glow';
            card.style.cssText = 'padding:1rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;';
            card.innerHTML = `
                <div>
                    <h4 style="font-weight:700; font-size:0.95rem;">${event.title}</h4>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
                        <i class="fa-regular fa-calendar-days text-primary"></i> ${event.date} at ${event.time}
                    </p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="viewTicket('${app.id}')">
                    <i class="fa-solid fa-ticket"></i> View Pass
                </button>
            `;
            ticketsContainer.appendChild(card);
        });
    } else {
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ticket-simple"></i>
                <p>No approved passes yet. Apply for events to get entry tickets.</p>
            </div>
        `;
    }

    // Recent Notifications
    const notifsContainer = document.getElementById('user-dashboard-notifs');
    const userNotifs = getNotificationsForUser(currentUser.id).slice(0, 3);

    if (userNotifs.length > 0) {
        notifsContainer.innerHTML = '';
        userNotifs.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.read ? '' : 'notif-unread'}`;
            item.style.padding = '0.75rem';
            let icon = 'fa-bell', iconClass = 'system-icon';
            if (n.title.includes('Selected') || n.title.includes('Approved')) { icon = 'fa-circle-check'; iconClass = 'approved-icon'; }
            else if (n.title.includes('Rejected')) { icon = 'fa-circle-xmark'; iconClass = 'rejected-icon'; }
            item.innerHTML = `
                <div class="notif-icon ${iconClass}" style="width:30px;height:30px;font-size:0.8rem;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="notif-content">
                    <h5 style="font-size:0.85rem;font-weight:700;">${n.title}</h5>
                    <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.1rem;">${n.message}</p>
                </div>
            `;
            notifsContainer.appendChild(item);
        });
    } else {
        notifsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-bell"></i>
                <p>You're all caught up! No recent notifications.</p>
            </div>
        `;
    }
}

function renderEventCatalog() {
    const container = document.getElementById('events-grid-container');
    const events    = getEvents();
    const apps      = getApplications();
    const userApps  = currentUser ? apps.filter(a => a.userId === currentUser.id) : [];
    const users     = getUsers();

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>No active events scheduled on campus right now.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    events.forEach(evt => {
        const percentage = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
        const userApp = userApps.find(a => a.eventId === evt.id);
        const coordinator = users.find(u => u.id === evt.coordinatorId);

        let buttonHTML = '';
        if (userApp) {
            let badgeClass = 'btn-secondary', iconClass = 'fa-clock', textStr = 'Applied - Pending';
            if (userApp.status === 'approved')  { badgeClass = 'btn-primary';   iconClass = 'fa-circle-check'; textStr = 'Approved ✓'; }
            if (userApp.status === 'rejected')  { badgeClass = 'btn-secondary'; iconClass = 'fa-circle-xmark'; textStr = 'Not Selected'; }
            buttonHTML = `<button class="btn ${badgeClass} btn-sm" onclick="event.stopPropagation(); navigateTo('my-applications')">
                <i class="fa-solid ${iconClass}"></i> ${textStr}
            </button>`;
        } else if (evt.registeredCount >= evt.capacity) {
            buttonHTML = `<button class="btn btn-secondary btn-sm" disabled>Sold Out</button>`;
        } else {
            const isCoordOrCouncil = currentUser && (isCouncil(currentUser.role) || isCoordinator(currentUser.role));
            if (isCoordOrCouncil) {
                buttonHTML = `<button class="btn btn-secondary btn-sm" disabled title="Council/Coordinators do not register as attendees">Council Role</button>`;
            } else {
                buttonHTML = `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); triggerApply('${evt.id}')">
                    <i class="fa-solid fa-paper-plane"></i> Apply
                </button>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'event-card';
        card.onclick = () => showEventDetails(evt.id);

        card.innerHTML = `
            <div class="event-banner-img ${evt.banner || 'tech1'}-bg">
                <span class="event-category-badge">${evt.category}</span>
                <span class="event-capacity-badge">${evt.registeredCount} / ${evt.capacity}</span>
                <h2>${evt.title}</h2>
            </div>
            <div class="event-card-body">
                <h3>${evt.title}</h3>
                <div class="event-card-meta">
                    <div><i class="fa-regular fa-calendar"></i><span>${evt.date}</span></div>
                    <div><i class="fa-regular fa-clock"></i><span>${evt.time}</span></div>
                    <div><i class="fa-solid fa-location-dot"></i><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${evt.location}</span></div>
                    ${coordinator ? `<div><i class="fa-solid fa-user-tie"></i><span>${coordinator.name} (${getRoleMeta(coordinator.role).label})</span></div>` : ''}
                </div>
                <p class="event-description-summary">${evt.description}</p>
                <div class="event-card-footer">
                    <div class="capacity-progress-container">
                        <div class="progress-text">Capacity: ${percentage}%</div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width:${percentage}%"></div>
                        </div>
                    </div>
                    ${buttonHTML}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterEventsList() {
    const searchVal = document.getElementById('search-events-input').value.toLowerCase();
    const catVal    = document.getElementById('filter-category').value;
    const statusVal = document.getElementById('filter-status').value;

    const cards = document.querySelectorAll('#events-grid-container .event-card');
    let hasVisible = false;

    cards.forEach(card => {
        const title    = card.querySelector('h3').textContent.toLowerCase();
        const desc     = card.querySelector('.event-description-summary').textContent.toLowerCase();
        const category = card.querySelector('.event-category-badge').textContent;
        const dateEl   = card.querySelector('.fa-calendar');
        const dateStr  = dateEl ? dateEl.nextSibling.textContent.trim() : '';
        const today    = new Date().toISOString().split('T')[0];

        const matchesSearch = title.includes(searchVal) || desc.includes(searchVal);
        const matchesCat    = catVal === 'all' || category.toLowerCase() === catVal.toLowerCase();
        let matchesStatus   = true;
        if (statusVal === 'upcoming') matchesStatus = dateStr > today;
        else if (statusVal === 'today') matchesStatus = dateStr === today;

        if (matchesSearch && matchesCat && matchesStatus) {
            card.classList.remove('hidden');
            hasVisible = true;
        } else {
            card.classList.add('hidden');
        }
    });

    const emptyEl = document.getElementById('grid-filter-empty');
    if (!hasVisible) {
        if (!emptyEl) {
            const empty = document.createElement('div');
            empty.id = 'grid-filter-empty';
            empty.className = 'empty-state';
            empty.style.gridColumn = '1 / -1';
            empty.innerHTML = `<i class="fa-solid fa-magnifying-glass-minus"></i><p>No events match your filter parameters.</p>`;
            document.getElementById('events-grid-container').appendChild(empty);
        }
    } else if (emptyEl) {
        emptyEl.remove();
    }
}

function renderUserApplications() {
    if (!currentUser) return;

    const apps     = getApplications();
    const userApps = apps.filter(a => a.userId === currentUser.id);
    const events   = getEvents();
    const users    = getUsers();

    const tbody      = document.getElementById('my-apps-tbody');
    const emptyState = document.getElementById('my-apps-empty');

    if (userApps.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    userApps.forEach(app => {
        const event = events.find(e => e.id === app.eventId);
        if (!event) return;

        const coordinator = users.find(u => u.id === event.coordinatorId);
        const appliedDate = new Date(app.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        let statusClass = 'pending';
        let actionHTML = '<span style="color:var(--text-muted)">Awaiting decision</span>';

        if (app.status === 'approved') {
            statusClass = 'approved';
            actionHTML = `<button class="btn btn-primary btn-sm" onclick="viewTicket('${app.id}')">
                <i class="fa-solid fa-ticket"></i> View Pass
            </button>`;
        } else if (app.status === 'rejected') {
            statusClass = 'rejected';
            actionHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="${event.banner}-bg" style="width:80px;height:44px;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:0.6rem;font-weight:800;color:white;text-shadow:0 1px 4px rgba(0,0,0,0.6);">${event.category}</span>
                </div>
            </td>
            <td style="font-weight:700;">${event.title}</td>
            <td>
                <div style="font-size:0.85rem;">
                    <div><i class="fa-regular fa-calendar text-primary"></i> ${event.date}</div>
                    <div class="text-muted" style="margin-top:0.15rem;"><i class="fa-regular fa-clock"></i> ${event.time}</div>
                </div>
            </td>
            <td style="font-size:0.82rem; color:var(--text-secondary);">
                ${coordinator ? `<i class="fa-solid fa-user-tie"></i> ${coordinator.name}` : '—'}
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fa-solid ${app.status === 'approved' ? 'fa-check' : app.status === 'rejected' ? 'fa-xmark' : 'fa-hourglass-start'}"></i>
                    ${app.status}
                </span>
            </td>
            <td>${actionHTML}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUserNotifications() {
    if (!currentUser) return;

    const notifs    = getNotificationsForUser(currentUser.id);
    const container = document.getElementById('notifications-timeline');

    if (notifs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-bell-slash"></i>
                <p>Your notification tray is empty.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    notifs.forEach(n => {
        const item = document.createElement('div');
        item.className = `notif-item ${n.read ? '' : 'notif-unread'}`;

        let icon = 'fa-bell', iconClass = 'system-icon';
        if (n.title.includes('Selected') || n.title.includes('Approved')) { icon = 'fa-check'; iconClass = 'approved-icon'; }
        else if (n.title.includes('Rejected')) { icon = 'fa-xmark'; iconClass = 'rejected-icon'; }

        const timeStr = new Date(n.dateCreated).toLocaleString();

        item.innerHTML = `
            <div class="notif-icon ${iconClass}">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="notif-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="notif-time">${timeStr}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function clearAllNotifications() {
    if (currentUser) {
        clearUserNotifications(currentUser.id);
        renderUserNotifications();
        updateBadges();
        showToast('Notification tray cleared.', 'info');
    }
}

function triggerApply(eventId) {
    if (!currentUser) { showToast('Please log in to apply for events.', 'error'); return; }
    try {
        applyForEvent(currentUser.id, eventId);
        showToast('Application submitted! Awaiting council review.', 'success');
        renderEventCatalog();
        updateBadges();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ─────────────────────────────────────────
// COUNCIL (PRESIDENT / VP) MODULE
// ─────────────────────────────────────────

function renderAdminDashboard() {
    const events  = getEvents();
    const users   = getUsers();
    const apps    = getApplications();
    const pending = apps.filter(a => a.status === 'pending');

    document.getElementById('admin-stat-events').textContent  = events.length;
    document.getElementById('admin-stat-users').textContent   = users.length;
    document.getElementById('admin-stat-pending').textContent = pending.length;

    // Pending quick action list
    const reviewContainer = document.getElementById('admin-dashboard-reviews');
    if (pending.length > 0) {
        reviewContainer.innerHTML = '';
        pending.slice(0, 3).forEach(app => {
            const user  = users.find(u => u.id === app.userId);
            const event = events.find(e => e.id === app.eventId);
            if (!user || !event) return;

            const div = document.createElement('div');
            div.className = 'glass-card border-glow';
            div.style.cssText = 'padding:1rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;';
            div.innerHTML = `
                <div>
                    <h5 style="font-weight:700; font-size:0.9rem;">${user.name}</h5>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.1rem;">
                        wants to attend <strong>${event.title}</strong>
                    </p>
                </div>
                <div class="action-buttons-group">
                    <button class="action-btn approve-btn" onclick="adminQuickDecision('${app.id}', 'approved')" title="Approve">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="action-btn reject-btn" onclick="adminQuickDecision('${app.id}', 'rejected')" title="Reject">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
            reviewContainer.appendChild(div);
        });
    } else {
        reviewContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-check text-success"></i>
                <p>All clear! No pending applications to review.</p>
            </div>
        `;
    }

    // Top events popularity bar chart
    const topEventsContainer = document.getElementById('admin-dashboard-top-events');
    topEventsContainer.innerHTML = '';
    const sortedEvents = [...events].sort((a,b) => b.registeredCount - a.registeredCount).slice(0, 4);

    sortedEvents.forEach(evt => {
        const percent  = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
        const coordinator = users.find(u => u.id === evt.coordinatorId);
        const barItem = document.createElement('div');
        barItem.style.marginBottom = '1rem';
        barItem.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.3rem;">
                <span style="font-weight:700; max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${evt.title}</span>
                <span style="color:var(--text-muted);">${evt.registeredCount}/${evt.capacity}</span>
            </div>
            <div class="progress-bar-bg" style="height:7px;">
                <div class="progress-bar-fill" style="width:${percent}%;"></div>
            </div>
            ${coordinator ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.2rem;"><i class="fa-solid fa-user-tie"></i> ${coordinator.name}</div>` : ''}
        `;
        topEventsContainer.appendChild(barItem);
    });
}

function adminQuickDecision(appId, decision) {
    try {
        processApplication(appId, decision);
        showToast(`Request ${decision === 'approved' ? '✅ Approved' : '❌ Rejected'}!`, 'success');
        renderAdminDashboard();
        updateBadges();
    } catch(e) {
        showToast(e.message, 'error');
    }
}

function populateCoordinatorDropdown() {
    const select = document.getElementById('event-coordinator');
    if (!select) return;
    const coordinators = getCoordinators();
    select.innerHTML = '<option value="">Select Coordinator</option>';
    coordinators.forEach(c => {
        const meta = getRoleMeta(c.role);
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${meta.label})`;
        select.appendChild(opt);
    });
}

function renderAdminEventsList() {
    const container = document.getElementById('admin-event-listings');
    const events    = getEvents();
    const users     = getUsers();

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-minus"></i>
                <p>No events published yet. Use the form to create one.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    events.forEach(evt => {
        const coordinator = users.find(u => u.id === evt.coordinatorId);
        const div = document.createElement('div');
        div.className = 'admin-listing-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:1rem;">
                <div class="${evt.banner}-bg" style="width:50px;height:36px;border-radius:6px;flex-shrink:0;"></div>
                <div class="admin-listing-info">
                    <h4>${evt.title}</h4>
                    <p>
                        <span class="badge" style="background:rgba(255,255,255,0.05); color:white;">${evt.category}</span>
                        <i class="fa-regular fa-calendar" style="margin-left:0.5rem;"></i> ${evt.date}
                        <i class="fa-regular fa-clock" style="margin-left:0.5rem;"></i> ${evt.time}
                        ${coordinator ? `<i class="fa-solid fa-user-tie" style="margin-left:0.5rem;color:var(--violet);"></i> ${coordinator.name}` : ''}
                    </p>
                </div>
            </div>
            <button class="action-btn delete-btn" onclick="handleDeleteEvent('${evt.id}')" title="Delete event">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function handleCreateEvent(event) {
    event.preventDefault();

    const coordinatorId = document.getElementById('event-coordinator').value;
    const eventData = {
        title:       document.getElementById('event-title').value,
        category:    document.getElementById('event-category').value,
        capacity:    document.getElementById('event-capacity').value,
        date:        document.getElementById('event-date').value,
        time:        document.getElementById('event-time').value,
        location:    document.getElementById('event-location').value,
        banner:      document.querySelector('input[name="event-banner"]:checked').value,
        description: document.getElementById('event-desc').value,
        coordinatorId
    };

    try {
        addEvent(eventData);
        showToast('🎉 Event published and coordinator assigned!', 'success');
        document.getElementById('create-event-form').reset();
        renderAdminEventsList();
    } catch(e) {
        showToast(e.message, 'error');
    }
}

function handleDeleteEvent(eventId) {
    if (confirm('Delete this event? All student registrations for this event will be removed.')) {
        deleteEvent(eventId);
        showToast('Event removed from campus listings.', 'info');
        renderAdminEventsList();
    }
}

function renderAdminReviews() {
    const apps   = getApplications();
    const events = getEvents();
    const users  = getUsers();
    const tbody  = document.getElementById('admin-reviews-tbody');
    const emptyState = document.getElementById('admin-reviews-empty');

    if (apps.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    apps.forEach(app => {
        const user  = users.find(u => u.id === app.userId);
        const event = events.find(e => e.id === app.eventId);
        if (!user || !event) return;

        const tr = document.createElement('tr');
        const appliedDate = new Date(app.dateApplied).toLocaleDateString();

        let actionsHTML = '';
        if (app.status === 'pending') {
            actionsHTML = `
                <div class="action-buttons-group">
                    <button class="btn btn-primary btn-sm" onclick="processReviewRequest('${app.id}', 'approved')">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="processReviewRequest('${app.id}', 'rejected')">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            `;
        } else {
            actionsHTML = `<span style="color:var(--text-muted);"><i class="fa-solid fa-lock"></i> Finalized</span>`;
        }

        const meta = getRoleMeta(user.role);
        tr.innerHTML = `
            <td>
                <div style="font-weight:700;">${user.name}</div>
                <div style="font-size:0.73rem; color:var(--text-muted); margin-top:0.1rem;">${user.email}</div>
                <div style="font-size:0.73rem; margin-top:0.2rem;">
                    <span class="badge" style="background:${meta.grad}; color:${meta.color}; border:1px solid ${meta.border};">
                        ${meta.label}
                    </span>
                </div>
            </td>
            <td>
                <div style="font-weight:600;">${event.title}</div>
                <div style="font-size:0.73rem; color:var(--text-secondary); margin-top:0.1rem;">
                    Capacity: ${event.registeredCount} / ${event.capacity}
                </div>
            </td>
            <td style="color:var(--text-muted);">${appliedDate}</td>
            <td>
                <span class="status-badge ${app.status}">
                    <i class="fa-solid ${app.status === 'approved' ? 'fa-check' : app.status === 'rejected' ? 'fa-xmark' : 'fa-hourglass-start'}"></i>
                    ${app.status}
                </span>
            </td>
            <td>${actionsHTML}</td>
        `;
        tbody.appendChild(tr);
    });
}

function processReviewRequest(appId, decision) {
    try {
        processApplication(appId, decision);
        showToast(`Request updated to: ${decision.toUpperCase()}`, 'success');
        renderAdminReviews();
        updateBadges();
    } catch(e) {
        showToast(e.message, 'error');
    }
}

function renderAdminUsers() {
    const users = getUsers();
    const apps  = getApplications();
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
        const userApps = apps.filter(a => a.userId === u.id);
        const meta = getRoleMeta(u.role);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; color:var(--text-muted);">${u.rollNumber || '—'}</td>
            <td style="font-weight:700;">${u.name}</td>
            <td>
                <div style="font-size:0.85rem;">${u.email}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${u.phone || ''}</div>
            </td>
            <td>
                <span class="badge" style="background:${meta.grad}; color:${meta.color}; border:1px solid ${meta.border};">
                    <i class="fa-solid ${meta.icon}"></i> ${meta.label}
                </span>
            </td>
            <td style="color:var(--text-secondary);">${u.department || '—'}</td>
            <td style="font-weight:700;">
                ${(u.role === 'user') ? `${userApps.length} / 2` : '<span style="color:var(--text-muted);">N/A</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ─────────────────────────────────────────
// COORDINATOR (TL / MANAGER) MODULE
// ─────────────────────────────────────────

function renderCoordinatorDashboard() {
    if (!currentUser) return;

    const assignedEvents = getEventsForCoordinator(currentUser.id);
    const apps  = getApplications();
    const users = getUsers();

    // Stats
    document.getElementById('coord-stat-events').textContent = assignedEvents.length;
    const totalApproved = assignedEvents.reduce((sum, evt) => {
        return sum + apps.filter(a => a.eventId === evt.id && a.status === 'approved').length;
    }, 0);
    document.getElementById('coord-stat-attendees').textContent = totalApproved;

    // Assigned event cards
    const grid = document.getElementById('coord-assigned-events-grid');
    if (assignedEvents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fa-solid fa-compass"></i>
                <p>No events have been assigned to you yet by the Student Council.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    assignedEvents.forEach(evt => {
        const evtApps = apps.filter(a => a.eventId === evt.id);
        const approvedCount = evtApps.filter(a => a.status === 'approved').length;
        const pendingCount  = evtApps.filter(a => a.status === 'pending').length;
        const percentage = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));

        const card = document.createElement('div');
        card.className = 'coord-event-card';
        card.innerHTML = `
            <div class="event-banner-img ${evt.banner}-bg" style="height:100px; border-radius:10px; margin-bottom:1rem;">
                <span class="event-category-badge">${evt.category}</span>
                <h2 style="font-size:1rem;">${evt.title}</h2>
            </div>
            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:0.75rem;">
                <div style="font-size:0.82rem;"><i class="fa-regular fa-calendar" style="color:var(--violet);"></i> ${evt.date}</div>
                <div style="font-size:0.82rem;"><i class="fa-regular fa-clock" style="color:var(--cyan);"></i> ${evt.time}</div>
                <div style="font-size:0.82rem;"><i class="fa-solid fa-location-dot" style="color:var(--pink);"></i> ${evt.location}</div>
            </div>
            <div style="display:flex; gap:0.75rem; margin-bottom:0.75rem;">
                <span class="status-badge approved"><i class="fa-solid fa-check"></i> ${approvedCount} Approved</span>
                <span class="status-badge pending"><i class="fa-solid fa-hourglass-start"></i> ${pendingCount} Pending</span>
            </div>
            <div class="progress-bar-bg" style="height:6px;">
                <div class="progress-bar-fill" style="width:${percentage}%;"></div>
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Capacity: ${evt.registeredCount}/${evt.capacity} (${percentage}%)</div>
        `;
        grid.appendChild(card);
    });
}

function renderCoordinatorRosterPage() {
    if (!currentUser) return;
    const assignedEvents = getEventsForCoordinator(currentUser.id);
    const select = document.getElementById('coord-roster-event-select');
    if (!select) return;

    select.innerHTML = '<option value="">Select Coordinated Event</option>';
    assignedEvents.forEach(evt => {
        const opt = document.createElement('option');
        opt.value = evt.id;
        opt.textContent = evt.title;
        select.appendChild(opt);
    });
}

function renderCoordinatorRosterTable() {
    const eventId  = document.getElementById('coord-roster-event-select').value;
    const tbody    = document.getElementById('coord-roster-tbody');
    const emptyEl  = document.getElementById('coord-roster-empty');

    if (!eventId) {
        tbody.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    const apps  = getApplications();
    const users = getUsers();
    const evtApps = apps.filter(a => a.eventId === eventId);

    if (evtApps.length === 0) {
        tbody.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    tbody.innerHTML = '';

    evtApps.forEach(app => {
        const user = users.find(u => u.id === app.userId);
        if (!user) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; color:var(--text-muted);">${user.rollNumber || '—'}</td>
            <td style="font-weight:700;">${user.name}</td>
            <td style="color:var(--text-secondary);">${user.department || '—'}</td>
            <td>
                <div style="font-size:0.85rem;">${user.email}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${user.phone || ''}</div>
            </td>
            <td>
                <span class="status-badge ${app.status}">
                    <i class="fa-solid ${app.status === 'approved' ? 'fa-check' : app.status === 'rejected' ? 'fa-xmark' : 'fa-hourglass-start'}"></i>
                    ${app.status}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ─────────────────────────────────────────
// MODAL CONTROLLERS
// ─────────────────────────────────────────
let activeModalEventId = null;

function showEventDetails(eventId) {
    const events = getEvents();
    const event  = events.find(e => e.id === eventId);
    if (!event) return;

    activeModalEventId = eventId;

    const bannerBg = document.getElementById('modal-banner-bg');
    bannerBg.className = `detail-banner ${event.banner}-bg`;

    document.getElementById('modal-category-badge').textContent = event.category;
    document.getElementById('modal-event-title').textContent    = event.title;
    document.getElementById('modal-event-date').textContent     = event.date;
    document.getElementById('modal-event-time').textContent     = event.time;
    document.getElementById('modal-event-location').textContent = event.location;
    document.getElementById('modal-event-desc').textContent     = event.description;

    // Show coordinator name in modal
    const users = getUsers();
    const coordinator = users.find(u => u.id === event.coordinatorId);
    const coordEl = document.getElementById('modal-event-coordinator');
    if (coordEl) {
        coordEl.textContent = coordinator
            ? `${coordinator.name} (${getRoleMeta(coordinator.role).label})`
            : 'Not Assigned';
    }

    const seatsLeft = event.capacity - event.registeredCount;
    const seatsEl = document.getElementById('modal-capacity-info');
    if (seatsEl) {
        seatsEl.textContent = `${seatsLeft} seats remaining`;
        seatsEl.className   = 'capacity-alert ' + (seatsLeft <= 10 ? 'text-danger' : 'text-success');
    }

    const applyBtn = document.getElementById('modal-apply-btn');
    const apps     = getApplications();
    const userApp  = currentUser ? apps.find(a => a.userId === currentUser.id && a.eventId === eventId) : null;

    const isMgmtRole = currentUser && (isCouncil(currentUser.role) || isCoordinator(currentUser.role));

    if (isMgmtRole) {
        applyBtn.textContent = 'Council/Staff — No Apply';
        applyBtn.disabled    = true;
    } else if (userApp) {
        applyBtn.textContent = `Already Applied (${userApp.status.toUpperCase()})`;
        applyBtn.disabled    = true;
    } else if (event.registeredCount >= event.capacity) {
        applyBtn.textContent = 'Sold Out';
        applyBtn.disabled    = true;
    } else {
        applyBtn.textContent = 'Apply for Event';
        applyBtn.disabled    = false;
    }

    document.getElementById('event-detail-modal').classList.remove('hidden');
}

function closeEventDetailModal() {
    document.getElementById('event-detail-modal').classList.add('hidden');
    activeModalEventId = null;
}

function handleModalApply() {
    if (activeModalEventId) {
        triggerApply(activeModalEventId);
        closeEventDetailModal();
    }
}

// ─────────────────────────────────────────
// TICKET GENERATOR (SVG PASS)
// ─────────────────────────────────────────
function viewTicket(applicationId) {
    const apps = getApplications();
    const app  = apps.find(a => a.id === applicationId);
    if (!app || app.status !== 'approved') return;

    const events = getEvents();
    const users  = getUsers();
    const event  = events.find(e => e.id === app.eventId);
    const user   = users.find(u => u.id === app.userId);
    if (!event || !user) return;

    const target = document.getElementById('ticket-rendering-target');

    // Generate barcode SVG lines
    const barcodeLines = Array.from({length: 42}, () => Math.random() > 0.4 ? 2 : 4);
    let barcodeSVG = '';
    let xOffset = 20;
    barcodeLines.forEach(w => {
        barcodeSVG += `<line x1="${xOffset}" y1="8" x2="${xOffset}" y2="50" stroke="#0d1221" stroke-width="${w}" />`;
        xOffset += w + 2;
    });

    // Pick gradient based on event banner
    const gradMap = {
        tech1:      ['#4f46e5', '#06b6d4'],
        music1:     ['#ec4899', '#f43f5e'],
        business1:  ['#10b981', '#06b6d4'],
        lifestyle1: ['#f59e0b', '#ec4899']
    };
    const [g1, g2] = gradMap[event.banner] || ['#8B5CF6', '#06B6D4'];

    const ticketSVG = `
    <svg width="360" height="430" viewBox="0 0 360 430" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:14px; filter:drop-shadow(0 18px 35px rgba(0,0,0,0.55));">
        <!-- Card base -->
        <rect x="0" y="0" width="360" height="430" rx="16" fill="#0d1221" stroke="rgba(139,92,246,0.35)" stroke-width="1.5"/>
        <!-- Top gradient header -->
        <path d="M0 16C0 7.16 7.16 0 16 0H344C352.84 0 360 7.16 360 16V105H0V16Z" fill="url(#tgrad)"/>
        <!-- Stars decoration -->
        <circle cx="310" cy="30" r="2" fill="rgba(255,255,255,0.3)"/>
        <circle cx="330" cy="55" r="1.5" fill="rgba(255,255,255,0.2)"/>
        <circle cx="295" cy="70" r="1" fill="rgba(255,255,255,0.25)"/>
        <!-- Logo/Pass text -->
        <text x="25" y="44" fill="white" font-family="'Outfit',sans-serif" font-weight="900" font-size="15">NEXEVENT · CAMPUS PASS</text>
        <text x="25" y="62" fill="rgba(255,255,255,0.65)" font-family="'Outfit',sans-serif" font-weight="500" font-size="9.5">ENTRY PERMIT — STUDENT COUNCIL APPROVED</text>
        <!-- Category badge -->
        <rect x="265" y="22" width="72" height="22" rx="11" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.2)"/>
        <text x="301" y="36" fill="white" font-family="'Outfit',sans-serif" font-weight="800" font-size="8.5" text-anchor="middle">${event.category.toUpperCase()}</text>
        <!-- Event title -->
        <text x="25" y="142" fill="rgba(148,163,184,0.8)" font-family="'Outfit',sans-serif" font-weight="600" font-size="9" letter-spacing="1.2">EVENT</text>
        <text x="25" y="162" fill="white" font-family="'Outfit',sans-serif" font-weight="800" font-size="14">${event.title.substring(0, 33)}</text>
        <!-- Holder name -->
        <text x="25" y="200" fill="rgba(148,163,184,0.8)" font-family="'Outfit',sans-serif" font-weight="600" font-size="9" letter-spacing="1.2">ATTENDEE</text>
        <text x="25" y="220" fill="white" font-family="'Outfit',sans-serif" font-weight="800" font-size="13">${user.name}</text>
        ${user.rollNumber ? `<text x="25" y="236" fill="rgba(148,163,184,0.7)" font-family="'Outfit',sans-serif" font-size="9.5">${user.rollNumber} · ${user.department || ''}</text>` : ''}
        <!-- Date & Time -->
        <text x="25" y="268" fill="rgba(148,163,184,0.8)" font-family="'Outfit',sans-serif" font-weight="600" font-size="9" letter-spacing="1.2">DATE & TIME</text>
        <text x="25" y="286" fill="white" font-family="'Outfit',sans-serif" font-weight="700" font-size="12">${event.date} · ${event.time}</text>
        <!-- Location -->
        <text x="200" y="268" fill="rgba(148,163,184,0.8)" font-family="'Outfit',sans-serif" font-weight="600" font-size="9" letter-spacing="1.2">VENUE</text>
        <text x="200" y="286" fill="white" font-family="'Outfit',sans-serif" font-weight="700" font-size="11">${event.location.substring(0,20)}</text>
        <!-- Tear line -->
        <line x1="15" y1="315" x2="345" y2="315" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" stroke-dasharray="6 5"/>
        <!-- Punch holes -->
        <circle cx="15"  cy="315" r="9" fill="#070b14"/>
        <circle cx="345" cy="315" r="9" fill="#070b14"/>
        <!-- Barcode stub -->
        <rect x="25" y="332" width="310" height="65" rx="7" fill="#F1F5F9"/>
        <g>${barcodeSVG}</g>
        <text x="180" y="387" fill="#0d1221" font-family="monospace" font-weight="700" font-size="7.5" text-anchor="middle">#${app.id.toUpperCase().slice(-10)} · ${event.id.toUpperCase()}</text>
        <!-- Defs -->
        <defs>
            <linearGradient id="tgrad" x1="0" y1="0" x2="360" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="${g1}"/>
                <stop offset="100%" stop-color="${g2}"/>
            </linearGradient>
        </defs>
    </svg>
    `;

    target.innerHTML = ticketSVG;
    document.getElementById('ticket-modal').classList.remove('hidden');
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.add('hidden');
}

function printTicket() {
    window.print();
}
