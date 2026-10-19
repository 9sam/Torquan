function playGame() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to play the game');
        showLogin();
        return;
    }
    window.location.href = 'game.html';
}

function playAsGuest() {
    // Create a guest user
    const guestUser = {
        id: 'guest_' + Date.now(),
        username: 'Guest_' + Math.floor(Math.random() * 10000),
        bodyColor: '#00ff00',
        isGuest: true
    };
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('token', 'guest_token');
    window.location.href = 'game.html';
}

// Like functionality
let hasLiked = false;
let likeCount = Math.floor(Math.random() * 100) + 50; // Random initial likes

function toggleLike() {
    const likeIcon = document.getElementById('likeIcon');
    const likeCountEl = document.getElementById('likeCount');

    if (!hasLiked) {
        likeCount++;
        hasLiked = true;
        likeIcon.style.color = '#e3242b';
    } else {
        likeCount--;
        hasLiked = false;
        likeIcon.style.color = 'white';
    }

    likeCountEl.textContent = likeCount;
    localStorage.setItem('torquan_likes', likeCount);
    localStorage.setItem('torquan_hasLiked', hasLiked);
}

// Update online count (simulated)
function updateOnlineCount() {
    const onlineCount = Math.floor(Math.random() * 20) + 5;
    document.getElementById('onlineUsers').textContent = onlineCount;
}

// Initialize stats on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved like state
    const savedLikes = localStorage.getItem('torquan_likes');
    const savedHasLiked = localStorage.getItem('torquan_hasLiked');

    if (savedLikes) {
        likeCount = parseInt(savedLikes);
        document.getElementById('likeCount').textContent = likeCount;
    }

    if (savedHasLiked === 'true') {
        hasLiked = true;
        document.getElementById('likeIcon').style.color = '#e3242b';
    }

    // Update online count
    updateOnlineCount();
    setInterval(updateOnlineCount, 30000); // Update every 30 seconds

    // Load featured users
    loadFeaturedUsers();
});

async function loadFeaturedUsers() {
    const featuredUsers = document.getElementById('featuredUsers');
    if (!featuredUsers) return;

    try {
        const response = await fetch((window.API_BASE || '/api') + '/user/all');
        const users = await response.json();

        if (users.length === 0) {
            featuredUsers.innerHTML = '<div class="no-users">No users yet. Be the first!</div>';
            return;
        }

        // Show first 8 users
        const featured = users.slice(0, 8);
        featuredUsers.innerHTML = featured.map(user => `
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
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured users:', error);
        featuredUsers.innerHTML = '<div class="error">Failed to load users</div>';
    }
}

function viewProfile(username) {
    window.location.href = `profile.html?username=${username}`;
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
