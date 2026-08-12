self.addEventListener('push', function(event) {
  const data = event.data ? event.data.text() : 'إشعار جديد';
  const options = {
    body: data,
    icon: '/images/1.png',
    badge: '/images/1.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification('فرماجة', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
