const API_BASE = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://fermaja-backend.onrender.com';


async function getVapidPublicKey() {
  try {
    const response = await fetch('/api/vapid-public-key');
    if (!response.ok) throw new Error('Failed to fetch VAPID key');
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
}

async function registerPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Web Push not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.warn('No VAPID public key available');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    console.log('Push subscription saved');
  } catch (error) {
    console.error('Push registration error:', error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

document.addEventListener('DOMContentLoaded', registerPush);