// Shared configuration
// ====================

// Detect environment from hostname
const isLocalhost = ['localhost', '127.0.0.1', '[::]', '::1'].includes(window.location.hostname);

const CONFIG = {
  API_BASE: isLocalhost 
    ? 'http://localhost:3000'
    : 'https://portfolio-backend-8mav.onrender.com',
};

