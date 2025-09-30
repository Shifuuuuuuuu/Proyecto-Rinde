// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { useAuthStore } from '@/stores/auth'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

;(async () => {
  let swReg = null
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`
      swReg = await navigator.serviceWorker.register(swUrl)
      await navigator.serviceWorker.ready
    } catch (e) {
      console.warn('[SW] No se pudo registrar firebase-messaging-sw.js:', e)
    }
  } else {
    console.warn('[SW] Service workers no soportados en este navegador.')
  }


  const authStore = useAuthStore()
  await authStore.init()


  let messaging = null
  try {
    const { initMessaging, syncUserFcmToken, clearFcmToken } = await import('@/messaging')

    messaging = await initMessaging({ serviceWorkerRegistration: swReg })

    if (authStore.autenticado && auth.currentUser) {
      await syncUserFcmToken(auth.currentUser, messaging, swReg)
    }


    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await syncUserFcmToken(user, messaging, swReg)
      } else {
        await clearFcmToken(null, messaging)
      }
    })
  } catch (e) {
    console.warn('[FCM] init/sync no se ejecutó:', e?.message || e)
  }


  app.mount('#app')
})()
