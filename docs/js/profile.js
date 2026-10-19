// Load profile on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (username) {
        loadProfile(username);
    } else {
        // If no username, show current user's profile
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user) {
            loadProfile(user.username);
        } else {
            alert('Please log in to view profiles');
            window.location.href = 'index.html';
        }
    }

    updateAuthUI();
});

async function loadProfile(username) {
    try {
        const response = await fetch((window.API_BASE || '/api') + `/user/profile/${username}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('profileUsername').textContent = data.username;
            document.getElementById('profileJoined').textContent = `Joined: ${new Date(data.created_at).toLocaleDateString()}`;
            document.getElementById('profileUserId').textContent = `User ID: ${data.id}`;
            document.getElementById('profileAvatar').style.backgroundColor = data.body_color;
        } else {
            alert(data.error || 'Profile not found');
            window.location.href = 'users.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile');
        window.location.href = 'users.html';
    }
}

function playGame() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to play');
        showLogin();
        return;
    }
    window.location.href = 'game.html';
}
