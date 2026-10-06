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
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
