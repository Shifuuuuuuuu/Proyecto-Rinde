// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Login = () => import('@/views/Login.vue')
const Registro = () => import('@/views/Registro.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const CrearRendicion = () => import('@/views/CrearRendicion.vue')
const MisRendiciones = () => import('@/views/MisRendiciones.vue')
const DetalleRendicion = () => import('@/views/DetalleRendicion.vue')

const Admin = () => import('@/views/Admin.vue')
const AdminSoporte = () => import('@/views/AdminSoporte.vue')
const AdminUsuarios = () => import('@/views/AdminUsuarios.vue')

const AprobadorRendiciones = () => import('@/views/AprobadorRendiciones.vue')

const Reportes = () => import('@/views/Reportes.vue')
const Soporte = () => import('@/views/Soporte.vue')
const Perfil = () => import('@/views/Perfil.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/registro', name: 'registro', component: Registro, meta: { guestOnly: true } },

    { path: '/crear', name: 'crear', component: CrearRendicion, meta: { requiresAuth: true } },
    { path: '/mis-rendiciones', name: 'mis-rendiciones', component: MisRendiciones, meta: { requiresAuth: true } },
    { path: '/rendicion/:id', name: 'detalle', component: DetalleRendicion, meta: { requiresAuth: true } },

    // --- ADMIN (solo admin) ---
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/admin/soporte', name: 'admin.soporte', component: AdminSoporte, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/admin/usuarios', name: 'AdminUsuarios', component: AdminUsuarios, meta: { requiresAuth: true, adminOnly: true } },

    // --- APROBADOR (aprobador o admin) ---
    { path: '/aprobador', name: 'aprobador.rendiciones', component: AprobadorRendiciones, meta: { requiresAuth: true, aprobadorOnly: true } },

    { path: '/reportes', name: 'reportes', component: Reportes, meta: { requiresAuth: true } },
    { path: '/perfil', name: 'perfil', component: Perfil, meta: { requiresAuth: true } },
    { path: '/soporte', name: 'soporte', component: Soporte, meta: { requiresAuth: true } },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

let inicializado = false
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!inicializado) { await auth.init(); inicializado = true }

  const rol = auth.perfil?.rol || auth.rol // 'admin' | 'aprobador' | 'rendidor' | undefined

  // Bloquea rutas protegidas a no autenticados
  if (to.meta.requiresAuth && !auth.autenticado) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Páginas solo para invitados
  if (to.meta.guestOnly && auth.autenticado) {
    if (rol === 'admin')        return next({ name: 'admin' })
    if (rol === 'aprobador')    return next({ name: 'aprobador.rendiciones' })
    return next({ name: 'home' })
  }

  // --- Reglas de autorización por rol ---
  // Solo admin puede ver /admin*
  if (to.meta.adminOnly && rol !== 'admin') {
    return next({ name: 'home' })
  }

  // Solo aprobador o admin pueden ver /aprobador
  if (to.meta.aprobadorOnly && !(rol === 'aprobador' || rol === 'admin')) {
    return next({ name: 'home' })
  }

  // IMPORTANTE: no fuerces a admin/aprobador a /admin desde "/"
  // (elimina cualquier redirección automática aquí)

  next()
})

export default router
