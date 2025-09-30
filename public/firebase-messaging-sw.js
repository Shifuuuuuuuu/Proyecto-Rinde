/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');


firebase.initializeApp({
  apiKey: "AIzaSyBn1Gz9lNnHudiClQBk3cQLrpwmdy_QreM",
  authDomain: "xtreme-rindegastos.firebaseapp.com",
  projectId: "xtreme-rindegastos",
  storageBucket: "xtreme-rindegastos.firebasestorage.app",
  messagingSenderId: "351951671615",
  appId: "1:351951671615:web:5efe868bb54389f78c038a",
  measurementId: "G-4VFJKLH0RF"
});

// Inicializa messaging (en el SW)
const messaging = firebase.messaging();

// Manejo de mensajes en segundo plano (app cerrada o no enfocada)
messaging.onBackgroundMessage((payload) => {
  // payload puede traer notification y/o data
  const notif = payload.notification || {};
  const data = payload.data || {};

  // Título y opciones
  const title = notif.title || data.title || 'Notificación';
  const options = {
    body: notif.body || data.body || '',
    icon: notif.icon || data.icon || '/icon-192.png', // pon tu ícono en /public
    badge: notif.badge || data.badge || '/badge-72.png', // opcional
    image: notif.image || data.image,                   // opcional
    data: {
      // URL para abrir al click (prioriza notification.click_action)
      url: (notif.click_action || data.click_action || data.url || '/'),
      // conserva todo el data por si lo necesitas en click
      ...data,
    },
    // Opcional: acciones (si las envías en el payload)
    actions: data.actions ? JSON.parse(data.actions) : undefined,
    // vibrate: [100, 50, 100], // opcional
    // requireInteraction: true, // opcional: mantiene visible hasta que el usuario interactúe
  };

  self.registration.showNotification(title, options);
});

// Al hacer click en la notificación, intenta abrir/enfocar la URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      // ¿Alguna pestaña ya abierta con esa URL? Enfócala.
      const match = allClients.find((c) => c.url.includes(new URL(url, self.location.origin).pathname));
      if (match) {
        match.focus();
        // Opcional: envia un mensaje a la pestaña
        // match.postMessage({ type: 'NOTIF_CLICK', data: event.notification.data });
      } else {
        await clients.openWindow(url);
      }
    })()
  );
});

// (Opcional) Estrategia de actualización del SW
self.addEventListener('install', () => {
  // self.skipWaiting(); // Descomenta si quieres activar el SW inmediatamente tras instalar
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
