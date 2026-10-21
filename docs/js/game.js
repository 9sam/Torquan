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
let isMoving = false;
// token and user are already declared in auth.js

// Camera controls
let cameraRotation = 0;
let cameraDistance = 10;
let cameraHeight = 4;
let shiftLock = false;
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Animation
let walkCycle = 0;
let walkSpeed = 0.1;

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

    // Create Roblox-style camera (ArcRotateCamera)
    camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 3, cameraDistance, new BABYLON.Vector3(0, 2, 0), scene);
    camera.attachControl(canvas, false); // Don't attach to canvas, we'll handle manually
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 20;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2 - 0.1;
    camera.wheelPrecision = 50;

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
    camera.setTarget(player.position);

    // Enable collisions
    scene.collisionsEnabled = true;
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);

    // Setup camera controls
    setupCameraControls();

    // Render loop
    engine.runRenderLoop(() => {
        updateCamera();
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

    // Body (Roblox-style blocky)
    const body = BABYLON.MeshBuilder.CreateBox('body', { width: 1.0, height: 1.2, depth: 0.5 }, scene);
    body.position.y = 0.6;
    body.parent = character;
    const bodyMat = new BABYLON.StandardMaterial('bodyMat', scene);
    bodyMat.diffuseColor = BABYLON.Color3.FromHexString(bodyColor.replace('#', ''));
    body.material = bodyMat;

    // Head (larger, blocky)
    const head = BABYLON.MeshBuilder.CreateBox('head', { width: 1.0, height: 1.0, depth: 1.0 }, scene);
    head.position.y = 1.7;
    head.parent = character;
    const headMat = new BABYLON.StandardMaterial('headMat', scene);
    headMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);
    head.material = headMat;

    // Eyes (classic Roblox style)
    const eyeMat = new BABYLON.StandardMaterial('eyeMat', scene);
    eyeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);

    const leftEye = BABYLON.MeshBuilder.CreateBox('leftEye', { width: 0.15, height: 0.15, depth: 0.05 }, scene);
    leftEye.position = new BABYLON.Vector3(-0.2, 1.75, 0.5);
    leftEye.parent = character;
    leftEye.material = eyeMat;

    const rightEye = BABYLON.MeshBuilder.CreateBox('rightEye', { width: 0.15, height: 0.15, depth: 0.05 }, scene);
    rightEye.position = new BABYLON.Vector3(0.2, 1.75, 0.5);
    rightEye.parent = character;
    rightEye.material = eyeMat;

    // Smile (classic Roblox)
    const smileMat = new BABYLON.StandardMaterial('smileMat', scene);
    smileMat.diffuseColor = new BABYLON.Color3(0, 0, 0);

    const smile = BABYLON.MeshBuilder.CreateBox('smile', { width: 0.4, height: 0.08, depth: 0.05 }, scene);
    smile.position = new BABYLON.Vector3(0, 1.55, 0.5);
    smile.parent = character;
    smile.material = smileMat;

    // Arms (blocky, larger)
    const armMat = new BABYLON.StandardMaterial('armMat', scene);
    armMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);

    const leftArm = BABYLON.MeshBuilder.CreateBox('leftArm', { width: 0.4, height: 1.1, depth: 0.4 }, scene);
    leftArm.position = new BABYLON.Vector3(-0.7, 0.55, 0);
    leftArm.parent = character;
    leftArm.material = armMat;

    const rightArm = BABYLON.MeshBuilder.CreateBox('rightArm', { width: 0.4, height: 1.1, depth: 0.4 }, scene);
    rightArm.position = new BABYLON.Vector3(0.7, 0.55, 0);
    rightArm.parent = character;
    rightArm.material = armMat;

    // Legs (blocky, larger)
    const legMat = new BABYLON.StandardMaterial('legMat', scene);
    legMat.diffuseColor = new BABYLON.Color3(0, 0.4, 0.8);

    const leftLeg = BABYLON.MeshBuilder.CreateBox('leftLeg', { width: 0.4, height: 1.1, depth: 0.4 }, scene);
    leftLeg.position = new BABYLON.Vector3(-0.3, -0.55, 0);
    leftLeg.parent = character;
    leftLeg.material = legMat;

    const rightLeg = BABYLON.MeshBuilder.CreateBox('rightLeg', { width: 0.4, height: 1.1, depth: 0.4 }, scene);
    rightLeg.position = new BABYLON.Vector3(0.3, -0.55, 0);
    rightLeg.parent = character;
    rightLeg.material = legMat;

    character.metadata = { username, bodyColor };
    return character;
}

function initSocket() {
    const socketUrl = window.SOCKET_URL || 'http://localhost:3000';
    console.log('Connecting to socket at:', socketUrl);
    socket = io(socketUrl, {
        transports: ['websocket'],
        upgrade: false
    });

    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        addChatMessage('System', 'Connected to game server!', true);
        socket.emit('joinGame', {
            userId: user.id,
            username: user.username,
            bodyColor: user.bodyColor || '#00ff00'
        });
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        addChatMessage('System', 'Connection error: ' + error.message, true);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        addChatMessage('System', 'Disconnected from server', true);
    });

    socket.on('currentPlayers', (serverPlayers) => {
        console.log('Current players:', serverPlayers);
        serverPlayers.forEach(p => {
            if (p.socketId !== socket.id) {
                createOtherPlayer(p);
            }
        });
        updatePlayerList(serverPlayers);
    });

    socket.on('newPlayer', (playerData) => {
        console.log('New player joined:', playerData);
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
        console.log('Received chat message:', data);
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

    // Mobile joystick controls
    setupMobileControls();
}

function setupMobileControls() {
    const joystick = document.getElementById('joystick');
    const joystickKnob = document.getElementById('joystickKnob');
    const jumpBtn = document.getElementById('jumpBtn');

    if (!joystick || !joystickKnob) return;

    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };

    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });

    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!joystickActive) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - joystickCenter.x;
        const deltaY = touch.clientY - joystickCenter.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 35;

        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        const knobX = Math.cos(angle) * clampedDistance;
        const knobY = Math.sin(angle) * clampedDistance;

        joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        // Map joystick to keys
        keys['w'] = deltaY < -10;
        keys['s'] = deltaY > 10;
        keys['a'] = deltaX < -10;
        keys['d'] = deltaX > 10;
    });

    joystick.addEventListener('touchend', (e) => {
        e.preventDefault();
        joystickActive = false;
        joystickKnob.style.transform = 'translate(-50%, -50%)';
        keys['w'] = false;
        keys['s'] = false;
        keys['a'] = false;
        keys['d'] = false;
    });

    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[' '] = true;
        });

        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[' '] = false;
        });
    }
}

function setupCameraControls() {
    // Mouse rotation (hold right-click to rotate camera)
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right click
            isRightMouseDown = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            isRightMouseDown = false;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isRightMouseDown) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;

            cameraRotation += deltaX * 0.005;
            camera.beta += deltaY * 0.005;

            // Clamp vertical rotation
            camera.beta = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, camera.beta));

            // Update camera
            camera.alpha = cameraRotation;
            camera.beta = camera.beta;

            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Shift lock
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            shiftLock = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            shiftLock = false;
        }
    });

    // Zoom with scroll
    canvas.addEventListener('wheel', (e) => {
        cameraDistance += e.deltaY * 0.01;
        cameraDistance = Math.max(3, Math.min(20, cameraDistance));
        camera.radius = cameraDistance;
    });
}

function updateCamera() {
    if (!player || !camera) return;

    // Update camera to follow player
    camera.setTarget(player.position);
    camera.radius = cameraDistance;

    // Apply camera rotation
    camera.alpha = cameraRotation;

    // Update player rotation to face camera direction when moving (if shift lock)
    if (shiftLock) {
        player.rotation.y = cameraRotation + Math.PI;
    }
}

function updatePlayerMovement() {
    if (!player || !camera) return;

    // Get camera direction
    const cameraDirection = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
    cameraDirection.y = 0;
    cameraDirection.normalize();

    // Calculate right vector (perpendicular to camera direction)
    const cameraRight = new BABYLON.Vector3(
        cameraDirection.z,
        0,
        -cameraDirection.x
    );

    const moveDirection = new BABYLON.Vector3(0, 0, 0);

    // Camera-relative movement
    if (keys['w']) {
        moveDirection.addInPlace(cameraDirection);
    }
    if (keys['s']) {
        moveDirection.subtractInPlace(cameraDirection);
    }
    if (keys['a']) {
        moveDirection.subtractInPlace(cameraRight);
    }
    if (keys['d']) {
        moveDirection.addInPlace(cameraRight);
    }

    // Check if moving
    isMoving = moveDirection.length() > 0;

    if (isMoving) {
        moveDirection.normalize();
        player.position.x += moveDirection.x * CONFIG.moveSpeed;
        player.position.z += moveDirection.z * CONFIG.moveSpeed;

        // Rotate player to face movement direction
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        player.rotation.y = angle;

        // Walking animation
        walkCycle += walkSpeed;
        animateWalk();

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
    } else {
        // Reset animation when not moving
        resetAnimation();
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

function animateWalk() {
    // Get body, arms, and legs
    const body = player.getChildren().find(c => c.name === 'body');
    const leftArm = player.getChildren().find(c => c.name === 'leftArm');
    const rightArm = player.getChildren().find(c => c.name === 'rightArm');
    const leftLeg = player.getChildren().find(c => c.name === 'leftLeg');
    const rightLeg = player.getChildren().find(c => c.name === 'rightLeg');

    if (leftArm && rightArm && leftLeg && rightLeg) {
        // Animate arms (swing back and forth)
        leftArm.rotation.x = Math.sin(walkCycle) * 0.5;
        rightArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;

        // Animate legs (opposite to arms)
        leftLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
        rightLeg.rotation.x = Math.sin(walkCycle) * 0.5;
    }
}

function resetAnimation() {
    const leftArm = player.getChildren().find(c => c.name === 'leftArm');
    const rightArm = player.getChildren().find(c => c.name === 'rightArm');
    const leftLeg = player.getChildren().find(c => c.name === 'leftLeg');
    const rightLeg = player.getChildren().find(c => c.name === 'rightLeg');

    if (leftArm && rightArm && leftLeg && rightLeg) {
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
    }
}

// UI Functions
function toggleChat() {
    const chat = document.getElementById('chatContainer');
    chat.classList.toggle('active');
    if (chat.classList.contains('active')) {
        document.getElementById('chatInput').focus();
    }
}

function toggleTorquanMenu() {
    const menu = document.getElementById('torquanMenu');
    menu.classList.toggle('active');
}

function showMenuTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.menu-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.menu-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function changeGraphicsQuality(quality) {
    // Implement graphics quality changes
    console.log('Graphics quality:', quality);
}

function toggleShadows(enabled) {
    // Implement shadow toggle
    console.log('Shadows:', enabled);
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
        console.log('Sending chat message:', message);
        socket.emit('chatMessage', { message });
        input.value = '';
    } else {
        console.log('Empty message, not sending');
    }
}

function addChatMessage(username, message, isSystem = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.error('chatMessages element not found');
        return;
    }

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
    console.log('Chat message added:', username, message);
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
