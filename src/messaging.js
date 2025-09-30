// src/messaging.js
import { isSupported, getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging'
import { app, db } from '@/firebase'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY


export async function initMessaging({ serviceWorkerRegistration } = {}) {
  try {
    const supported = await isSupported().catch(() => false)
    if (!supported) {
      console.warn('[FCM] No soportado en este navegador.')
      return null
    }

    const messaging = getMessaging(app)

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Notificación'
      const body  = payload.notification?.body  || payload.data?.body  || ''
      showInPageToast(`${title}: ${body}`)
    })

    return messaging
  } catch (e) {
    console.error('[FCM] initMessaging error:', e)
    return null
  }
}

export async function syncUserFcmToken(user, messaging = null, serviceWorkerRegistration = null) {
  if (!user) return
  try {
    const supported = await isSupported().catch(() => false)
    if (!supported) return

    const m = messaging || getMessaging(app)

    const perm = await Notification.requestPermission().catch(() => 'default')
    if (perm !== 'granted') {
      console.warn('[FCM] Permiso de notificaciones no concedido.')
      return
    }

    const token = await getToken(m, {
      vapidKey: VAPID_KEY,
      ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {})
    })

    if (!token) {
      console.warn('[FCM] No se obtuvo token (posible bloqueo).')
      return
    }

    await setDoc(
      doc(db, 'userPush', user.uid),
      {
        uid: user.uid,
        email: user.email || null,
        token,
        ua: navigator.userAgent,
        lastSync: serverTimestamp()
      },
      { merge: true }
    )
  } catch (e) {
    console.error('[FCM] syncUserFcmToken error:', e)
  }
}

/**
 * (Opcional) Intenta borrar token local y limpiar doc al cerrar sesión.
 */
export async function clearFcmToken(user, messaging = null) {
  try {
    const supported = await isSupported().catch(() => false)
    if (!supported) return

    const m = messaging || getMessaging(app)
    try {
      const ok = await deleteToken(m)
    } catch (e) {
      console.warn('[FCM] No se pudo borrar el token local:', e?.message || e)
    }

    if (user?.uid) {
      try { await deleteDoc(doc(db, 'userPush', user.uid)) } catch (e){ console.error(e) }
    }
  } catch (e) {
    console.warn('[FCM] clearFcmToken error:', e?.message || e)
  }
}


function showInPageToast(text) {
  const el = document.createElement('div')
  el.textContent = text
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '18px',
    right: '18px',
    background: 'rgba(25,25,25,.92)',
    color: '#fff',
    padding: '.6rem .8rem',
    borderRadius: '10px',
    zIndex: 99999,
    fontSize: '.9rem',
    maxWidth: '70vw',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 5000)
}
