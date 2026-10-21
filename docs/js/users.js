// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    updateAuthUI();
});

async function loadUsers() {
    const usersGrid = document.getElementById('usersGrid');

    try {
        const apiBase = window.API_BASE || '/api';
        console.log('Fetching users from:', apiBase + '/user/all');
        const response = await fetch(apiBase + '/user/all');
        const users = await response.json();

        console.log('Users loaded:', users);

        if (users.length === 0) {
            usersGrid.innerHTML = '<div class="no-users">No users yet. Be the first!</div>';
            return;
        }

        usersGrid.innerHTML = users.map(user => `
            <div class="user-card" onclick="viewProfile('${user.username}')">
                <div class="user-avatar" style="background-color: ${user.body_color}">
                    <div class="avatar-face">
                        <div class="avatar-eye left"></div>
                        <div class="avatar-eye right"></div>
                        <div class="avatar-smile"></div>
                    </div>
                </div>
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        usersGrid.innerHTML = '<div class="error">Failed to load users: ' + error.message + '</div>';
    }
}

function viewProfile(username) {
    window.location.href = `profile.html?username=${username}`;
}
