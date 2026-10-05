// Game Configuration
const CONFIG = {
    moveSpeed: 0.15,
    jumpForce: 0.3,
    gravity: -0.015,
    baseplateSize: 100
};

// Global Variables
let canvas, engine, scene;
let player, camera;
let socket;
let players = new Map();
let keys = {};
let isJumping = false;
// token and user are already declared in auth.js

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
    if (!token || !user) {
        alert('Please log in to play');
        window.location.href = 'index.html';
        return;
    }

    initGame();
    initSocket();
    setupControls();
    updateSettings();
});

function initGame() {
    canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.5, 0.8, 1); // Sky blue

    // Create camera
    camera = new BABYLON.FollowCamera('FollowCamera', new BABYLON.Vector3(0, 10, -10), scene);
    camera.radius = 8;
    camera.heightOffset = 4;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 10;

    // Create lighting
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    const directionalLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
    directionalLight.intensity = 0.5;

    // Create baseplate
    createBaseplate();

    // Create player character
    player = createBlockyCharacter(user.username, user.bodyColor || '#00ff00');
    player.position.y = 2;
    camera.lockedTarget = player;

    // Enable collisions
    scene.collisionsEnabled = true;
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

    // Render loop
    engine.runRenderLoop(() => {
        updatePlayerMovement();
        scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        engine.resize();
    });
}

function createBaseplate() {
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
        width: CONFIG.baseplateSize,
        height: CONFIG.baseplateSize
    }, scene);

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    // Add grid texture
    const gridTexture = new BABYLON.Texture('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjhmOCIvPjxwYXRoIGQ9Ik0wIDUwIEgxMDAgTTUwIDAgTDUwIDEwMCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=', scene);
    groundMaterial.diffuseTexture = gridTexture;
    groundMaterial.diffuseTexture.uScale = CONFIG.baseplateSize / 10;
    groundMaterial.diffuseTexture.vScale = CONFIG.baseplateSize / 10;

    ground.checkCollisions = true;
}

function createBlockyCharacter(username, bodyColor) {
    const character = new BABYLON.TransformNode('character', scene);

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('body', { width: 1, height: 1.2, depth: 0.5 }, scene);
    body.position.y = 0.6;
    body.parent = character;
    const bodyMat = new BABYLON.StandardMaterial('bodyMat', scene);
    bodyMat.diffuseColor = BABYLON.Color3.FromHexString(bodyColor.replace('#', ''));
    body.material = bodyMat;

    // Head
    const head = BABYLON.MeshBuilder.CreateBox('head', { width: 0.8, height: 0.8, depth: 0.8 }, scene);
    head.position.y = 1.6;
    head.parent = character;
    const headMat = new BABYLON.StandardMaterial('headMat', scene);
    headMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6); // Skin color
    head.material = headMat;

    // Eyes
    const eyeMat = new BABYLON.StandardMaterial('eyeMat', scene);
    eyeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);

    const leftEye = BABYLON.MeshBuilder.CreateBox('leftEye', { width: 0.1, height: 0.1, depth: 0.05 }, scene);
    leftEye.position = new BABYLON.Vector3(-0.15, 1.65, 0.4);
    leftEye.parent = character;
    leftEye.material = eyeMat;

    const rightEye = BABYLON.MeshBuilder.CreateBox('rightEye', { width: 0.1, height: 0.1, depth: 0.05 }, scene);
    rightEye.position = new BABYLON.Vector3(0.15, 1.65, 0.4);
    rightEye.parent = character;
    rightEye.material = eyeMat;

    // Smile
    const smile = BABYLON.MeshBuilder.CreateBox('smile', { width: 0.3, height: 0.05, depth: 0.05 }, scene);
    smile.position = new BABYLON.Vector3(0, 1.45, 0.4);
    smile.parent = character;
    smile.material = eyeMat;

    // Arms
    const armMat = new BABYLON.StandardMaterial('armMat', scene);
    armMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);

    const leftArm = BABYLON.MeshBuilder.CreateBox('leftArm', { width: 0.3, height: 1, depth: 0.3 }, scene);
    leftArm.position = new BABYLON.Vector3(-0.65, 0.6, 0);
    leftArm.parent = character;
    leftArm.material = armMat;

    const rightArm = BABYLON.MeshBuilder.CreateBox('rightArm', { width: 0.3, height: 1, depth: 0.3 }, scene);
    rightArm.position = new BABYLON.Vector3(0.65, 0.6, 0);
    rightArm.parent = character;
    rightArm.material = armMat;

    // Legs
    const legMat = new BABYLON.StandardMaterial('legMat', scene);
    legMat.diffuseColor = new BABYLON.Color3(0, 0.4, 0.8);

    const leftLeg = BABYLON.MeshBuilder.CreateBox('leftLeg', { width: 0.35, height: 1, depth: 0.35 }, scene);
    leftLeg.position = new BABYLON.Vector3(-0.2, -0.5, 0);
    leftLeg.parent = character;
    leftLeg.material = legMat;

    const rightLeg = BABYLON.MeshBuilder.CreateBox('rightLeg', { width: 0.35, height: 1, depth: 0.35 }, scene);
    rightLeg.position = new BABYLON.Vector3(0.2, -0.5, 0);
    rightLeg.parent = character;
    rightLeg.material = legMat;

    character.metadata = { username, bodyColor };
    return character;
}

function initSocket() {
    const socketUrl = window.SOCKET_URL || 'http://localhost:3000';
    socket = io(socketUrl);

    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('joinGame', {
            userId: user.id,
            username: user.username,
            bodyColor: user.bodyColor || '#00ff00'
        });
    });

    socket.on('currentPlayers', (serverPlayers) => {
        serverPlayers.forEach(p => {
            if (p.socketId !== socket.id) {
                createOtherPlayer(p);
            }
        });
        updatePlayerList(serverPlayers);
    });

    socket.on('newPlayer', (playerData) => {
        if (playerData.socketId !== socket.id) {
            createOtherPlayer(playerData);
            addChatMessage('System', `${playerData.username} joined the game`, true);
        }
        updatePlayerList(Array.from(players.values()).map(p => p.metadata));
    });

    socket.on('playerMoved', (data) => {
        const otherPlayer = players.get(data.socketId);
        if (otherPlayer) {
            otherPlayer.position.x = data.position.x;
            otherPlayer.position.y = data.position.y;
            otherPlayer.position.z = data.position.z;
            otherPlayer.rotation.y = data.rotation.y;
        }
    });

    socket.on('playerColorChanged', (data) => {
        const otherPlayer = players.get(data.socketId);
        if (otherPlayer) {
            updatePlayerColor(otherPlayer, data.color);
        }
    });

    socket.on('playerDisconnected', (socketId) => {
        const otherPlayer = players.get(socketId);
        if (otherPlayer) {
            addChatMessage('System', `${otherPlayer.metadata.username} left the game`, true);
            otherPlayer.dispose();
            players.delete(socketId);
        }
    });

    socket.on('chatMessage', (data) => {
        addChatMessage(data.username, data.message);
    });
}

function createOtherPlayer(playerData) {
    const character = createBlockyCharacter(playerData.username, playerData.bodyColor);
    character.position.x = playerData.position.x;
    character.position.y = playerData.position.y;
    character.position.z = playerData.position.z;
    players.set(playerData.socketId, character);
}

function updatePlayerColor(character, color) {
    const body = character.getChildren().find(c => c.name === 'body');
    if (body) {
        body.material.diffuseColor = BABYLON.Color3.FromHexString(color.replace('#', ''));
    }
    character.metadata.bodyColor = color;
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

function updatePlayerMovement() {
    if (!player) return;

    const moveDirection = new BABYLON.Vector3(0, 0, 0);

    if (keys['w']) moveDirection.z += 1;
    if (keys['s']) moveDirection.z -= 1;
    if (keys['a']) moveDirection.x -= 1;
    if (keys['d']) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        player.position.x += moveDirection.x * CONFIG.moveSpeed;
        player.position.z += moveDirection.z * CONFIG.moveSpeed;

        // Rotate player to face movement direction
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        player.rotation.y = angle;

        // Emit movement to server
        socket.emit('playerMove', {
            position: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            },
            rotation: {
                x: player.rotation.x,
                y: player.rotation.y,
                z: player.rotation.z
            }
        });
    }

    // Jump
    if (keys[' '] && !isJumping) {
        isJumping = true;
        player.position.y += CONFIG.jumpForce;
    }

    // Gravity
    if (player.position.y > 2) {
        player.position.y += CONFIG.gravity;
    } else {
        player.position.y = 2;
        isJumping = false;
    }

    // Keep player on baseplate
    const halfSize = CONFIG.baseplateSize / 2;
    player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
    player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));
}

// UI Functions
function toggleChat() {
    const chat = document.getElementById('chatContainer');
    chat.classList.toggle('active');
    if (chat.classList.contains('active')) {
        document.getElementById('chatInput').focus();
    }
}

function toggleSettings() {
    const settings = document.getElementById('settingsPanel');
    settings.classList.toggle('active');
}

function exitGame() {
    if (confirm('Are you sure you want to exit the game?')) {
        window.location.href = 'index.html';
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        socket.emit('chatMessage', { message });
        input.value = '';
    }
}

function addChatMessage(username, message, isSystem = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSystem) {
        messageDiv.innerHTML = `
            <span class="username" style="color: #ffcc00;">${username}</span>
            <span class="message">${message}</span>
            <span class="time">${time}</span>
        `;
    } else {
        messageDiv.innerHTML = `
            <span class="username">${username}:</span>
            <span class="message">${message}</span>
            <span class="time">${time}</span>
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function changeBodyColor(color) {
    if (player) {
        updatePlayerColor(player, color);
        socket.emit('changeColor', { color });

        // Update user data
        user.bodyColor = color;
        localStorage.setItem('user', JSON.stringify(user));

        // Update on server
        fetch((window.API_BASE || '/api') + '/user/color', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bodyColor: color })
        }).catch(err => console.error('Failed to update color:', err));
    }
}

function updateSettings() {
    document.getElementById('settingsUsername').textContent = user.username;
    if (user.bodyColor) {
        document.getElementById('bodyColorPicker').value = user.bodyColor;
    }
}

function updatePlayerList(serverPlayers) {
    const playerListContent = document.getElementById('playerListContent');
    playerListContent.innerHTML = '';

    serverPlayers.forEach(p => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <div class="player-color" style="background-color: ${p.bodyColor}"></div>
            <span class="player-name">${p.username}</span>
        `;
        playerListContent.appendChild(playerItem);
    });
}
