import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,       // usuario de Firebase Auth
    perfil: null,     // datos en Firestore (users/{uid})
    cargando: true,   // mientras inicializa
    _inicializado: false,
  }),

  getters: {
    autenticado: (s) => !!s.user,
    uid: (s) => s.user?.uid,
    rol: (s) => s.perfil?.rol || 'rendidor',
    esAdmin: (s) => s.perfil?.rol === 'admin',
    esAprobador: (s) => s.perfil?.rol === 'aprobador',
    esRendidor: (s) => (s.perfil?.rol || 'rendidor') === 'rendidor',
  },

  actions: {
    _mapError(code, fallback = 'Ocurrió un error. Intenta nuevamente.') {
      switch (code) {
        case 'auth/email-already-in-use': return 'Ese correo ya está registrado.'
        case 'auth/invalid-email': return 'El correo no es válido.'
        case 'auth/operation-not-allowed': return 'El método de autenticación no está habilitado.'
        case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.'
        case 'auth/user-disabled': return 'La cuenta está deshabilitada.'
        case 'auth/user-not-found': return 'No existe una cuenta con ese correo.'
        case 'auth/wrong-password': return 'Contraseña incorrecta.'
        case 'auth/invalid-credential': return 'Correo o contraseña inválidos.'
        case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde.'
        default: return fallback
      }
    },

    async _cargarPerfil(uid) {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        this.perfil = snap.data()
      } else {
        // Si no existe, crea un perfil base con rol "rendidor"
        const base = {
          email: this.user?.email || null,
          nombre: null,
          empresa: null,
          rol: 'rendidor',
          monedaPref: 'CLP',
          creadoEn: serverTimestamp(),
        }
        await setDoc(ref, base, { merge: true })
        this.perfil = base
      }
    },

    async init() {
      if (this._inicializado) return
      await new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          try {
            this.user = user
            this.perfil = null
            if (user) await this._cargarPerfil(user.uid)
          } finally {
            this.cargando = false
            this._inicializado = true
            resolve()
          }
        })
      })
    },

    // Puedes llamar registrar({ nombre, empresa, email, password, rol })
    async registrar({ nombre, empresa, email, password, rol }) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        const ref = doc(db, 'users', cred.user.uid)

        const rolNormalizado = ['admin', 'aprobador', 'rendidor'].includes((rol || '').toLowerCase())
          ? rol.toLowerCase()
          : 'rendidor'

        const perfil = {
          nombre: nombre || null,
          empresa: empresa || null,
          email,
          rol: rolNormalizado,
          monedaPref: 'CLP',
          creadoEn: serverTimestamp(),
        }

        await setDoc(ref, perfil, { merge: true })
        this.user = cred.user
        this.perfil = perfil
      } catch (e) {
        throw new Error(this._mapError(e?.code, 'Error al registrar.'))
      }
    },

    // remember=true -> persistencia local (queda logueado al cerrar el navegador)
    // remember=false -> persistencia de sesión (se cierra al cerrar la ventana)
    async login(email, password, remember = true) {
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
        const cred = await signInWithEmailAndPassword(auth, email, password)
        this.user = cred.user
        await this._cargarPerfil(cred.user.uid)
        // devolvemos el rol para redirección post-login
        return this.perfil?.rol || 'rendidor'
      } catch (e) {
        throw new Error(this._mapError(e?.code, 'No fue posible iniciar sesión.'))
      }
    },

    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (e) {
        throw new Error(this._mapError(e?.code, 'No se pudo enviar el correo de recuperación.'))
      }
    },

    // Cambiar contraseña estando logueado (requiere re-autenticación con la contraseña actual)
    async changePassword(currentPassword, newPassword) {
      const user = auth.currentUser
      if (!user?.email) throw new Error('No hay sesión activa.')
      try {
        const cred = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, cred)
        await updatePassword(user, newPassword)
      } catch (e) {
        throw new Error(this._mapError(e?.code, 'No se pudo actualizar la contraseña.'))
      }
    },

    async logout() {
      await signOut(auth)
      this.user = null
      this.perfil = null
    },
  },
})
