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
                  <!-- marco -->
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
              <span class="badge text-bg-warning">pendiente</span>
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
          <button class="btn btn-danger" :disabled="cargando">
            <span v-if="!cargando"><i class="bi bi-check2-circle me-1"></i> Guardar</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
          <button class="btn btn-outline-secondary" type="button" @click="limpiarFormulario" :disabled="cargando">
            Limpiar
          </button>
        </div>

        <!-- Mensajes -->
        <p v-if="error" class="text-danger small mt-3">{{ error }}</p>
        <p v-if="ok" class="text-success small mt-3">¡Rendición creada!</p>
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
</template>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'




const auth = useAuthStore()
const router = useRouter()

// Categorías solicitadas
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

// Campos del formulario
const monto = ref(null)
const moneda = ref('CLP')
const categoria = ref('')
const motivo = ref('')
const notas = ref('')
const fecha = ref('')

// Documento
const tipoDoc = ref('')
const numeroDoc = ref('')

// Foto (miniatura base64 para Firestore)
const fileInput = ref(null)
const fotoPreview = ref(null)

// Estado UI
const cargando = ref(false)
const error = ref('')
const ok = ref(false)

// --- UI helpers ---
const simboloMoneda = computed(() => ({ CLP: '$', USD: '$', EUR: '€', UF: 'UF' }[moneda.value] || '$'))
const stepMoneda = ref(100) // CLP por defecto
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

const limpiarFoto = () => {
  fotoPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}
const limpiarFormulario = () => {
  monto.value = null
  moneda.value = 'CLP'
  categoria.value = ''
  motivo.value = ''
  notas.value = ''
  fecha.value = ''
  tipoDoc.value = ''
  numeroDoc.value = ''
  limpiarFoto()
  ok.value = false
  error.value = ''
  syncStep()
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

// ------- ESCÁNER (robusto Opera / Chrome / Edge / Firefox) -------
// Refs & estado
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

// Mejoras: torch y zoom
const torchOn = ref(false)
const zoomLevel = ref(1)
const maxZoom = ref(1)

// quitamos pagoOk, mantenemos flags de auto-llenado
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
    BarcodeFormat.PDF_417, // <- importante para boletas/facturas CL
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
    // Cerrar el modal de foto si estaba abierto
    await closePhotoCapture()

    // 1) Habilitar UI para que el <video> exista y esperar al render
    scannerActive.value = true
    await nextTick()

    // 2) Preparar detector nativo si sirve
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

    // 3) Abrir cámara (trasera por defecto) con enfoque/exposición continuos
    const constraints = {
      video: {
        facingMode: currentFacing, // 'environment' | 'user'
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }],
      },
      audio: false
    }
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

    // 4) Conectar el stream al <video> (ya existe porque hicimos nextTick)
    const v = videoEl.value
    if (!v) throw new Error('No se encontró el elemento <video>.')
    v.srcObject = mediaStream
    v.setAttribute('playsinline', '')
    v.setAttribute('autoplay', '')
    await v.play().catch(()=>{})
    await waitForVideoReady(v)

    // 5) Detectar si hay más de una cámara
    const inputs = await navigator.mediaDevices.enumerateDevices()
    canSwitchCamera.value = inputs.filter(d => d.kind === 'videoinput').length > 1

    // 6) Guardar track para torch/zoom y aplicar zoom inicial si está disponible
    currentTrack = mediaStream.getVideoTracks()[0]
    try {
      const caps = currentTrack.getCapabilities?.() || {}
      if (caps.zoom) {
        maxZoom.value = caps.zoom.max || 1
        await currentTrack.applyConstraints({ advanced: [{ zoom: Math.min(2, maxZoom.value) }] })
        zoomLevel.value = Math.min(2, maxZoom.value)
      }
    } catch {error.value = 'No se pudo aplicar zoom inicial.'}
      // opcional: no interrumpir si el dispositivo no soporta zoom
    await new Promise(r => setTimeout(r, 500)) // esperar un poco al track

    // 7) Elegir ruta de decodificación
    if (barcodeDetector) {
      // Nativo
      loopDetectNative()
    } else {
      // ZXing WASM (con hints para PDF417)
      zxingReader = new BrowserMultiFormatReader(getZXingHints(), 700) // 700ms entre intentos
      const cams = inputs.filter(d => d.kind === 'videoinput')
      const back = cams.find(d => /back|trasera|rear/i.test(d.label)) || cams[0]
      currentDeviceId = back?.deviceId || undefined
      scannerInfo.value = 'Usando ZXing (WASM).'
      zxingReader.decodeFromVideoDevice(currentDeviceId ?? null, videoEl.value, (result/*, err, controls*/) => {
        if (result?.getText) handleScan(result.getText())
        // err se ignora para continuar
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
    } catch (e) {
      console.warn('Detector nativo error:', e)
    }
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
  } catch (e) {
    console.warn('Detector nativo error:', e)
    scanError.value = 'No se pudo cambiar de cámara.'
  }
}

async function toggleTorch () {
  try {
    if (!currentTrack) return
    const caps = currentTrack.getCapabilities?.() || {}
    if (!caps.torch) { scanError.value = 'Este dispositivo no soporta linterna.'; return }
    torchOn.value = !torchOn.value
    await currentTrack.applyConstraints({ advanced: [{ torch: torchOn.value }] })
  } catch {
    scanError.value = 'No se pudo cambiar la linterna.'
  }
}

async function setZoom (factor) {
  try {
    if (!currentTrack) return
    const caps = currentTrack.getCapabilities?.() || {}
    if (!caps.zoom) return
    zoomLevel.value = Math.min(Math.max(factor, caps.zoom.min || 1), caps.zoom.max || 1)
    await currentTrack.applyConstraints({ advanced: [{ zoom: zoomLevel.value }] })
  } catch {error.value = 'No se pudo ajustar el zoom.'}
}

// Heurística categoría
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

  // === EXTRA: parseo típico QR SII Chile (URL con t, f, fe) ===
  try {
    const urlMatch = lastScan.value.match(/https?:\/\/[^\s]+/i)?.[0]
    if (urlMatch) {
      const u = new URL(urlMatch)
      const t = u.searchParams.get('t')   // monto
      const f = u.searchParams.get('f')   // folio
      const fe = u.searchParams.get('fe') // YYYY-MM-DD
      if (t) {
        const n = Number(t.replace(/\./g,'').replace(/,/g,'.'))
        if (!Number.isNaN(n) && n > 0) {
          monto.value = n
          moneda.value = 'CLP'
          syncStep()
          autofillInfo.value.montoOk = true
        }
      }
      if (f && !numeroDoc.value) { numeroDoc.value = f }
      if (fe) { fecha.value = fe; autofillInfo.value.fechaOk = true }
    }
  } catch {error.value = 'No se pudo parsear URL del código.'}

  // Monto (DTE texto)
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
    if (nums.length) {
      montoTxt = nums.sort((a,b)=> (Number(b.replace(/\./g,'').replace(',', '.')) - Number(a.replace(/\./g,'').replace(',', '.'))))[0]
    }
  }
  if (montoTxt) {
    const n = Number(montoTxt.replace(/\./g,'').replace(/,/g,'.'))
    if (!Number.isNaN(n) && n > 0) {
      monto.value = n
      moneda.value = 'CLP'
      syncStep()
      autofillInfo.value.montoOk = true
    }
  }

  // Fecha
  let fStr = null
  const f1 = /<FchEmis>\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*<\/FchEmis>/i.exec(lastScan.value)
  const f2 = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(lastScan.value)
  const f3 = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(lastScan.value)
  if (f1) {
    // eslint-disable-next-line no-unused-vars
    const [ _all, y, mo, d] = f1
    fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  } else if (f2) {
    // eslint-disable-next-line no-unused-vars
    const [ _a, y, mo, d] = f2
    fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  } else if (f3) {
    // eslint-disable-next-line no-unused-vars
    const [ _b, d, mo, y] = f3
    fStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  if (fStr) { fecha.value = fStr; autofillInfo.value.fechaOk = true }

  // Categoría sugerida
  const catSugerida = suggestCategoryFromText(lastScan.value)
  if (!categoria.value && catSugerida) {
    categoria.value = catSugerida
    autofillInfo.value.catOk = true
  }

  // Adjuntar al campo notas (no pisa lo anterior)
  const prefix = notas.value?.trim() ? (notas.value.trim() + '\n\n') : ''
  notas.value = `${prefix}Código escaneado:\n${lastScan.value}`

  stopScanner()
}

async function stopScanner () {
  try {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    if (zxingReader) {
      try { await zxingReader.reset() } catch {error.value = 'No se pudo detener ZXing.'}
      zxingReader = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
    currentTrack = null
  } finally {
    scannerActive.value = false
  }
}


onBeforeUnmount(() => { stopScanner() })

// ------- Modal "Tomar foto" -------
const photoActive = ref(false)
const photoError = ref('')
const photoVideoEl = ref(null)
const photoCanvasEl = ref(null)
let photoStream = null
const photoReady = ref(false)

function waitForVideoReadyGeneric (v) { return waitForVideoReady(v) }

async function openPhotoCapture () {
  photoError.value = ''
  photoReady.value = false
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
    v.muted = true
    v.setAttribute('muted', '')
    v.playsInline = true
    v.setAttribute('playsinline', '')
    v.setAttribute('autoplay', '')

    const readyP = waitForVideoReadyGeneric(v)
    await v.play().catch(() => {})
    await readyP

    photoReady.value = v.videoWidth > 0 && v.videoHeight > 0
  } catch (e) {
    console.error(e)
    photoError.value = e?.message || 'No se pudo abrir la cámara.'
    await closePhotoCapture()
  }
}

async function closePhotoCapture () {
  try {
    if (photoStream) {
      photoStream.getTracks().forEach(t => t.stop())
      photoStream = null
    }
  } catch {error.value = 'No se pudo cerrar la cámara.'}
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

    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')
    ctx.drawImage(v, 0, 0, c.width, c.height)
    const dataURL = c.toDataURL('image/jpeg', 0.9)

    const blob = await (await fetch(dataURL)).blob()
    const file = new File([blob], 'captura.jpg', { type: 'image/jpeg' })
    fotoPreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.8 })

    await closePhotoCapture()
  } catch (e) {
    console.error(e)
    photoError.value = e?.message || 'No se pudo capturar la foto.'
  }
}

onBeforeUnmount(() => {
  stopScanner()
  closePhotoCapture()
})

// --------------------- Guardar ---------------------
const guardar = async () => {
  error.value = ''
  ok.value = false
  cargando.value = true
  try {
    if (!auth.uid) throw new Error('No hay sesión activa.')
    if (!tipoDoc.value || !numeroDoc.value) throw new Error('Falta el tipo y/o número de documento.')

    const docData = {
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
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
      fotoPreview: fotoPreview.value || null,
    }

    await addDoc(collection(db, 'rendiciones'), docData)
    limpiarFormulario()
    ok.value = true
  } catch (e) {
    console.error(e)
    error.value = e.message || 'No se pudo guardar la rendición.'
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
</style>
