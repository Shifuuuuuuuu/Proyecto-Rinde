import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Login = () => import('@/views/Login.vue')
const Registro = () => import('@/views/Registro.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const CrearRendicion = () => import('@/views/CrearRendicion.vue')
const MisRendiciones = () => import('@/views/MisRendiciones.vue')
const DetalleRendicion = () => import('@/views/DetalleRendicion.vue')
const Admin = () => import('@/views/Admin.vue')
const Reportes = () => import('@/views/Reportes.vue')
const Soporte = () => import('@/views/Soporte.vue')
const Perfil = () => import('@/views/Perfil.vue')

const AdminUsuarios = () => import('@/views/AdminUsuarios.vue') // opcional: lazy import nombrado

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/registro', name: 'registro', component: Registro, meta: { guestOnly: true } },

    { path: '/crear', name: 'crear', component: CrearRendicion, meta: { requiresAuth: true } },
    { path: '/mis-rendiciones', name: 'mis-rendiciones', component: MisRendiciones, meta: { requiresAuth: true } },
    { path: '/rendicion/:id', name: 'detalle', component: DetalleRendicion, meta: { requiresAuth: true } },

    // Panel de aprobación: admin o aprobador
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, approvePanel: true } },

    // 🔒 ADMIN USUARIOS (mover antes del catch-all y marcar adminOnly)
    { path: '/admin/usuarios', name: 'AdminUsuarios', component: AdminUsuarios, meta: { requiresAuth: true, adminOnly: true } },

    { path: '/reportes', name: 'reportes', component: Reportes, meta: { requiresAuth: true } },
    { path: '/perfil', name: 'perfil', component: Perfil, meta: { requiresAuth: true } },
    { path: '/soporte', name: 'soporte', component: Soporte, meta: { requiresAuth: true } },

    // 👇 dejar SIEMPRE al final
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

let inicializado = false
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!inicializado) { await auth.init(); inicializado = true }

  const rol = auth.perfil?.rol || auth.rol // por si tienes getter 'rol' en el store

  // Bloquea rutas protegidas a no autenticados
  if (to.meta.requiresAuth && !auth.autenticado) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Páginas solo para invitados: si ya está logueado, manda según rol
  if (to.meta.guestOnly && auth.autenticado) {
    return next(rol === 'admin' || rol === 'aprobador' ? { name: 'admin' } : { name: 'home' })
  }

  // Panel de aprobación: admin o aprobador
  if (to.meta.approvePanel) {
    if (rol !== 'admin' && rol !== 'aprobador') {
      return next({ name: 'home' })
    }
  }

  // 🔒 Solo admin
  if (to.meta.adminOnly) {
    if (rol !== 'admin') {
      return next({ name: 'home' })
    }
  }

  // (Opcional) si un admin/aprobador entra a '/', mándalo a /admin
  if (to.name === 'home' && auth.autenticado) {
    if ((rol === 'admin' || rol === 'aprobador') && from.name !== 'admin') {
      return next({ name: 'admin' })
    }
  }

  next()
})

export default router
