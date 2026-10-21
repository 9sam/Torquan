// Load avatar editor on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    if (!user || !token) {
        alert('Please log in to edit your avatar');
        window.location.href = 'index.html';
        return;
    }

    updateEditorUI();
    loadCurrentAvatar();
});

function updateEditorUI() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        document.getElementById('editorUsername').textContent = user.username;
    }
}

function loadCurrentAvatar() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.bodyColor) {
        document.getElementById('bodyColorPicker').value = user.bodyColor;
        updateCharacterPreview(user.bodyColor);
    }
}

function updateCharacterPreview(color) {
    const body = document.querySelector('.character-body-large');
    if (body) {
        body.style.backgroundColor = color;
    }
}

function setColor(color) {
    document.getElementById('bodyColorPicker').value = color;
    updateCharacterPreview(color);
}

function updateAvatarColor(color) {
    updateCharacterPreview(color);
}

async function saveAvatar() {
    const color = document.getElementById('bodyColorPicker').value;
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user) {
        // Update local storage
        user.bodyColor = color;
        localStorage.setItem('user', JSON.stringify(user));

        // Update on server
        try {
            const response = await fetch((window.API_BASE || '/api') + '/user/color', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ bodyColor: color })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Avatar saved successfully!');
            } else {
                alert(data.error || 'Failed to save avatar');
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            alert('Failed to save avatar');
        }
    }
}

function goToGame() {
    window.location.href = 'game.html';
}
