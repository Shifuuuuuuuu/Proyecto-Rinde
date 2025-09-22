<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-danger shadow-sm">
    <div class="container">
      <!-- Marca -->
      <RouterLink
        class="navbar-brand fw-bold"
        :to="brandTo"
        active-class=""
        exact-active-class=""
      >
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

      <!-- Cuerpo -->
      <div class="collapse navbar-collapse" id="mainNav">
        <!-- IZQUIERDA: menú por rol -->
        <ul class="navbar-nav me-auto mb-2 mb-lg-0" v-if="auth.autenticado">
          <!-- ADMIN: bloque admin + bloque rendidor -->
          <template v-if="isAdmin">
            <li class="nav-item" v-for="item in itemsAdminPanel" :key="`admin-${item.to}`">
              <RouterLink
                class="nav-link"
                :class="isActive(item.to)"
                :to="item.to"
                active-class=""
                exact-active-class=""
              >
                <i :class="item.icon" class="me-1"></i> {{ item.label }}
              </RouterLink>
            </li>

            <li class="nav-item" v-for="item in itemsRendidor" :key="`rend-${item.to}`">
              <RouterLink
                class="nav-link"
                :class="isActive(item.to)"
                :to="item.to"
                active-class=""
                exact-active-class=""
              >
                <i :class="item.icon" class="me-1"></i> {{ item.label }}
              </RouterLink>
            </li>
          </template>

          <!-- APROBADOR: rendidor + aprobaciones -->
          <template v-else-if="isAprobador">
            <li class="nav-item" v-for="item in itemsAprobador" :key="`apr-${item.to}`">
              <RouterLink
                class="nav-link"
                :class="isActive(item.to)"
                :to="item.to"
                active-class=""
                exact-active-class=""
              >
                <i :class="item.icon" class="me-1"></i> {{ item.label }}
              </RouterLink>
            </li>
          </template>

          <!-- RENDIDOR: solo rendidor -->
          <template v-else>
            <li class="nav-item" v-for="item in itemsRendidor" :key="`rend-${item.to}`">
              <RouterLink
                class="nav-link"
                :class="isActive(item.to)"
                :to="item.to"
                active-class=""
                exact-active-class=""
              >
                <i :class="item.icon" class="me-1"></i> {{ item.label }}
              </RouterLink>
            </li>
          </template>
        </ul>

        <!-- DERECHA: Rol + Perfil/Cerrar sesión -->
        <ul class="navbar-nav ms-auto" v-if="auth.autenticado">
          <li class="nav-item d-none d-lg-flex align-items-center me-2">
            <span class="badge text-bg-light text-dark">
              <i class="bi bi-person-badge me-1"></i>{{ rolDisplay }}
            </span>
          </li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" data-bs-toggle="dropdown">
              <span class="avatar-initials">{{ avatarIniciales }}</span>
              <span class="d-none d-sm-inline">{{ displayNombre }}</span>
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

// Rol
const rol = computed(() => auth.perfil?.rol || 'usuario')
const isAdmin = computed(() => rol.value === 'admin')
const isAprobador = computed(() => rol.value === 'aprobador')

// Logo: admin -> /admin, aprobador -> /aprobador, resto -> /
const brandTo = computed(() => (isAdmin.value ? '/admin' : isAprobador.value ? '/aprobador' : '/'))

// Menús
const itemsRendidor = [
  { label: 'Inicio',          to: '/',                icon: 'bi bi-house-door' },
  { label: 'Mis Rendiciones', to: '/mis-rendiciones', icon: 'bi bi-journal-text' },
  { label: 'Reportes',        to: '/reportes',        icon: 'bi bi-bar-chart-line' },
  { label: 'Soporte',         to: '/soporte',         icon: 'bi bi-life-preserver' },
]
const itemsAprobador = [
  ...itemsRendidor,
  { label: 'Aprobaciones', to: '/aprobador', icon: 'bi bi-check2-square' },
]
const itemsAdminPanel = [
  { label: 'Admin',        to: '/admin',           icon: 'bi bi-speedometer2' },
  { label: 'Usuarios',     to: '/admin/usuarios',  icon: 'bi bi-people' },
  { label: 'Soporte',      to: '/admin/soporte',   icon: 'bi bi-life-preserver' },
  { label: 'Aprobaciones', to: '/aprobador',       icon: 'bi bi-check2-square' },
]

// Activo: "/" solo exacto, el resto por prefijo también
const isActive = (path) => {
  if (path === '/') return route.path === '/' ? 'active fw-semibold' : ''
  return (route.path === path || route.path.startsWith(path + '/')) ? 'active fw-semibold' : ''
}

// Badge rol y avatar
const rolDisplay = computed(() => isAdmin.value ? 'Admin' : isAprobador.value ? 'Aprobador' : 'Rendidor')
const displayNombre = computed(() => auth.perfil?.nombre || auth.user?.email || 'Usuario')
const avatarIniciales = computed(() => {
  const base = auth.perfil?.nombre || auth.user?.email || 'U'
  const partes = base.split('@')[0].split(' ').filter(Boolean)
  const ini = (partes[0]?.[0] || base[0] || 'U') + (partes[1]?.[0] || '')
  return ini.toUpperCase()
})

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
.navbar .nav-link.active { text-decoration: underline; }
</style>
