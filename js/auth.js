let currentUser = null;

function login(email, password) {
    const users = getItem('users') || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        setItem('currentUser', user); // Store current user for session persistence (simple)
        return true;
    }
    return false;
}

function register(email, password, role = 'user') {
    const users = getItem('users') || [];
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'This email is already registered.' };
    }
    const newUser = { id: generateId(), email, password, role };
    users.push(newUser);
    setItem('users', users);
    return { success: true, user: newUser };
}

function logout() {
    currentUser = null;
    localStorage.removeItem(DB_PREFIX + 'currentUser');
}

function getCurrentUser() {
    if (!currentUser) {
        currentUser = getItem('currentUser');
    }
    return currentUser;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function checkAuth() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('app-section').classList.remove('d-none');
        document.getElementById('user-greeting').textContent = `Hello, ${user.email.split('@')[0]}`;

        // Show/hide admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            if (isAdmin()) {
                el.style.display = ''; // Or 'block', 'inline-block', etc. depending on element
            } else {
                el.style.display = 'none';
            }
        });
        return true;
    } else {
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('app-section').classList.add('d-none');
        return false;
    }
}