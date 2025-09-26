<!-- src/views/RendicionDetalle.vue -->
<template>
  <!-- Header -->
  <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      <h2 class="h5 mb-0 text-truncate" style="max-width: 60vw;">Detalle de rendición</h2>
      <span v-if="item" :class="['badge', badgeClass(item.estado)]">{{ item.estado }}</span>
      <span v-if="item?.informeId" class="badge text-bg-info">en informe</span>
    </div>

    <div class="btn-group btn-group-sm w-auto d-flex flex-column flex-sm-row gap-2 gap-sm-0">
      <RouterLink class="btn btn-outline-secondary" to="/mis-rendiciones">
        <i class="bi bi-journal-text"></i> Mis rendiciones
      </RouterLink>

      <!-- Acciones edición -->
      <template v-if="!modoEdicion">
        <button v-if="puedeEditar" class="btn btn-primary" @click="entrarEdicion">
          <i class="bi bi-pencil-square"></i> Editar
        </button>
      </template>
      <template v-else>
        <button class="btn btn-outline-secondary" @click="cancelarEdicion" :disabled="guardando">
          <i class="bi bi-x-circle"></i> Cancelar
        </button>
        <button class="btn btn-primary" @click="guardarCambios" :disabled="guardando">
          <span v-if="!guardando"><i class="bi bi-save2"></i> Guardar</span>
          <span v-else class="spinner-border spinner-border-sm"></span>
        </button>
      </template>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="!item" class="text-center py-5">
    <div class="spinner-border"></div>
  </div>

  <div v-else class="row g-3">
    <!-- Columna izquierda -->
    <div class="col-12 col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">

          <!-- Fechas -->
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="text-muted small">Creada</div>
              <div class="fw-semibold">{{ formatFechaHora(item.creadoEn || item.fecha) }}</div>
            </div>
            <div class="text-end">
              <div class="text-muted small">Última actualización</div>
              <div class="fw-semibold">{{ formatFechaHora(item.actualizadoEn || item.creadoEn || item.fecha) }}</div>
            </div>
          </div>

          <hr />

          <!-- ====== MODO SOLO LECTURA ====== -->
          <div v-if="!modoEdicion" class="row g-3">
            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Monto</div>
                <div class="fs-4 fw-semibold">{{ formatMoney(item.monto, item.moneda || 'CLP') }}</div>
                <div class="small text-muted">{{ item.moneda || 'CLP' }}</div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Categoría</div>
                <div class="fw-semibold">{{ item.categoria || '—' }}</div>
                <div class="text-muted small mt-2">Fecha del gasto</div>
                <div class="fw-semibold">{{ formatFecha(item.fecha) }}</div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Tipo documento</div>
                <div class="fw-semibold">{{ item.tipoDocumento || '—' }}</div>
                <div class="text-muted small mt-2">Folio / N°</div>
                <div class="fw-semibold">{{ item.numeroDocumento || item.folio || '—' }}</div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Usuario</div>
                <div class="fw-semibold">{{ item.nombre || '—' }}</div>
                <div class="small text-muted">{{ item.email || '—' }}</div>
              </div>
            </div>

            <div class="col-12">
              <div class="border rounded p-3">
                <div class="text-muted small">Motivo</div>
                <div class="fw-semibold">{{ item.motivo || '—' }}</div>
                <div v-if="item.notas" class="mt-2">
                  <div class="text-muted small">Notas</div>
                  <div style="white-space: pre-wrap">{{ item.notas }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== MODO EDICIÓN ====== -->
          <form v-else class="row g-3" @submit.prevent="guardarCambios">
            <!-- Monto + Moneda -->
            <div class="col-md-4">
              <label class="form-label">Monto</label>
              <div class="input-group">
                <span class="input-group-text">{{ simboloMoneda }}</span>
                <input v-model.number="form.monto" @blur="normalizarMonto" :step="stepMoneda" :min="0" type="number"
                  inputmode="decimal" class="form-control" required />
              </div>
              <div class="form-text">Ej.: 12500 CLP, 12.50 USD/EUR, 1.2 UF</div>
            </div>

            <div class="col-md-4">
              <label class="form-label">Moneda</label>
              <select v-model="form.moneda" class="form-select" @change="syncStep" required>
                <option value="CLP">CLP — Peso chileno</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="UF">UF — Unidad de Fomento</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label">Fecha del gasto</label>
              <input v-model="form.fechaStr" type="date" class="form-control" required />
            </div>

            <!-- Documento -->
            <div class="col-md-6">
              <label class="form-label">Documento</label>
              <div class="input-group">
                <select v-model="form.tipoDocumento" class="form-select" required>
                  <option disabled value="">Selecciona...</option>
                  <option value="Boleta">Boleta</option>
                  <option value="Factura">Factura</option>
                </select>
                <input v-model.trim="form.numeroDocumento" class="form-control" placeholder="N° de boleta/factura"
                  required maxlength="30"
                  @input="form.numeroDocumento = form.numeroDocumento.replace(/[^0-9A-Za-z-]/g, '')" />
              </div>
              <div class="form-text">Se guarda como <strong>folio</strong> y número del documento.</div>
            </div>

            <!-- Categoría -->
            <div class="col-md-6">
              <label class="form-label">Categoría</label>
              <select v-model="form.categoria" class="form-select" required>
                <option disabled value="">Selecciona...</option>
                <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <!-- Motivo + Notas -->
            <div class="col-md-6">
              <label class="form-label">Motivo</label>
              <input v-model="form.motivo" class="form-control" required placeholder="Ej: Taxi a reunión con cliente" />
            </div>
            <div class="col-12">
              <label class="form-label">Notas</label>
              <textarea v-model="form.notas" class="form-control" rows="2"
                placeholder="Detalle adicional, centro de costo, etc."></textarea>
            </div>

            <!-- Comprobante -->
            <div class="col-12">
              <div class="d-flex justify-content-between align-items-center">
                <label class="form-label mb-0">Comprobante</label>
                <small class="text-muted">Miniatura base64 en Firestore. Para archivos grandes considera
                  Storage.</small>
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-7">
                  <div class="input-group">
                    <input ref="fileInput" type="file" accept="image/*" class="form-control" @change="onFile">
                    <button class="btn btn-outline-secondary" type="button" @click="quitarFoto"
                      :disabled="!form.fotoPreview">
                      <i class="bi bi-x-circle"></i> Quitar
                    </button>
                  </div>
                  <div class="form-text">JPG/PNG; se comprime a máx. 1280px.</div>
                </div>
                <div class="col-md-5" v-if="form.fotoPreview">
                  <div class="border rounded p-2 d-flex align-items-center justify-content-center bg-light">
                    <img :src="form.fotoPreview" alt="Vista previa" class="img-fluid rounded"
                      style="max-height: 220px;" />
                  </div>
                  <div class="small text-muted mt-1">Vista previa</div>
                </div>
              </div>
            </div>

            <!-- Vista previa -->
            <div class="col-12">
              <div class="alert alert-light border d-flex justify-content-between align-items-center">
                <div>
                  <div class="small text-muted">Vista previa del monto</div>
                  <div class="fw-semibold">{{ previewMonto }}</div>
                </div>
                <span class="badge" :class="badgeClass(item.estado)">{{ item.estado }}</span>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>

    <!-- Columna derecha -->
    <div class="col-12 col-lg-4">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Usuario</div>
          <div class="fw-semibold">{{ item.nombre || '—' }}</div>
          <div class="small text-muted">{{ item.email || '—' }}</div>
          <div class="text-muted small mt-1">Empresa</div>
          <div class="fw-semibold">{{ item.empresa || '—' }}</div>
          <div class="text-muted small">Fecha del gasto</div>
          <div class="fw-semibold">{{ formatFecha(item.fecha) }}</div>
          <hr>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Comprobante</h6>
            <span v-if="!imagenActual" class="badge text-bg-secondary">Sin imagen</span>
          </div>

          <div v-if="imagenActual" class="border rounded p-2 text-center bg-light">
            <img :src="imagenActual" alt="Comprobante" class="img-fluid rounded"
              style="cursor: zoom-in; max-height: 360px;" @click="abrirModalImagen = true" />
          </div>
          <div v-else class="text-muted small">
            No se adjuntó imagen.
          </div>

          <div v-if="imagenActual" class="d-flex gap-2 mt-2 flex-column flex-sm-row">
            <a :href="imagenActual" download="comprobante.jpg" class="btn btn-outline-secondary btn-sm w-100">
              <i class="bi bi-download"></i> Descargar
            </a>
            <button class="btn btn-outline-secondary btn-sm w-100" @click="abrirModalImagen = true">
              <i class="bi bi-arrows-fullscreen"></i> Ampliar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== Modal imagen con viewer (zoom/rotar/drag) ===== -->
  <div class="modal fade" tabindex="-1" :class="{ show: abrirModalImagen }"
    style="display: block; background: rgba(0,0,0,.5);" v-if="abrirModalImagen" @click.self="abrirModalImagen = false">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h6 class="modal-title">Comprobante</h6>
          <button type="button" class="btn-close" @click="abrirModalImagen = false"></button>
        </div>

        <!-- Toolbar -->
        <div class="p-2 border-bottom d-flex flex-wrap gap-2">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :disabled="!imagenActual" @click="rotate(-90)">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
            <button class="btn btn-outline-secondary" :disabled="!imagenActual" @click="rotate(90)">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>

          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :disabled="!imagenActual" @click="zoomOut">
              <i class="bi bi-zoom-out"></i>
            </button>
            <button class="btn btn-outline-secondary" :disabled="!imagenActual" @click="zoomIn">
              <i class="bi bi-zoom-in"></i>
            </button>
            <button class="btn btn-outline-secondary" :disabled="!imagenActual" @click="resetView">
              <i class="bi bi-aspect-ratio"></i>
            </button>
          </div>

          <div class="ms-auto small d-flex align-items-center gap-2">
            <span>Zoom: {{ (viewer.zoom * 100).toFixed(0) }}%</span>
            <span>·</span>
            <span>Rotación: {{ viewer.rotate }}°</span>
          </div>
        </div>

        <!-- Stage -->
        <div class="viewer-stage" @wheel.prevent="onWheel" @mousedown="onDragStart" @mousemove="onDragMove"
          @mouseup="onDragEnd" @mouseleave="onDragEnd" @touchstart.passive="onTouchStart"
          @touchmove.prevent="onTouchMove" @touchend="onTouchEnd">
          <div class="viewer-wrap" :style="{
            transform:
              'translate(' + viewer.tx + 'px,' + viewer.ty + 'px) ' +
              'scale(' + viewer.zoom + ') ' +
              'rotate(' + viewer.rotate + 'deg)'
          }" :class="{ 'is-grabbable': viewer.zoom > 1, 'is-grabbing': viewer.dragging }">
            <img v-if="imagenActual" :src="imagenActual" alt="Comprobante" />
            <div v-else class="viewer-empty">
              <i class="bi bi-receipt fs-1"></i>
              <div class="small text-muted mt-1">Sin imagen</div>
            </div>
          </div>
        </div>

        <div class="modal-footer py-2">
          <a :href="imagenActual" download="comprobante.jpg" class="btn btn-primary" :disabled="!imagenActual">
            <i class="bi bi-download"></i> Descargar
          </a>
          <button class="btn btn-secondary" @click="abrirModalImagen = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <Teleport to="body">
    <Transition name="snackbar">
      <div v-if="toast.show" class="snackbar shadow">
        <i class="bi me-2" :class="toast.icon"></i>
        <span>{{ toast.text }}</span>
        <button class="btn btn-sm btn-link text-white ms-2" @click="toast.show = false">Cerrar</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()

const item = ref(null)
const error = ref('')
const guardando = ref(false)
const abrirModalImagen = ref(false)

/** Categorías */
const CATEGORIAS = [
  'Gastos de estacionamiento',
  'Gastos notariales y legales',
  'Gastos de bencina con boleta',
  'Artículos de aseo con boleta',
  'Útiles y Artículos de oficina con boleta',
  'Gastos varios con boleta',
  'proveedores',
  'Gastos de colación con boleta',
  'Gastos de movilización - pasajes con boletas'
]

/** Modo edición controlado por: query ?edit=1 OR botón "Editar" y regla puedeEditar */
const modoEdicion = ref(false)
const puedeEditar = computed(() => {
  const it = item.value
  return !!it && it.estado === 'borrador' && !it.informeId
})
function entrarEdicion() {
  if (!puedeEditar.value) return
  modoEdicion.value = true
  // hidratar form con datos actuales
  form.value = {
    monto: Number(item.value.monto || 0),
    moneda: item.value.moneda || 'CLP',
    categoria: item.value.categoria || '',
    motivo: item.value.motivo || '',
    notas: item.value.notas || '',
    fechaStr: toInputDate(item.value.fecha),
    tipoDocumento: item.value.tipoDocumento || '',
    numeroDocumento: item.value.numeroDocumento || item.value.folio || '',
    fotoPreview: item.value.fotoPreview || null
  }
  syncStep()
  router.replace({ name: 'detalle', params: { id: route.params.id }, query: { ...route.query, edit: 1 } })
}
function cancelarEdicion() {
  modoEdicion.value = false
  const q = { ...route.query }
  delete q.edit
  router.replace({ name: 'detalle', params: { id: route.params.id }, query: q })
}

/** FORM STATE (solo se usa en edición) */
const form = ref({
  monto: null,
  moneda: 'CLP',
  categoria: '',
  motivo: '',
  notas: '',
  fechaStr: '',
  tipoDocumento: '',
  numeroDocumento: '',
  fotoPreview: null
})
const fileInput = ref(null)

/** Cargar doc */
onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'rendiciones', route.params.id))
    if (!snap.exists()) { error.value = 'Rendición no encontrada.'; return }
    item.value = { id: snap.id, ...snap.data() }

    // si viene con ?edit=1 y se puede, abrir edición
    if (route.query.edit === '1' && puedeEditar.value) entrarEdicion()
  } catch (e) {
    console.error(e); error.value = 'Error al cargar la rendición.'
  }
})
watch(() => route.query.edit, (val) => {
  if (val === '1' && puedeEditar.value) entrarEdicion()
  if (val !== '1' && modoEdicion.value) cancelarEdicion()
})

/** Imagen mostrada (read-only card) o la de edición si hay reemplazo */
const imagenActual = computed(() => modoEdicion.value ? (form.value.fotoPreview || item.value.fotoPreview) : item.value.fotoPreview)

/** Helpers formato */
function toInputDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
  } catch { return '' }
}
const simboloMoneda = computed(() => ({ CLP: '$', USD: '$', EUR: '€', UF: 'UF' }[form.value.moneda] || '$'))
const stepMoneda = ref(100)
const syncStep = () => { stepMoneda.value = (form.value.moneda === 'CLP') ? 100 : 0.01 }
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF') return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
  return n
}
const previewMonto = computed(() => formatMoney(form.value.monto, form.value.moneda))
const normalizarMonto = () => {
  if (form.value.monto == null || form.value.monto === '') return
  let n = Number(form.value.monto)
  if (Number.isNaN(n) || n < 0) n = 0
  form.value.monto = (form.value.moneda === 'CLP') ? Math.round(n) : Math.round(n * 100) / 100
}
const badgeClass = (estado) =>
  ({ borrador: 'text-bg-secondary', pendiente: 'text-bg-warning', aprobada: 'text-bg-success', rechazada: 'text-bg-danger' }[estado] || 'text-bg-secondary')
const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) }
  catch { return '-' }
}
const formatFechaHora = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d) }
  catch { return '-' }
}

/** Imagen: comprimir / setear / quitar (en edición) */
async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    form.value.fotoPreview = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.8 })
  } catch (err) {
    console.error(err)
    showToast('No pudimos procesar la imagen', 'bi-exclamation-triangle')
    if (fileInput.value) fileInput.value.value = ''
  }
}
function quitarFoto() {
  form.value.fotoPreview = null
  if (fileInput.value) fileInput.value.value = ''
}
const compressImageToDataURL = (file, { maxW = 1280, maxH = 1280, quality = 0.8 } = {}) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxW / width, maxH / height, 1)
        const w = Math.round(width * ratio)
        const h = Math.round(height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const isPng = file.type.includes('png')
        const mime = isPng ? 'image/png' : 'image/jpeg'
        const dataURL = canvas.toDataURL(mime, isPng ? undefined : quality)
        const approxBytes = Math.ceil((dataURL.length * 3) / 4)
        if (approxBytes > 250 * 1024) return reject(new Error('La miniatura quedó muy grande.'))
        resolve(dataURL)
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/** Guardar cambios (solo en edición) */
async function guardarCambios() {
  try {
    if (!modoEdicion.value || !item.value) return
    guardando.value = true
    if (!form.value.tipoDocumento || !form.value.numeroDocumento) throw new Error('Falta tipo y/o número de documento.')
    if (!form.value.fechaStr) throw new Error('Falta la fecha del gasto.')

    const updates = {
      monto: Number(form.value.monto || 0),
      moneda: form.value.moneda,
      categoria: form.value.categoria,
      motivo: (form.value.motivo || '').trim(),
      notas: (form.value.notas || '').trim() || null,

      tipoDocumento: form.value.tipoDocumento,
      numeroDocumento: form.value.numeroDocumento,
      folio: form.value.numeroDocumento,
      ...(form.value.tipoDocumento === 'Boleta' ? { numeroBoleta: form.value.numeroDocumento, numeroFactura: null } : {}),
      ...(form.value.tipoDocumento === 'Factura' ? { numeroFactura: form.value.numeroDocumento, numeroBoleta: null } : {}),

      fecha: form.value.fechaStr ? Timestamp.fromDate(new Date(form.value.fechaStr)) : null,
      fotoPreview: form.value.fotoPreview ?? item.value.fotoPreview ?? null,

      actualizadoEn: serverTimestamp()
    }

    await updateDoc(doc(db, 'rendiciones', item.value.id), updates)
    item.value = { ...item.value, ...updates }
    modoEdicion.value = false
    showToast('Cambios guardados', 'bi-check-circle')
  } catch (e) {
    console.error(e)
    error.value = e.message || 'No se pudieron guardar los cambios.'
  } finally {
    guardando.value = false
  }
}

/** Navegación / impresión */
const volver = () => router.back()

/** Toast */
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast(text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 2500)
}

/* ======== Viewer Imagen (zoom/rotar/arrastrar) ======== */
const viewer = ref({
  zoom: 1,
  rotate: 0,
  tx: 0,  // translateX (px)
  ty: 0,  // translateY (px)
  dragging: false,
  startX: 0,
  startY: 0,
  startTx: 0,
  startTy: 0,
  pinchDist: 0,
  startZoom: 1
})

function clampZoom(z) { return Math.min(5, Math.max(0.2, z)) }
function resetView() {
  viewer.value.zoom = 1
  viewer.value.rotate = 0
  viewer.value.tx = 0
  viewer.value.ty = 0
}
function zoomIn() { viewer.value.zoom = clampZoom(viewer.value.zoom + 0.2) }
function zoomOut() { viewer.value.zoom = clampZoom(viewer.value.zoom - 0.2) }
function rotate(deg) { viewer.value.rotate = (viewer.value.rotate + deg) % 360 }

// Zoom con scroll
function onWheel(e) {
  const delta = e.deltaY
  const step = 0.15
  viewer.value.zoom = clampZoom(viewer.value.zoom + (delta > 0 ? -step : step))
}

// Drag con mouse
function onDragStart(e) {
  viewer.value.dragging = true
  viewer.value.startX = e.clientX
  viewer.value.startY = e.clientY
  viewer.value.startTx = viewer.value.tx
  viewer.value.startTy = viewer.value.ty
}
function onDragMove(e) {
  if (!viewer.value.dragging) return
  viewer.value.tx = viewer.value.startTx + (e.clientX - viewer.value.startX)
  viewer.value.ty = viewer.value.startTy + (e.clientY - viewer.value.startY)
}
function onDragEnd() { viewer.value.dragging = false }

// Táctil: pinza y arrastre
function distance(t1, t2) {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.hypot(dx, dy)
}
function onTouchStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    viewer.value.dragging = true
    viewer.value.startX = t.clientX
    viewer.value.startY = t.clientY
    viewer.value.startTx = viewer.value.tx
    viewer.value.startTy = viewer.value.ty
  } else if (e.touches.length === 2) {
    viewer.value.dragging = false
    viewer.value.pinchDist = distance(e.touches[0], e.touches[1])
    viewer.value.startZoom = viewer.value.zoom
  }
}
function onTouchMove(e) {
  if (e.touches.length === 1 && viewer.value.dragging) {
    const t = e.touches[0]
    viewer.value.tx = viewer.value.startTx + (t.clientX - viewer.value.startX)
    viewer.value.ty = viewer.value.startTy + (t.clientY - viewer.value.startY)
  } else if (e.touches.length === 2) {
    const d = distance(e.touches[0], e.touches[1])
    const factor = d / (viewer.value.pinchDist || d)
    viewer.value.zoom = clampZoom(viewer.value.startZoom * factor)
  }
}
function onTouchEnd() { viewer.value.dragging = false }

// Resetea vista al abrir el modal
watch(abrirModalImagen, (v) => { if (v) resetView() })
</script>

<style scoped>
/* Toast */
.snackbar {
  position: fixed;
  bottom: 18px;
  right: 18px;
  background: rgba(25, 25, 25, .92);
  color: #fff;
  padding: .65rem .9rem;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  z-index: 2100;
}

.snackbar-enter-from {
  transform: translateY(12px);
  opacity: 0;
}

.snackbar-enter-active {
  transition: all .22s ease;
}

.snackbar-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.snackbar-leave-active {
  transition: all .16s ease;
}

.badge {
  text-transform: capitalize;
}

/* Modal SPA */
.modal.show {
  display: block;
}

/* ====== Image Viewer ====== */
.viewer-stage {
  position: relative;
  height: min(70vh, 680px);
  background: #0b1220;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.viewer-wrap {
  will-change: transform;
  transition: transform .08s ease-out;
  user-select: none;
  pointer-events: none;
  /* la imagen no captura eventos, el stage sí */
}

.viewer-wrap img {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
}

.viewer-empty {
  color: #cbd5e1;
  display: grid;
  place-items: center;
  width: 380px;
  height: 280px;
  border: 1px dashed rgba(255, 255, 255, .25);
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
}

/* Cursors para mejor UX */
.viewer-wrap.is-grabbable {
  cursor: grab;
}

.viewer-wrap.is-grabbing {
  cursor: grabbing;
}
</style>
