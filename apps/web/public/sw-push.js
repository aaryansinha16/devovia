/**
 * Service Worker — Push Notifications
 *
 * Handles incoming push events and notification click actions.
 * Registered from the frontend push subscription logic.
 */

/* eslint-disable no-restricted-globals */

self.addEventListener('install', () => {
  console.log('[SW Push] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Push] Service worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push event received:', event.data ? event.data.text() : 'no data');

  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Devovia',
      body: event.data.text(),
      url: '/',
    };
  }

  console.log('[SW Push] Parsed payload:', JSON.stringify(payload));

  const options = {
    body: payload.body || payload.message || '',
    icon: payload.icon || '/favicon-devovia.png',
    badge: payload.badge || '/favicon-devovia.png',
    tag: (payload.type || 'devovia') + '-' + (payload.timestamp || Date.now()),
    data: {
      url: payload.url || '/dashboard',
      type: payload.type,
      timestamp: payload.timestamp,
    },
    requireInteraction: false,
  };

  console.log('[SW Push] Showing notification:', payload.title, JSON.stringify(options));
  console.log('[SW Push] Notification permission:', self.Notification ? self.Notification.permission : 'Notification API not available');

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Devovia', options)
      .then(() => console.log('[SW Push] showNotification resolved successfully'))
      .catch((err) => console.error('[SW Push] showNotification FAILED:', err.message || err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if one is open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', () => {
  // Analytics or cleanup if needed
});
