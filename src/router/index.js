// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy views (mantén estos paths tal como están en tu proyecto)
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
const Rendiciones = () => import('@/views/ExportadorRendiciones.vue')

const Informes = () => import('@/views/Informes.vue')
const InformeDetalle = () => import('@/views/InformeDetalle.vue')

// NUEVO: aprobador de informes
const AprobadorInformes = () => import('@/views/AprobadorInformes.vue')
const AprobadorInformeDetalle = () => import('@/views/AprobadorInformeDetalle.vue')
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Home / Auth
    { path: '/', name: 'home', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/registro', name: 'registro', component: Registro, meta: { guestOnly: true } },

    // Rendiciones (usuario)
    { path: '/crear', name: 'crear', component: CrearRendicion, meta: { requiresAuth: true } },
    // Importante: nombre 'rendiciones' para compatibilidad de tus enlaces previos
    { path: '/mis-rendiciones', name: 'rendiciones', component: MisRendiciones, meta: { requiresAuth: true } },
    { path: '/rendicion/:id', name: 'detalle', component: DetalleRendicion, meta: { requiresAuth: true } },

    // ADMIN
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/admin/soporte', name: 'admin.soporte', component: AdminSoporte, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/admin/usuarios', name: 'AdminUsuarios', component: AdminUsuarios, meta: { requiresAuth: true, adminOnly: true } },

    // APROBADOR (rendiciones)
    { path: '/aprobador', name: 'aprobador.rendiciones', component: AprobadorRendiciones, meta: { requiresAuth: true, aprobadorOnly: true } },

    // Otras vistas
    { path: '/reportes', name: 'reportes', component: Reportes, meta: { requiresAuth: true } },
    { path: '/perfil', name: 'perfil', component: Perfil, meta: { requiresAuth: true } },
    { path: '/soporte', name: 'soporte', component: Soporte, meta: { requiresAuth: true } },

    // Exportador (ya usabas este path)
    { path: '/rendiciones', name: 'exportar.rendiciones', component: Rendiciones, meta: { requiresAuth: true } },

    // Informes (usuario)
    { path: '/informes', name: 'informes', component: Informes, meta: { title: 'Informes', requiresAuth: true } },
    { path: '/informes/:id', name: 'informeDetalle', component: InformeDetalle, props: true, meta: { title: 'Detalle de informe', requiresAuth: true } },

    // *** Aprobador de Informes (NUEVO) ***
    { path: '/aprobador/informes-aprobador', name: 'aprobadorInformes', component: AprobadorInformes, meta: { requiresAuth: true, aprobadorOnly: true, title: 'Aprobador · Informes' } },
    { path: '/aprobador/informes-aprobador/:id', name: 'aprobadorInforme', component: AprobadorInformeDetalle, props: route => ({ informeId: route.params.id }) , meta: { requiresAuth: true, aprobadorOnly: true, title: 'Aprobador · Detalle de informe' } },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Guard global
let inicializado = false
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!inicializado) {
    await auth.init()
    inicializado = true
  }

  const rol = auth.perfil?.rol || auth.rol // 'admin' | 'aprobador' | 'rendidor' | undefined

  // Rutas protegidas
  if (to.meta.requiresAuth && !auth.autenticado) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Solo invitados
  if (to.meta.guestOnly && auth.autenticado) {
    if (rol === 'admin')     return next({ name: 'admin' })
    if (rol === 'aprobador') return next({ name: 'aprobadorInformes' })
    return next({ name: 'home' })
  }

  // Reglas por rol
  if (to.meta.adminOnly && rol !== 'admin') {
    return next({ name: 'home' })
  }
  if (to.meta.aprobadorOnly && !(rol === 'aprobador' || rol === 'admin')) {
    return next({ name: 'home' })
  }

  next()
})

export default router
