<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-7 col-lg-5">
      <div class="card shadow-sm">
        <div class="card-body p-4">

          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h1 class="h4 mb-1">Iniciar sesión</h1>
              <p class="text-muted mb-0">Accede a tu cuenta para gestionar tus rendiciones.</p>
            </div>
            <button class="btn btn-outline-secondary btn-sm" @click="volver">
              <i class="bi bi-arrow-left"></i> Volver
            </button>
          </div>

          <!-- Error global -->
          <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{{ error }}</div>
          </div>

          <!-- Form -->
          <form @submit.prevent="enviar" class="needs-validation" novalidate>
            <div class="mb-3">
              <label class="form-label">Correo electrónico</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input
                  v-model.trim="email"
                  type="email"
                  class="form-control"
                  placeholder="tucorreo@empresa.com"
                  autocomplete="email"
                  required
                />
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label">Contraseña</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input
                  ref="passInput"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control no-reveal"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                  required
                  @keyup="detectarCaps"
                  @keydown="detectarCaps"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="showPassword = !showPassword"
                  :aria-pressed="showPassword"
                  :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div v-if="capsOn" class="form-text text-warning d-flex align-items-center gap-1">
                <i class="bi bi-exclamation-triangle"></i> Bloq Mayús activado
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="remember" v-model="remember" />
                <label class="form-check-label" for="remember">Recordarme en este equipo</label>
              </div>
              <RouterLink class="small" to="/recuperar">¿Olvidaste tu contraseña?</RouterLink>
            </div>

            <button class="btn btn-danger w-100" :disabled="cargando || !email || !password">
              <span v-if="!cargando"><i class="bi bi-box-arrow-in-right me-1"></i> Entrar</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </form>

          <div class="mt-3">
            ¿No tienes cuenta?
            <RouterLink to="/registro">Crear cuenta</RouterLink>
          </div>

          <!-- Tips -->
          <div class="mt-4 small text-muted">
            <div class="mb-1"><i class="bi bi-shield-lock me-1"></i> Tu sesión es segura. No compartas tus credenciales.</div>
            <div><i class="bi bi-info-circle me-1"></i> Si tienes problemas para ingresar, verifica tu correo y contraseña o contacta al administrador.</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter, RouterLink } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const showPassword = ref(false)
const capsOn = ref(false)
const remember = ref(true)
const passInput = ref(null)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const volver = () => router.back()

const detectarCaps = (e) => {
  try { capsOn.value = e.getModifierState && e.getModifierState('CapsLock') } catch { capsOn.value = false }
}

const mapAuthError = (code) => {
  switch (code) {
    case 'auth/invalid-email': return 'El correo no es válido.'
    case 'auth/user-disabled': return 'La cuenta está deshabilitada.'
    case 'auth/user-not-found': return 'No existe una cuenta con ese correo.'
    case 'auth/wrong-password': return 'Contraseña incorrecta.'
    case 'auth/invalid-credential': return 'Correo o contraseña inválidos.'
    case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde.'
    default: return 'Credenciales inválidas o error de conexión.'
  }
}

const enviar = async () => {
  error.value = ''
  cargando.value = true
  try {
    // login devuelve el rol cuando termina de cargar perfil
    const rol = await auth.login(email.value, password.value, remember.value)

    // Si venía ?redirect, lo respetamos; si no, destino por rol
    const redirectQuery = route.query.redirect
    let destino = '/'
    if (!redirectQuery) {
      destino = (rol === 'admin' || rol === 'aprobador') ? '/admin' : '/'
    }
    router.push(redirectQuery || destino)
  } catch (e) {
    error.value = mapAuthError(e.code) || e.message || 'Credenciales inválidas o error de conexión.'
    requestAnimationFrame(() => passInput.value?.focus())
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.card { border-radius: 14px; }
.input-group-text { width: 44px; justify-content: center; }

/* Ocultar el ojito nativo (Edge/variantes) */
:deep(.no-reveal::-ms-reveal),
:deep(.no-reveal::-ms-clear) { display: none; }
</style>
