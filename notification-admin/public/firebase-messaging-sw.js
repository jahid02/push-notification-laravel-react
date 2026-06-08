// Import the Firebase scripts inside the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the configurations
firebase.initializeApp({
  apiKey: "AIzaSyDXdkzVWLmIA5CRcjonS8lquHbciL3Hiag",
  authDomain: "push-notification-app-61c85.firebaseapp.com",
  projectId: "push-notification-app-61c85",
  storageBucket: "push-notification-app-61c85.firebasestorage.app",
  messagingSenderId: "1069774178082",
  appId: "1:1069774178082:web:7fda83b36117bd6846c77b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/firebase-logo.png', // Fallback icon path if available
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event to focus or redirect the user
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const payloadData = event.notification.data || {};
  let targetUrl = '/';
  
  // Choose the redirect destination based on payload properties
  if (payloadData.redirect === 'subscribers') {
    targetUrl = '/subscribers';
  } else if (payloadData.post_id) {
    targetUrl = `/feed/${payloadData.post_id}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an open tab matching our origin and focus it, then send a message to navigate
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});