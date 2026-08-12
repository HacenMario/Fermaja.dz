// ===== تعريف API_BASE =====
window.API_BASE = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://fermaja-dz-y4hb.onrender.com';

console.log('🌐 config.js: API_BASE =', window.API_BASE);
