<template>
  <div class="card shadow-sm">
    <div class="card-body">
      <!-- Header -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h2 class="h5 mb-1">Nueva rendición</h2>
          <p class="text-muted mb-0">Registra un gasto con su detalle y (opcional) una foto del comprobante.</p>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="volver">
            <i class="bi bi-arrow-left me-1"></i> Volver
          </button>
          <RouterLink to="/mis-rendiciones" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-journal-text me-1"></i> Mis rendiciones
          </RouterLink>
        </div>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="guardar" class="needs-validation" novalidate>
        <div class="row g-3">
          <!-- Monto + Moneda -->
          <div class="col-md-4">
            <label class="form-label">Monto</label>
            <div class="input-group">
              <span class="input-group-text">{{ simboloMoneda }}</span>
              <input
                v-model.number="monto"
                @blur="normalizarMonto"
                :step="stepMoneda"
                :min="0"
                type="number"
                inputmode="decimal"
                class="form-control"
                required
              />
            </div>
            <div class="form-text">Ej.: 12500 para CLP, 12.50 para USD/EUR, 1.2 para UF</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Moneda</label>
            <select v-model="moneda" class="form-select" @change="syncStep" required>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="UF">UF — Unidad de Fomento</option>
            </select>
            <div class="form-text">Solo se guarda el monto con su moneda (sin conversión automática).</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Fecha del gasto</label>
            <input v-model="fecha" type="date" class="form-control" required />
          </div>

          <!-- Documento: tipo + número -->
          <div class="col-md-6">
            <label class="form-label">Documento</label>
            <div class="input-group">
              <select v-model="tipoDoc" class="form-select" required>
                <option disabled value="">Selecciona...</option>
                <option value="Boleta">Boleta</option>
                <option value="Factura">Factura</option>
              </select>
              <input
                v-model.trim="numeroDoc"
                class="form-control"
                placeholder="N° de boleta/factura"
                required
                maxlength="30"
                @input="numeroDoc = numeroDoc.replace(/[^0-9A-Za-z-]/g,'')"
              />
            </div>
            <div class="form-text">Ingresa el número tal como aparece en el comprobante.</div>
          </div>

          <!-- Categoría -->
          <div class="col-md-6">
            <label class="form-label">Categoría</label>
            <select v-model="categoria" class="form-select" required>
              <option disabled value="">Selecciona...</option>
              <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Motivo</label>
            <input v-model="motivo" class="form-control" required placeholder="Ej: Taxi a reunión con cliente" />
          </div>

          <div class="col-12">
            <label class="form-label">Notas (opcional)</label>
            <textarea v-model="notas" class="form-control" rows="2" placeholder="Detalle adicional, centro de costo, etc."></textarea>
          </div>

          <!-- Comprobante -->
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0">Comprobante (opcional)</label>
              <small class="text-muted">Miniatura en Firestore. Para archivos completos, usar Storage.</small>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-md-7">
                <div class="input-group">
                  <input
                    ref="fileInput"
                    @change="onFile"
                    type="file"
                    accept="image/*"
                    class="form-control"
                  />
                  <button class="btn btn-outline-secondary" type="button" @click="openPhotoCapture">
                    <i class="bi bi-camera"></i> Tomar foto
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="limpiarFoto" :disabled="!fotoPreview">
                    <i class="bi bi-x-circle"></i>
                    Quitar
                  </button>
                </div>
                <div class="form-text">JPG/PNG; se comprime a máx. 1280px para la miniatura.</div>
              </div>

              <div class="col-md-5" v-if="fotoPreview">
                <div class="border rounded p-2 d-flex align-items-center justify-content-center bg-light">
                  <img :src="fotoPreview" alt="Vista previa" class="img-fluid rounded" style="max-height: 220px;" />
                </div>
                <div class="small text-muted mt-1">Vista previa</div>
              </div>
            </div>
          </div>

          <!-- ESCÁNER QR / BARRAS -->
          <div class="col-12">
            <label class="form-label">Escanear código (QR o barras)</label>
            <div class="p-2 rounded border bg-light-subtle">
              <!-- Estado inactivo -->
              <div v-if="!scannerActive" class="d-grid gap-2">
                <button class="btn btn-outline-danger" type="button" @click="startScanner">
                  <i class="bi bi-qr-code-scan me-1"></i> Activar cámara
                </button>
                <small class="text-muted">
                  Apunta al QR o código de barras de la boleta/factura. Requiere HTTPS y permiso de cámara.
                </small>
                <div v-if="scannerInfo" class="small text-muted">{{ scannerInfo }}</div>
              </div>

              <!-- Estado activo -->
              <div v-else>
                <div class="position-relative rounded overflow-hidden" style="background:#000">
                  <video ref="videoEl" autoplay playsinline muted class="w-100" style="max-height:280px; object-fit:cover"></video>
                  <canvas ref="canvasEl" class="d-none"></canvas>
                  <div
                    class="position-absolute top-50 start-50 translate-middle border border-2 border-danger rounded"
                    style="width:70%; height:55%; pointer-events:none;"
                  ></div>
                </div>

                <div class="d-flex gap-2 mt-2 flex-wrap align-items-center">
                  <button class="btn btn-outline-secondary" type="button" @click="stopScanner">
                    <i class="bi bi-stop-circle me-1"></i> Detener
                  </button>
                  <button class="btn btn-outline-danger" type="button" @click="switchCamera" v-if="canSwitchCamera">
                    <i class="bi bi-camera-reverse me-1"></i> Cambiar cámara
                  </button>
                  <button class="btn btn-outline-secondary" type="button" @click="toggleTorch">
                    <i class="bi bi-lightning-charge me-1"></i> Linterna
                  </button>
                  <div class="ms-auto d-flex align-items-center gap-2">
                    <small>Zoom</small>
                    <input type="range" min="1" :max="maxZoom" step="0.1" v-model.number="zoomLevel" @input="setZoom(zoomLevel)" style="width:140px" />
                  </div>
                </div>

                <div v-if="scannerInfo" class="small text-muted mt-1">{{ scannerInfo }}</div>
                <div v-if="scanError" class="text-danger small mt-2">{{ scanError }}</div>
              </div>
            </div>

            <!-- Resultado -->
            <div v-if="lastScan" class="alert alert-light border mt-2 small">
              <div class="fw-semibold mb-1">Código leído</div>
              <div class="text-break">{{ lastScan }}</div>
              <div class="mt-2">
                <span v-if="autofillInfo.montoOk" class="badge text-bg-success me-1">Monto actualizado</span>
                <span v-if="autofillInfo.fechaOk" class="badge text-bg-success me-1">Fecha actualizada</span>
                <span v-if="autofillInfo.catOk" class="badge text-bg-success me-1">Categoría sugerida</span>
              </div>
            </div>
          </div>

          <!-- Vista previa de formato -->
          <div class="col-12">
            <div class="alert alert-light border d-flex justify-content-between align-items-center">
              <div>
                <div class="small text-muted">Vista previa del monto</div>
                <div class="fw-semibold">{{ previewMonto }}</div>
              </div>
            </div>
          </div>

          <!-- Tips -->
          <div class="col-12">
            <div class="alert alert-secondary py-2">
              <ul class="mb-0 ps-3">
                <li>Revisa la categoría y la moneda antes de guardar.</li>
                <li>Asegúrate de que la fecha coincida con el comprobante.</li>
                <li>Montos altos podrían requerir aprobación adicional.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-primary" :disabled="cargando" @click.prevent="guardar">
            <span v-if="!cargando"><i class="bi bi-check2-circle me-1"></i> Guardar (borrador)</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
          <button class="btn btn-success" type="button" :disabled="cargando" @click="enviar">
            <span v-if="!cargando"><i class="bi bi-send-check me-1"></i> Guardar y enviar</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
          <button class="btn btn-outline-secondary" type="button" @click="limpiarFormulario" :disabled="cargando">
            Limpiar
          </button>
        </div>

        <!-- Mensajes inline -->
        <p v-if="error" class="text-danger small mt-3">{{ error }}</p>
      </form>
    </div>
  </div>

  <!-- Modal Tomar foto -->
  <div v-if="photoActive" class="modal-backdrop-custom" @click.self="closePhotoCapture">
    <div class="modal-card">
      <div class="modal-header">
        <h5 class="modal-title"><i class="bi bi-camera me-2"></i> Tomar foto del comprobante</h5>
        <button type="button" class="btn-close" @click="closePhotoCapture"></button>
      </div>

      <div class="modal-body">
        <div class="position-relative rounded overflow-hidden" style="background:#000">
          <video
            ref="photoVideoEl"
            autoplay
            playsinline
            muted
            class="w-100"
            style="max-height:420px; object-fit:cover"
          ></video>
          <canvas ref="photoCanvasEl" class="d-none"></canvas>
        </div>

        <div class="small mt-2" :class="photoReady ? 'text-success' : 'text-muted'">
          <template v-if="!photoReady">
            <span class="spinner-border spinner-border-sm me-1"></span> Preparando cámara…
          </template>
          <template v-else>
            Cámara lista.
          </template>
        </div>

        <div v-if="photoError" class="text-danger small mt-2">{{ photoError }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline-secondary" type="button" @click="closePhotoCapture">
          Cancelar
        </button>
        <button class="btn btn-danger" type="button" @click="capturePhoto" :disabled="!photoReady">
          <i class="bi bi-camera-fill me-1"></i> Capturar
        </button>
      </div>
    </div>
  </div>

  <!-- Toast / Snackbar -->
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
import { ref, computed, onBeforeUnmount, nextTick, onMounted  } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { addDoc, collection, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const route = useRoute()
const auth = useAuthStore()
const router = useRouter()

/* ===== Toast ===== */
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast (text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 2600)
}

/* Utils de prefilling por copia */
function toInputDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2,'0')
    const da = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${da}`
  } catch { return '' }
}
function prefillFromDocData(data) {
  monto.value      = Number(data.monto || 0)
  moneda.value     = data.moneda || 'CLP'
  categoria.value  = data.categoria || ''
  motivo.value     = data.motivo || ''
  notas.value      = data.notas || ''
  fecha.value      = toInputDate(data.fecha)
  tipoDoc.value    = data.tipoDocumento || ''
  numeroDoc.value  = data.numeroDocumento || data.folio || ''
  fotoPreview.value = null
  syncStep()
}
onMounted(async () => {
  const copyFrom = route.query.copyFrom
  if (!copyFrom) return
  try {
    const snap = await getDoc(doc(db, 'rendiciones', String(copyFrom)))
    if (snap.exists()) { prefillFromDocData(snap.data()); error.value = '' }
    else { error.value = 'No se encontró la rendición a copiar.' }
  } catch (e) { console.error(e); error.value = 'No fue posible copiar los datos.' }
})

/* Categorías */
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

/* Form state */
const monto = ref(null)
const moneda = ref('CLP')
const categoria = ref('')
const motivo = ref('')
const notas = ref('')
const fecha = ref('')
const tipoDoc = ref('')
const numeroDoc = ref('')

/* Foto */
const fileInput = ref(null)
const fotoPreview = ref(null)

/* UI */
const cargando = ref(false)
const error = ref('')

/* Helpers */
const simboloMoneda = computed(() => ({ CLP: '$', USD: '$', EUR: '€', UF: 'UF' }[moneda.value] || '$'))
const stepMoneda = ref(100)
const syncStep = () => { stepMoneda.value = (moneda.value === 'CLP') ? 100 : 0.01 }
syncStep()
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF') return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
  return n
}
const previewMonto = computed(() => formatMoney(monto.value, moneda.value))
const normalizarMonto = () => {
  if (monto.value == null || monto.value === '') return
  let n = Number(monto.value)
  if (Number.isNaN(n) || n < 0) n = 0
  monto.value = (moneda.value === 'CLP') ? Math.round(n) : Math.round(n * 100) / 100
}

const volver = () => router.back()
const limpiarFoto = () => { fotoPreview.value = null; if (fileInput.value) fileInput.value.value = '' }
const limpiarFormulario = () => {
  monto.value = null; moneda.value = 'CLP'; categoria.value = ''; motivo.value = ''
  notas.value = ''; fecha.value = ''; tipoDoc.value = ''; numeroDoc.value = ''
  limpiarFoto(); error.value = ''; syncStep()
}
const onFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    fotoPreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.7 })
  } catch (err) {
    console.error(err)
    error.value = 'No pudimos procesar la imagen.'
    limpiarFoto()
  }
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
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const isPng = file.type.includes('png')
        const mime = isPng ? 'image/png' : 'image/jpeg'
        const dataURL = canvas.toDataURL(mime, isPng ? undefined : quality)
        const approxBytes = Math.ceil((dataURL.length * 3) / 4)
        if (approxBytes > 250 * 1024) return reject(new Error('La miniatura quedó muy grande. Intenta otra foto.'))
        resolve(dataURL)
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/* ---------- ESCÁNER ---------- */
const videoEl = ref(null)
const canvasEl = ref(null)
const scannerActive = ref(false)
const scanError = ref('')
const lastScan = ref('')
const scannerInfo = ref('')
const canSwitchCamera = ref(false)
let currentFacing = 'environment'
let mediaStream = null
let rafId = null
let barcodeDetector = null
let zxingReader = null
let currentTrack = null
let currentDeviceId = null
const torchOn = ref(false)
const zoomLevel = ref(1)
const maxZoom = ref(1)
const autofillInfo = ref({ montoOk: false, fechaOk: false, catOk: false })

function waitForVideoReady (v) {
  return new Promise((resolve) => {
    if (!v) return resolve()
    if (v.readyState >= 2 && v.videoWidth) return resolve()
    const onReady = () => {
      v.removeEventListener('loadedmetadata', onReady)
      v.removeEventListener('canplay', onReady)
      resolve()
    }
    v.addEventListener('loadedmetadata', onReady, { once: true })
    v.addEventListener('canplay', onReady, { once: true })
  })
}
async function listVideoInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter(d => d.kind === 'videoinput')
}
function getZXingHints() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODABAR,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.AZTEC,
    BarcodeFormat.PDF_417,
  ])
  hints.set(DecodeHintType.TRY_HARDER, true)
  return hints
}
async function startScanner () {
  scanError.value = ''
  lastScan.value = ''
  autofillInfo.value = { montoOk: false, fechaOk: false, catOk: false }
  scannerInfo.value = ''
  try {
    await closePhotoCapture()
    scannerActive.value = true
    await nextTick()

    const wantFormats = [
      'qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e','itf','codabar','data_matrix','aztec','pdf417'
    ]
    if ('BarcodeDetector' in window && !barcodeDetector) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats?.() || []
        const formats = wantFormats.filter(f => supported.includes(f))
        if (formats.length) {
          barcodeDetector = new window.BarcodeDetector({ formats })
          scannerInfo.value = `Detector nativo: ${formats.join(', ')}`
        } else {
          scannerInfo.value = 'Detector nativo sin formatos útiles; usaré ZXing.'
        }
      } catch {
        scannerInfo.value = 'Detector nativo no disponible; usaré ZXing.'
      }
    }

    const constraints = {
      video: {
        facingMode: currentFacing,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }],
      },
      audio: false
    }
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    const v = videoEl.value
    if (!v) throw new Error('No se encontró el elemento <video>.')
    v.srcObject = mediaStream
    v.setAttribute('playsinline', '')
    v.setAttribute('autoplay', '')
    await v.play().catch(()=>{})
    await waitForVideoReady(v)

    const inputs = await navigator.mediaDevices.enumerateDevices()
    canSwitchCamera.value = inputs.filter(d => d.kind === 'videoinput').length > 1

    currentTrack = mediaStream.getVideoTracks()[0]
    try {
      const caps = currentTrack.getCapabilities?.() || {}
      if (caps.zoom) {
        maxZoom.value = caps.zoom.max || 1
        await currentTrack.applyConstraints({ advanced: [{ zoom: Math.min(2, maxZoom.value) }] })
        zoomLevel.value = Math.min(2, maxZoom.value)
      }
    } catch { /* no-op */ }
    await new Promise(r => setTimeout(r, 500))

    if (barcodeDetector) {
      loopDetectNative()
    } else {
      zxingReader = new BrowserMultiFormatReader(getZXingHints(), 700)
      const cams = inputs.filter(d => d.kind === 'videoinput')
      const back = cams.find(d => /back|trasera|rear/i.test(d.label)) || cams[0]
      currentDeviceId = back?.deviceId || undefined
      scannerInfo.value = 'Usando ZXing (WASM).'
      zxingReader.decodeFromVideoDevice(currentDeviceId ?? null, videoEl.value, (result) => {
        if (result?.getText) handleScan(result.getText())
      })
    }
  } catch (e) {
    console.error(e)
    scanError.value = e?.message || 'No se pudo activar la cámara.'
    stopScanner()
  }
}
function loopDetectNative () {
  const tick = async () => {
    if (!scannerActive.value || !videoEl.value || !barcodeDetector) return
    try {
      const v = videoEl.value
      const c = canvasEl.value
      if (c && v.videoWidth && v.videoHeight) {
        c.width = v.videoWidth
        c.height = v.videoHeight
        const ctx = c.getContext('2d')
        ctx.drawImage(v, 0, 0, c.width, c.height)
        const detections = await barcodeDetector.detect(c)
        if (detections && detections.length) {
          const value = detections[0].rawValue || detections[0].rawValueText || ''
          if (value) { handleScan(value); return }
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (e){ /* ignore */ }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}
async function switchCamera () {
  try {
    if (zxingReader) {
      const inputs = await listVideoInputs()
      if (!inputs.length) return
      const idx = inputs.findIndex(d => d.deviceId === currentDeviceId)
      const next = inputs[(idx + 1) % inputs.length]
      currentDeviceId = next.deviceId
      await zxingReader.decodeFromVideoDevice(currentDeviceId, videoEl.value, (result) => {
        if (result?.getText) handleScan(result.getText())
      })
      return
    }
    currentFacing = (currentFacing === 'environment') ? 'user' : 'environment'
    await stopScanner()
    await startScanner()
  // eslint-disable-next-line no-unused-vars
  } catch (e) { scanError.value = 'No se pudo cambiar de cámara.' }
}
async function toggleTorch () {
  try {
    if (!currentTrack) return
    const caps = currentTrack.getCapabilities?.() || {}
    if (!caps.torch) { scanError.value = 'Este dispositivo no soporta linterna.'; return }
    const newVal = !torchOn.value
    await currentTrack.applyConstraints({ advanced: [{ torch: newVal }] })
    torchOn.value = newVal
  } catch { scanError.value = 'No se pudo cambiar la linterna.' }
}
async function setZoom (factor) {
  try {
    if (!currentTrack) return
    const caps = currentTrack.getCapabilities?.() || {}
    if (!caps.zoom) return
    zoomLevel.value = Math.min(Math.max(factor, caps.zoom.min || 1), caps.zoom.max || 1)
    await currentTrack.applyConstraints({ advanced: [{ zoom: zoomLevel.value }] })
  } catch { /* no-op */ }
}
function suggestCategoryFromText (t) {
  const s = String(t || '').toLowerCase()
  if (/(estacionamiento|parking)/i.test(s)) return 'Gastos de estacionamiento'
  if (/(notar|legal|abogada|abogado)/i.test(s)) return 'Gastos notariales y legales'
  if (/(bencina|combustible|gasolina)/i.test(s)) return 'Gastos de bencina con boleta'
  if (/(aseo|limpieza|cloro|detergente)/i.test(s)) return 'Artículos de aseo con boleta'
  if (/(útiles|utiles|oficina|papeler|lápiz|lapiz)/i.test(s)) return 'Útiles y Artículos de oficina con boleta'
  if (/(colación|colacion|almuerzo|comida|sandwich)/i.test(s)) return 'Gastos de colación con boleta'
  if (/(pasaje|bus|metro|taxi|uber|cabify|moviliz)/i.test(s)) return 'Gastos de movilización - pasajes con boletas'
  if (/(proveed|factura)/i.test(s)) return 'proveedores'
  return 'Gastos varios con boleta'
}
function handleScan (raw) {
  if (!raw) return
  lastScan.value = String(raw).trim()
  autofillInfo.value = { montoOk: false, fechaOk: false, catOk: false }
  try {
    const urlMatch = lastScan.value.match(/https?:\/\/[^\s]+/i)?.[0]
    if (urlMatch) {
      const u = new URL(urlMatch)
      const t = u.searchParams.get('t')
      const f = u.searchParams.get('f')
      const fe = u.searchParams.get('fe')
      if (t) {
        const n = Number(t.replace(/\./g,'').replace(/,/g,'.'))
        if (!Number.isNaN(n) && n > 0) { monto.value = n; moneda.value = 'CLP'; syncStep(); autofillInfo.value.montoOk = true }
      }
      if (f && !numeroDoc.value) { numeroDoc.value = f }
      if (fe) { fecha.value = fe; autofillInfo.value.fechaOk = true }
    }
  } catch { /* ignore */ }

  let montoTxt = null
  const m1 = /<MntTotal>\s*([\d.,]+)\s*<\/MntTotal>/i.exec(lastScan.value)
  if (m1?.[1]) montoTxt = m1[1]
  if (!montoTxt) {
    const m2 = /MntTotal\s*[:=]\s*([\d.,]+)/i.exec(lastScan.value)
    if (m2?.[1]) montoTxt = m2[1]
  }
  if (!montoTxt) {
    const m3 = /(?:Total|Monto|Pagar)\s*[:=]?\s*\$?\s*([\d.]{3,}(?:,\d{2})?)/i.exec(lastScan.value)
    if (m3?.[1]) montoTxt = m3[1]
  }
  if (!montoTxt) {
    const nums = lastScan.value.match(/[\d.]{4,}(?:,\d{2})?/g) || []
    if (nums.length) montoTxt = nums.sort((a,b)=> (Number(b.replace(/\./g,'').replace(',', '.')) - Number(a.replace(/\./g,'').replace(',', '.'))))[0]
  }
  if (montoTxt) {
    const n = Number(montoTxt.replace(/\./g,'').replace(/,/g,'.'))
    if (!Number.isNaN(n) && n > 0) { monto.value = n; moneda.value = 'CLP'; syncStep(); autofillInfo.value.montoOk = true }
  }

  let fStr = null
  const f1 = /<FchEmis>\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*<\/FchEmis>/i.exec(lastScan.value)
  const f2 = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(lastScan.value)
  const f3 = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(lastScan.value)
  if (f1) { const [ , y, mo, d] = f1; fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
  else if (f2) { const [ , y, mo, d] = f2; fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
  else if (f3) { const [ , d, mo, y] = f3; fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
  if (fStr) { fecha.value = fStr; autofillInfo.value.fechaOk = true }

  const catSugerida = suggestCategoryFromText(lastScan.value)
  if (!categoria.value && catSugerida) { categoria.value = catSugerida; autofillInfo.value.catOk = true }

  const prefix = notas.value?.trim() ? (notas.value.trim() + '\n\n') : ''
  notas.value = `${prefix}Código escaneado:\n${lastScan.value}`

  stopScanner()
}
async function stopScanner () {
  try {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    if (zxingReader) { try { await zxingReader.reset() } catch { /* no-op */ } zxingReader = null }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
    currentTrack = null
  } finally { scannerActive.value = false }
}
onBeforeUnmount(() => { stopScanner() })

/* ---------- Modal Foto ---------- */
const photoActive = ref(false)
const photoError = ref('')
const photoVideoEl = ref(null)
const photoCanvasEl = ref(null)
let photoStream = null
const photoReady = ref(false)
function waitForVideoReadyGeneric (v) { return waitForVideoReady(v) }
async function openPhotoCapture () {
  photoError.value = ''; photoReady.value = false
  try {
    await stopScanner()
    photoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    photoActive.value = true
    await nextTick()
    const v = photoVideoEl.value
    v.srcObject = photoStream
    v.muted = true; v.setAttribute('muted', '')
    v.playsInline = true; v.setAttribute('playsinline', '')
    v.setAttribute('autoplay', '')
    const readyP = waitForVideoReadyGeneric(v)
    await v.play().catch(() => {})
    await readyP
    photoReady.value = v.videoWidth > 0 && v.videoHeight > 0
  } catch (e) { console.error(e); photoError.value = e?.message || 'No se pudo abrir la cámara.'; await closePhotoCapture() }
}
async function closePhotoCapture () {
  try { if (photoStream) { photoStream.getTracks().forEach(t => t.stop()); photoStream = null } }
  catch { /* no-op */ }
  photoReady.value = false
  photoActive.value = false
}
async function capturePhoto () {
  try {
    const v = photoVideoEl.value
    const c = photoCanvasEl.value
    if (!v || !c) throw new Error('No hay referencia de la cámara.')
    if (!photoReady.value || !v.videoWidth || !v.videoHeight) {
      await waitForVideoReadyGeneric(v)
      if (!v.videoWidth || !v.videoHeight) throw new Error('La cámara aún no está lista. Intenta de nuevo.')
      photoReady.value = true
    }
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, c.width, c.height)
    const dataURL = c.toDataURL('image/jpeg', 0.9)
    const blob = await (await fetch(dataURL)).blob()
    const file = new File([blob], 'captura.jpg', { type: 'image/jpeg' })
    fotoPreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.8 })
    await closePhotoCapture()
  } catch (e) { console.error(e); photoError.value = e?.message || 'No se pudo capturar la foto.' }
}
onBeforeUnmount(() => { stopScanner(); closePhotoCapture() })

/* ---------- Guardar & Enviar ---------- */
const buildDocPayload = (estado = 'borrador') => {
  return {
    userId: auth.uid,
    nombre: auth.perfil?.nombre || 'Anónimo',
    email: auth.perfil?.email || '',
    empresa: auth.perfil?.empresa || null,

    monto: Number(monto.value || 0),
    moneda: moneda.value,
    categoria: categoria.value,
    motivo: (motivo.value || '').trim(),
    notas: (notas.value || '').trim() || null,

    tipoDocumento: tipoDoc.value,
    numeroDocumento: numeroDoc.value,
    folio: numeroDoc.value,
    ...(tipoDoc.value === 'Boleta'  ? { numeroBoleta:  numeroDoc.value } : {}),
    ...(tipoDoc.value === 'Factura' ? { numeroFactura: numeroDoc.value } : {}),

    fecha: fecha.value ? Timestamp.fromDate(new Date(fecha.value)) : null,
    estado, // 'borrador' | 'pendiente'
    creadoEn: serverTimestamp(),
    fotoPreview: fotoPreview.value || null,
    informeId: null,
    ...(estado === 'borrador' ? { enviadoEn: serverTimestamp(), enviadoPor: auth.perfil?.email || '' } : {})
  }
}
const validarBase = () => {
  if (!auth.uid) throw new Error('No hay sesión activa.')
  if (!tipoDoc.value || !numeroDoc.value) throw new Error('Falta el tipo y/o número de documento.')
}
const guardar = async () => {
  error.value = ''; cargando.value = true
  try {
    validarBase()
    await addDoc(collection(db, 'rendiciones'), buildDocPayload('borrador'))
    limpiarFormulario()
    showToast('Rendición guardada como borrador', 'bi-check-circle')
  } catch (e) {
    console.error(e)
    error.value = e.message || 'No se pudo guardar la rendición.'
  } finally {
    cargando.value = false
  }
}
const enviar = async () => {
  error.value = ''; cargando.value = true
  try {
    validarBase()
    await addDoc(collection(db, 'rendiciones'), buildDocPayload('borrador'))
    limpiarFormulario()
    showToast('Rendición enviada a revisión', 'bi-send-check')
  } catch (e) {
    console.error(e)
    error.value = e.message || 'No se pudo enviar la rendición.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
/* Modal SPA para "Tomar foto" */
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: grid;
  place-items: center;
  z-index: 1080;
}
.modal-card {
  width: min(900px, 96vw);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0,0,0,.22);
}
.modal-header, .modal-footer {
  padding: .75rem 1rem;
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.modal-footer { border-top: 1px solid rgba(0,0,0,.06); border-bottom: 0; }
.modal-title { margin: 0; font-size: 1rem; }
.btn-close { border: 0; background: transparent; }

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
</style>
