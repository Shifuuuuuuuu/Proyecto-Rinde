<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-7 col-lg-5">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h1 class="h5 mb-1">Recuperar contraseña</h1>
              <p class="text-muted mb-0">Te enviaremos un enlace al correo indicado.</p>
            </div>
            <RouterLink to="/login" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-arrow-left"></i> Volver
            </RouterLink>
          </div>

          <div v-if="ok" class="alert alert-success">
            Te enviamos un correo con instrucciones. Revisa tu bandeja y spam.
          </div>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>

          <form @submit.prevent="enviar">
            <label class="form-label">Correo</label>
            <div class="input-group mb-3">
              <span class="input-group-text"><i class="bi bi-envelope"></i></span>
              <input v-model.trim="email" type="email" class="form-control" placeholder="tucorreo@empresa.com" required />
            </div>

            <button class="btn btn-danger w-100" :disabled="cargando || !email">
              <span v-if="!cargando"><i class="bi bi-send me-1"></i> Enviar enlace</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </form>

          <p class="small text-muted mt-3 mb-0">
            El enlace es válido por tiempo limitado. Si no llega, vuelve a intentarlo.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const cargando = ref(false)
const ok = ref(false)
const error = ref('')

const enviar = async () => {
  error.value = ''; ok.value = false; cargando.value = true
  try {
    await auth.resetPassword(email.value)
    ok.value = true
  } catch (e) {
    error.value = e.message || 'No se pudo enviar el correo.'
  } finally {
    cargando.value = false
  }
}
</script>
