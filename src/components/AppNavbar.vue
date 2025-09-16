<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-danger shadow-sm">
    <div class="container">
      <!-- Marca -->
      <RouterLink class="navbar-brand fw-bold" to="/">
        <i class="bi bi-receipt-cutoff me-2"></i> Xtreme Service
      </RouterLink>

      <!-- Toggler móvil -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links -->
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0" v-if="auth.autenticado">
          <!-- Inicio -->
          <li class="nav-item">
            <RouterLink class="nav-link" :class="isActive('/')" to="/">
              <i class="bi bi-house-door me-1"></i> Inicio
            </RouterLink>
          </li>
          <!-- Historial -->
          <li class="nav-item">
            <RouterLink class="nav-link" :class="isActive('/mis-rendiciones')" to="/mis-rendiciones">
              <i class="bi bi-journal-text me-1"></i> Mis Rendiciones
            </RouterLink>
          </li>
          <!-- Reportes -->
          <li class="nav-item">
            <RouterLink class="nav-link" :class="isActive('/reportes')" to="/reportes">
              <i class="bi bi-bar-chart-line me-1"></i> Reportes
            </RouterLink>
          </li>
          <!-- Soporte -->
          <li class="nav-item">
            <RouterLink class="nav-link" :class="isActive('/soporte')" to="/soporte">
              <i class="bi bi-life-preserver me-1"></i> Soporte
            </RouterLink>
          </li>
        </ul>

        <!-- Perfil -->
        <ul class="navbar-nav ms-auto" v-if="auth.autenticado">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center gap-2"
              href="#"
              data-bs-toggle="dropdown"
            >
              <span class="avatar-initials">{{ avatarIniciales }}</span>
              <span class="d-none d-sm-inline">
                {{ displayNombre }}
              </span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li>
                <RouterLink class="dropdown-item" to="/perfil">
                  <i class="bi bi-person me-2"></i> Perfil
                </RouterLink>
              </li>
              <li>
                <RouterLink class="dropdown-item" to="/cuenta/cambiar-password">
                  <i class="bi bi-key me-2"></i> Cambiar contraseña
                </RouterLink>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button class="dropdown-item text-danger d-flex align-items-center" @click="salir">
                  <i class="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                </button>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Invitados -->
        <ul class="navbar-nav ms-auto" v-else>
          <li class="nav-item"><RouterLink class="nav-link" to="/login">Iniciar sesión</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/registro">Crear cuenta</RouterLink></li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const displayNombre = computed(() => auth.perfil?.nombre || auth.user?.email || 'Usuario')
const avatarIniciales = computed(() => {
  const base = auth.perfil?.nombre || auth.user?.email || 'U'
  const partes = base.split('@')[0].split(' ').filter(Boolean)
  const ini = (partes[0]?.[0] || base[0] || 'U') + (partes[1]?.[0] || '')
  return ini.toUpperCase()
})

const isActive = (path) => (route.path === path ? 'active fw-semibold' : '')

const salir = async () => {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: #fff;
  color: #b02a37;
  border: 2px solid #fff;
}
.navbar .nav-link.active {
  text-decoration: underline;
}
</style>
