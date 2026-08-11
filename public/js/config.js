// ===== تعريف API_BASE =====
window.API_BASE = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://fermaja-dz-nhsn.onrender.com';

console.log('🌐 config.js: API_BASE =', window.API_BASE);
