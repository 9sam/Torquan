const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://torquan-production.up.railway.app/api';

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://torquan-production.up.railway.app';

// Make available globally
window.API_BASE = API_BASE;
window.SOCKET_URL = SOCKET_URL;
