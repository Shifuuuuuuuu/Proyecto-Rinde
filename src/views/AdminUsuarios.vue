<!-- src/views/AdminUsuarios.vue -->
<template>
  <div class="container-fluid py-4">
    <!-- HEADER -->
    <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h2 class="h5 mb-0">Administración de usuarios</h2>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="reload(true)">
          <i class="bi bi-arrow-clockwise"></i>
          <span class="ms-1">Recargar</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="openCreate()">
          <i class="bi bi-person-plus"></i>
          <span class="ms-1">Agregar usuario</span>
        </button>
      </div>
    </div>

    <!-- CONTROLES -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-md-4">
            <label class="form-label small">Buscar</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                v-model="search"
                class="form-control"
                placeholder="Nombre o correo..."
                @input="onSearchChange"
              />
            </div>
            <small class="text-muted">Búsqueda en la página actual.</small>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Rol</label>
            <select v-model="rol" class="form-select" @change="reload(true)">
              <option value="todos">Todos</option>
              <option v-for="r in rolOpts" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small">Por página</label>
            <select v-model.number="pageSize" class="form-select" @change="reload(true)">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>

          <div class="col-12 col-md-3 d-flex align-items-end justify-content-md-end">
            <div>
              <div class="small text-muted">Total (página): {{ renderRows.length }} de {{ pageSize }}</div>
              <div class="small text-muted">Página {{ page + 1 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ALERTAS -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <div>{{ error }}</div>
    </div>

    <!-- TABLA -->
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="min-width: 220px;">Nombre</th>
              <th style="min-width: 220px;">Correo</th>
              <th>Empresa</th>
              <th>Moneda</th>
              <th>Rol</th>
              <th style="min-width: 160px;">Creado</th>
              <th class="text-end" style="min-width: 200px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando usuarios...
              </td>
            </tr>

            <tr v-for="u in renderRows" :key="u.id">
              <td><div class="fw-semibold">{{ u.nombre || '—' }}</div></td>
              <td>
                <div class="fw-semibold">{{ u.email || '—' }}</div>
                <small class="text-muted">{{ u.empresa || '—' }}</small>
              </td>
              <td>{{ u.empresa || '—' }}</td>
              <td>{{ u.monedaPref || '—' }}</td>
              <td><span class="badge rounded-pill" :class="badgeRol(u.rol)">{{ u.rol || '—' }}</span></td>
              <td>
                <div>{{ formatFechaHora(u.creadoEn) }}</div>
                <small class="text-muted">{{ formatFecha(u.creadoEn) }}</small>
              </td>
              <td class="text-end">
                <div class="btn-group">
                  <button class="btn btn-outline-primary btn-sm" @click="openEdit(u)" title="Editar">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" @click="remove(u)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && renderRows.length === 0">
              <td colspan="7" class="text-center text-muted py-4">Sin usuarios para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINACIÓN -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div class="small text-muted">
          Página {{ page + 1 }} • Mostrando {{ renderRows.length }} de {{ pageSize }}
        </div>
        <div class="btn-group">
          <button class="btn btn-outline-secondary btn-sm" :disabled="page === 0 || loading" @click="prevPage">
            <i class="bi bi-chevron-left"></i> Anterior
          </button>
          <button class="btn btn-outline-secondary btn-sm" :disabled="!hasNextPage || loading" @click="nextPage">
            Siguiente <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CREAR/EDITAR -->
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true" ref="userModalEl">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editing ? 'Editar usuario' : 'Agregar usuario' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Nombre</label>
                <input v-model.trim="form.nombre" type="text" class="form-control" placeholder="Nombre completo" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Correo</label>
                <input v-model.trim="form.email" type="email" class="form-control" placeholder="correo@empresa.com" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Empresa</label>
                <input v-model.trim="form.empresa" type="text" class="form-control" placeholder="Empresa" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Moneda preferida</label>
                <select v-model="form.monedaPref" class="form-select">
                  <option v-for="m in monedaOpts" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Rol</label>
                <select v-model="form.rol" class="form-select">
                  <option v-for="r in rolOpts" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>

              <!-- CONTRASEÑA SOLO AL CREAR -->
              <template v-if="!editing">
                <div class="col-12 col-md-6">
                  <label class="form-label">Contraseña</label>
                  <input v-model.trim="form.password" type="password" class="form-control" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Confirmar contraseña</label>
                  <input v-model.trim="form.password2" type="password" class="form-control" placeholder="Repite la contraseña" autocomplete="new-password" />
                </div>
                <div class="col-12">
                  <small class="text-muted d-block">
                    La contraseña se usa solo para crear el usuario en Authentication y <strong>no</strong> se guarda en Firestore.
                  </small>
                </div>
              </template>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save()">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editing ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMAR ELIMINACIÓN (solo Firestore) -->
    <div class="modal fade show" tabindex="-1" style="display:block;" v-if="confirmOpen" @click.self="closeConfirm">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle me-2 text-danger"></i>
              Confirmar eliminación
            </h5>
            <button type="button" class="btn-close" @click="closeConfirm"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              ¿Seguro deseas eliminar
              <strong>{{ confirmText || 'este usuario' }}</strong> de la base de datos?
              (No se eliminará de Authentication)
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeConfirm">Cancelar</button>
            <button class="btn btn-danger" :disabled="confirmBusy" @click="confirmYes">
              <span v-if="!confirmBusy"><i class="bi bi-trash me-1"></i> Eliminar</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="confirmOpen" class="modal-backdrop fade show" @click="closeConfirm"></div>

    <!-- TOAST / SNACKBAR -->
    <Teleport to="body">
      <Transition name="snackbar">
        <div v-if="toast.show" class="snackbar shadow">
          <i class="bi me-2" :class="toast.icon"></i>
          <span>{{ toast.text }}</span>
          <button class="btn btn-sm btn-link text-white ms-2" @click="toast.show = false">Cerrar</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, limit, startAfter, getDocs,
  updateDoc, deleteDoc, doc, serverTimestamp, setDoc
} from 'firebase/firestore'

/* 🔑 Auth (app secundario para no cerrar tu sesión) */
import { getApp, initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'

import { useRouter } from 'vue-router'
const router = useRouter()

/* ============ STATE ============ */
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const rol = ref('todos')
const search = ref('')

const rolOpts = ['admin', 'aprobador', 'rendidor']
const monedaOpts = ['CLP', 'USD', 'EUR']

/* Paginación */
const pageSize = ref(10)
const page = ref(0)
const cursors = ref([])
const hasNextPage = ref(false)

/* Datos */
const rows = ref([])

/* Modal crear/editar */
const userModalEl = ref(null)
let userModal

const editing = ref(false)
const editingId = ref(null)
const form = ref({
  nombre: '',
  email: '',
  empresa: 'Xtreme Servicios',
  monedaPref: 'CLP',
  rol: 'usuario',
  password: '',
  password2: '',
  creadoEn: null,
})

/* ============ TOAST ============ */
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast(text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 2600)
}

/* ============ CONFIRM MODAL ============ */
const confirmOpen = ref(false)
const confirmBusy = ref(false)
const confirmText = ref('')
let confirmAction = null
function openConfirm({ text = '', onYes }) { confirmText.value = text; confirmAction = onYes; confirmOpen.value = true }
function closeConfirm() { if (confirmBusy.value) return; confirmOpen.value = false; confirmText.value = ''; confirmAction = null }
async function confirmYes() { if (!confirmAction) return; confirmBusy.value = true; try { await confirmAction(); closeConfirm() } finally { confirmBusy.value = false } }

/* ============ HELPERS ============ */
const formatFecha = (ts) => { try { const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null); return d ? new Intl.DateTimeFormat('es-CL').format(d) : '—' } catch { return '—' } }
const formatFechaHora = (ts) => { try { const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null); return d ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '—' } catch { return '—' } }
const badgeRol = (r) => ({ admin: 'text-bg-danger', aprobador: 'text-bg-warning', rendidor: 'text-bg-info', usuario: 'text-bg-success' }[r] || 'text-bg-dark')

/* ============ FETCH ============ */
async function fetchPage(opts = { reset: false }) {
  loading.value = true
  error.value = ''
  try {
    if (opts.reset) { page.value = 0; cursors.value = [] }
    const col = collection(db, 'users')
    const clauses = []
    if (rol.value !== 'todos') clauses.push(where('rol', '==', rol.value))
    let q = query(col, ...clauses, orderBy('creadoEn', 'desc'), limit(pageSize.value))
    if (page.value > 0 && cursors.value[page.value - 1]) {
      q = query(col, ...clauses, orderBy('creadoEn', 'desc'), startAfter(cursors.value[page.value - 1]), limit(pageSize.value))
    }
    const snap = await getDocs(q)
    rows.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    hasNextPage.value = snap.docs.length === pageSize.value
    if (snap.docs.length > 0) cursors.value[page.value] = snap.docs[snap.docs.length - 1]
  } catch (e) {
    console.error(e); error.value = 'No fue posible cargar los usuarios.'
  } finally { loading.value = false }
}

/* ============ SEARCH (cliente) ============ */
let searchDebounce
function onSearchChange(){ clearTimeout(searchDebounce); searchDebounce = setTimeout(()=>{}, 200) }
const renderRows = computed(() => {
  const term = (search.value || '').toLowerCase().trim()
  if (!term) return rows.value
  return rows.value.filter(u => [u.nombre, u.email].filter(Boolean).join(' ').toLowerCase().includes(term))
})

/* ============ PAGINACIÓN ============ */
async function nextPage(){ if (!hasNextPage.value || loading.value) return; page.value += 1; await fetchPage() }
async function prevPage(){ if (page.value === 0 || loading.value) return; page.value -= 1; await fetchPage() }

/* ============ MODAL CRUD ============ */
function openCreate() {
  editing.value = false
  editingId.value = null
  form.value = {
    nombre: '',
    email: '',
    empresa: 'Xtreme Servicios',
    monedaPref: 'CLP',
    rol: 'usuario',
    password: '',
    password2: '',
    creadoEn: null,
  }
  showModal()
}
function openEdit(u) {
  editing.value = true
  editingId.value = u.id
  form.value = {
    nombre: u.nombre || '',
    email: u.email || '',
    empresa: u.empresa || 'Xtreme Servicios',
    monedaPref: u.monedaPref || 'CLP',
    rol: u.rol || 'usuario',
    password: '',
    password2: '',
    creadoEn: u.creadoEn || null,
  }
  showModal()
}
function showModal(){ if (!userModal) userModal = new Modal(userModalEl.value); userModal.show() }

/* ============ CREAR USUARIO EN AUTH + PERFIL EN FIRESTORE ============ */
/* Usa un app secundario para NO cerrar la sesión actual del admin */
async function createAuthUserWithoutAffectingSession({ email, password, displayName }) {
  // Tomamos la config del app principal ya inicializado en tu proyecto
  const primary = getApp()
  // Creamos un app secundario efímero con un nombre único
  const secondaryApp = initializeApp(primary.options, `admin-helper-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    const uid = cred.user.uid
    // Importante: no enviamos verificación (Firebase no lo hace automáticamente)
    return uid
  } finally {
    // Cerramos sesión del app secundario para liberar recursos
    try { await signOut(secondaryAuth) } catch(e) {console.error(e)}
    // No es necesario deleteApp(); el GC lo recoge, pero puedes hacerlo si lo prefieres
  }
}

/* ============ SAVE (crear/editar) ============ */
async function save() {
  if (!form.value.nombre || !form.value.email) {
    error.value = 'Nombre y correo son obligatorios.'
    showToast('Completa nombre y correo', 'bi-exclamation-triangle')
    return
  }

  if (!editing.value) {
    if (!form.value.password || form.value.password.length < 6) {
      error.value = 'La contraseña debe tener al menos 6 caracteres.'
      showToast('Contraseña muy corta', 'bi-exclamation-triangle')
      return
    }
    if (form.value.password !== form.value.password2) {
      error.value = 'Las contraseñas no coinciden.'
      showToast('Las contraseñas no coinciden', 'bi-exclamation-triangle')
      return
    }
  }

  saving.value = true
  error.value = ''
  try {
    if (editing.value && editingId.value) {
      // Solo actualizar perfil en Firestore (NO en Authentication)
      await updateDoc(doc(db, 'users', editingId.value), {
        nombre: form.value.nombre,
        email: form.value.email,
        empresa: form.value.empresa,
        monedaPref: form.value.monedaPref,
        rol: form.value.rol,
      })
      showToast('Usuario actualizado', 'bi-check-circle')
    } else {
      // 1) Crear en Authentication usando app secundario ✨
      const uid = await createAuthUserWithoutAffectingSession({
        email: form.value.email,
        password: form.value.password,
        displayName: form.value.nombre,
      })

      // 2) Crear perfil en Firestore con el mismo UID (sin contraseña)
      await setDoc(doc(db, 'users', uid), {
        nombre: form.value.nombre,
        email: form.value.email,
        empresa: form.value.empresa,
        monedaPref: form.value.monedaPref,
        rol: form.value.rol,
        creadoEn: serverTimestamp(),
      })

      showToast('Usuario creado', 'bi-check-circle')
    }

    if (userModal) userModal.hide()
    await fetchPage({ reset: !editing.value })
  } catch (e) {
    console.error(e)
    // Mensajes comunes: auth/email-already-in-use, etc.
    const msg = (e?.message || '').replace('Firebase: ', '').replace('auth/', 'auth: ')
    error.value = `No fue posible guardar el usuario. ${msg}`
    showToast('No se pudo guardar', 'bi-exclamation-triangle')
  } finally {
    saving.value = false
  }
}

/* ============ ELIMINAR (solo Firestore) ============ */
async function remove(u) {
  if (!u?.id) return
  const etiqueta = u.nombre || u.email || u.id
  openConfirm({
    text: etiqueta,
    onYes: async () => {
      try {
        // Solo borramos en Firestore (NO en Authentication)
        await deleteDoc(doc(db, 'users', u.id))
        rows.value = rows.value.filter(x => x.id !== u.id)
        showToast(`Usuario "${etiqueta}" eliminado de la base de datos`, 'bi-check-circle')
      } catch (e) {
        console.error(e)
        error.value = 'No fue posible eliminar el usuario.'
        showToast('No se pudo eliminar', 'bi-exclamation-triangle')
      }
    }
  })
}

/* ============ RELOAD / INIT ============ */
async function reload(reset = false){ await fetchPage({ reset }) }
watch(pageSize, () => reload(true))
watch(rol, () => reload(true))
onMounted(async () => { if (userModalEl.value) userModal = new Modal(userModalEl.value); await reload(true) })
</script>

<style scoped>
.card { border-radius: 0.5rem; }
.badge { font-weight: 600; letter-spacing: .2px; }
.table td, .table th { vertical-align: middle; }
.btn-group .btn { white-space: nowrap; }

/* Snackbar / Toast */
.snackbar{
  position: fixed;
  bottom: 18px; right: 18px;
  background: rgba(25,25,25,.92);
  color: #fff;
  padding: .65rem .9rem;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  z-index: 2100;
}
.snackbar-enter-from{ transform: translateY(12px); opacity: 0; }
.snackbar-enter-active{ transition: all .22s ease; }
.snackbar-leave-to{ transform: translateY(10px); opacity: 0; }
.snackbar-leave-active{ transition: all .16s ease; }

/* Backdrop modal confirm (v-if) */
.modal-backdrop { z-index: 1060; }
.modal { z-index: 1070; }
</style>
