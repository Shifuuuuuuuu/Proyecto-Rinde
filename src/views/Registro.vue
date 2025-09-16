<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-8 col-lg-7">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h1 class="h4 mb-0">Crear cuenta</h1>
            <RouterLink class="btn btn-outline-secondary btn-sm" to="/login">
              <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
            </RouterLink>
          </div>

          <!-- Error global -->
          <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{{ error }}</div>
          </div>

          <form @submit.prevent="enviar" class="needs-validation" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nombre completo</label>
                <input v-model.trim="nombre" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Empresa (opcional)</label>
                <input v-model.trim="empresa" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Correo</label>
                <input v-model.trim="email" type="email" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Contraseña</label>
                <input v-model="password" type="password" class="form-control" minlength="6" required />
                <div class="form-text">Mínimo 6 caracteres.</div>
              </div>
            </div>

            <!-- Roles -->
            <div class="mt-4">
              <label class="form-label d-flex align-items-center gap-2 mb-2">
                Rol en la plataforma
                <span class="badge bg-light text-dark border">Requerido</span>
              </label>

              <div class="row g-3">
                <!-- Rendidor -->
                <div class="col-12 col-md-4">
                  <input
                    class="btn-check"
                    type="radio"
                    name="rol"
                    id="rol-rendidor"
                    value="rendidor"
                    v-model="rol"
                    required
                  />
                  <label class="card h-100 role-card btn" for="rol-rendidor">
                    <div class="card-body">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <i class="bi bi-wallet2 fs-5 text-danger"></i>
                        <div class="fw-semibold">Rendidor</div>
                      </div>
                      <div class="small text-muted">
                        Crea rendiciones, adjunta comprobantes y consulta su estado.
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Aprobador -->
                <div class="col-12 col-md-4">
                  <input
                    class="btn-check"
                    type="radio"
                    name="rol"
                    id="rol-aprobador"
                    value="aprobador"
                    v-model="rol"
                    required
                  />
                  <label class="card h-100 role-card btn" for="rol-aprobador">
                    <div class="card-body">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <i class="bi bi-check2-square fs-5 text-success"></i>
                        <div class="fw-semibold">Aprobador</div>
                      </div>
                      <div class="small text-muted">
                        Revisa y aprueba/rechaza rendiciones dentro de su equipo.
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Admin -->
                <div class="col-12 col-md-4">
                  <input
                    class="btn-check"
                    type="radio"
                    name="rol"
                    id="rol-admin"
                    value="admin"
                    v-model="rol"
                    required
                  />
                  <label class="card h-100 role-card btn" for="rol-admin">
                    <div class="card-body">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <i class="bi bi-shield-lock fs-5 text-dark"></i>
                        <div class="fw-semibold">Admin</div>
                      </div>
                      <div class="small text-muted">
                        Configura la organización, gestiona usuarios y reportes globales.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div class="form-text mt-2">
                <i class="bi bi-info-circle"></i> Los administradores pueden cambiar roles más adelante.
              </div>
            </div>

            <button class="btn btn-danger w-100 mt-4" :disabled="cargando || !rol">
              <span v-if="!cargando">Registrarme</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const nombre = ref('')
const empresa = ref('')
const email = ref('')
const password = ref('')
const rol = ref('rendidor') // valor por defecto recomendado

const error = ref('')
const cargando = ref(false)

const auth = useAuthStore()
const router = useRouter()

const enviar = async () => {
  error.value = ''
  cargando.value = true
  try {
    await auth.registrar({
      nombre: nombre.value,
      empresa: empresa.value,
      email: email.value,
      password: password.value,
      rol: rol.value,          // <-- enviamos rol
    })
    router.push('/')
  } catch (e) {
    error.value = e?.message || 'No pudimos crear tu cuenta. Revisa el correo o intenta más tarde.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.role-card {
  transition: all .15s ease-in-out;
  border: 1px solid #e9ecef;
}
.btn-check:checked + .role-card {
  border-color: #dc3545;   /* danger */
  box-shadow: 0 0 0 .2rem rgba(220,53,69,.15);
}
</style>
