function playGame() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to play the game');
        showLogin();
        return;
    }
    window.location.href = 'game.html';
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
