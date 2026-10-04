// API Base URL
let API_BASE = '/api/auth';

// Will be updated by config.js if loaded
if (window.API_BASE) {
    API_BASE = window.API_BASE + '/auth';
}

// Token storage
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

// Check authentication status on load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const navUsername = document.getElementById('navUsername');

    if (token && user) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        navUsername.textContent = user.username;
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
    }
}

function showLogin() {
    closeModal('signupModal');
    document.getElementById('loginModal').classList.add('active');
}

function showSignup() {
    closeModal('loginModal');
    document.getElementById('signupModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function handleSignup(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            closeModal('signupModal');
            document.getElementById('signupForm').reset();
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            user = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            updateAuthUI();
            closeModal('loginModal');
            document.getElementById('loginForm').reset();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

function logout() {
    token = null;
    user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
}

// Check for verification in URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('verified') === 'true') {
    alert('Email verified successfully! You can now log in.');
} else if (urlParams.get('verified') === 'false') {
    alert('Email verification failed or link expired. Please try again.');
}
