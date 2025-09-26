<!-- src/views/InformeDetalle.vue -->
<template>
  <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
    <div>
      <h2 class="h5 mb-1">Informe</h2>
      <div class="text-muted small">
        Creado: {{ formatFecha(informe?.creadoEn) }} ·
        Estado:
        <span :class="['badge', badgeClass(informe?.estado)]">{{ informe?.estado }}</span>
      </div>
    </div>

    <div class="d-flex gap-2">
      <!-- Controles de edición SOLO si está devuelto -->
      <template v-if="isDevuelto">
        <button v-if="!editMode" class="btn btn-primary btn-sm" @click="enterEdit">
          <i class="bi bi-pencil-square"></i> Editar
        </button>

        <template v-else>
          <button class="btn btn-outline-secondary btn-sm" :disabled="saving" @click="cancelEdit">
            <i class="bi bi-x-circle"></i> Cancelar
          </button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveInforme">
            <span v-if="!saving"><i class="bi bi-save2"></i> Guardar</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
        </template>

        <button class="btn btn-success btn-sm" :disabled="saving || !canSend" @click="sendInforme"
          title="Enviar a revisión (pasa a pendiente)">
          <i class="bi bi-send"></i> Enviar informe
        </button>
      </template>

      <RouterLink class="btn btn-outline-secondary btn-sm" to="/informes">
        <i class="bi bi-arrow-left"></i> Volver a informes
      </RouterLink>
    </div>
  </div>
  <!-- Observación del aprobador (solo devuelto o aprobado; no en pendiente) -->
  <div v-if="showObsAprobador" class="alert alert-light border shadow-sm mb-3">
    <div class="d-flex">
      <div class="me-3">
        <span class="badge" :class="isDevuelto ? 'text-bg-secondary' : 'text-bg-success'">
          {{ isDevuelto ? 'devuelto' : 'aprobado' }}
        </span>
      </div>
      <div class="flex-grow-1">
        <div class="fw-semibold d-flex align-items-center gap-2">
          <i class="bi bi-chat-dots text-primary"></i>
          Observación del aprobador
        </div>
        <div class="mt-1 text-body">
          {{ informe.observacionDevolucion }}
        </div>
      </div>
    </div>
  </div>

  <!-- Observación final (solo cuando estado = finalizado) -->
  <div v-if="showObsFinal" class="alert alert-success-subtle border border-success-subtle shadow-sm mb-3">
    <div class="d-flex">
      <div class="me-3">
        <span class="badge text-bg-primary">finalizado</span>
      </div>
      <div class="flex-grow-1">
        <div class="fw-semibold d-flex align-items-center gap-2">
          <i class="bi bi-check2-square text-success"></i>
          Observación final
        </div>
        <div class="mt-1 text-body">
          {{ informe.observacionFinal }}
        </div>
      </div>
    </div>
  </div>


  <div v-if="error" class="alert alert-danger mb-3">{{ error }}</div>

  <div class="card shadow-sm mb-3" v-if="informe">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-8">
          <label class="text-muted small">Título</label>

          <!-- Lectura / Edición -->
          <div v-if="!editMode" class="fs-5 fw-semibold">
            {{ informe.titulo || '(Sin título)' }}
          </div>
          <input v-else v-model.trim="formTitulo" type="text" class="form-control"
            placeholder="Ej.: Informe de gastos — Viaje a cliente X" maxlength="120" />
        </div>

        <div class="col-md-4">
          <label class="text-muted small">Rendiciones</label>
          <div class="fs-5 fw-semibold">{{ (informe.rendicionIds?.length || 0) + deltaCount }}</div>
        </div>

        <div class="col-12">
          <label class="text-muted small">Nota</label>

          <div v-if="!editMode" class="text-body">{{ informe.nota || '—' }}</div>
          <textarea v-else v-model.trim="formNota" class="form-control" rows="3"
            placeholder="Contexto del informe, aclaraciones, etc."></textarea>
        </div>
      </div>
    </div>

    <div class="card-footer bg-light">
      <div class="d-flex align-items-center flex-wrap gap-3">
        <div v-for="(monto, code) in totalesPreview" :key="code" class="small">
          <span class="text-muted">{{ code }} total:</span>
          <strong>{{ formatMoney(monto, code) }}</strong>
        </div>
      </div>
    </div>
  </div>

  <!-- Agregar rendiciones (solo en devuelto + edición) -->
  <div v-if="isDevuelto && editMode" class="card shadow-sm mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h6 class="mb-0">Agregar rendiciones al informe</h6>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm" @click="loadPoolRendiciones" :disabled="loadingPool">
            <span v-if="!loadingPool"><i class="bi bi-arrow-repeat"></i> Recargar</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
          <button class="btn btn-primary btn-sm" :disabled="!selectedToAdd.length" @click="addSelected">
            <i class="bi bi-plus-circle"></i> Agregar seleccionadas ({{ selectedToAdd.length }})
          </button>
        </div>
      </div>

      <div class="small text-muted mb-2">Se listan tus rendiciones en <strong>borrador</strong> o
        <strong>pendiente</strong> y <strong>sin informe</strong>.
      </div>

      <div v-if="loadingPool" class="text-center py-4">
        <div class="spinner-border"></div>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th style="width:36px" class="text-center">
                <input class="form-check-input" type="checkbox" :checked="allPoolChecked" @change="toggleAllPool" />
              </th>
              <th>Fecha</th>
              <th style="width:64px;"></th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Moneda</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in poolRendiciones" :key="x.id">
              <td class="text-center">
                <input class="form-check-input" type="checkbox" :value="x.id" v-model="selectedToAdd" />
              </td>
              <td class="small text-nowrap">{{ formatFecha(x.fecha || x.creadoEn) }}</td>
              <td>
                <div class="thumb-sm border rounded bg-light d-flex align-items-center justify-content-center">
                  <img v-if="x.fotoPreview" :src="x.fotoPreview" alt="thumb" />
                  <i v-else class="bi bi-receipt text-muted"></i>
                </div>
              </td>
              <td>{{ x.categoria || '—' }}</td>
              <td class="text-truncate" style="max-width: 360px;">
                {{ x.motivo || '—' }}
              </td>
              <td class="text-end">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</td>
              <td>{{ x.moneda || 'CLP' }}</td>
            </tr>
            <tr v-if="!poolRendiciones.length">
              <td colspan="7" class="text-center text-muted py-4">No hay rendiciones disponibles para agregar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Tabla de rendiciones del informe -->
  <div class="card shadow-sm mb-3">
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th style="width:64px;"></th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Estado</th>
              <th class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in rendiciones" :key="x.id" @click="openPreview(x)" style="cursor:pointer">
              <td class="small text-nowrap">{{ formatFecha(x.fecha) }}</td>
              <td>
                <div class="thumb-sm border rounded bg-light d-flex align-items-center justify-content-center">
                  <img v-if="x.fotoPreview" :src="x.fotoPreview" alt="thumb" />
                  <i v-else class="bi bi-receipt text-muted"></i>
                </div>
              </td>
              <td>{{ x.categoria }}</td>
              <td class="text-truncate" style="max-width: 360px;">
                <span class="text-muted small me-1" v-if="x.notas" title="Notas"><i class="bi bi-sticky"></i></span>
                {{ x.motivo }}
              </td>
              <td class="text-end">
                <div class="fw-semibold">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</div>
                <div class="small text-muted">{{ x.moneda || 'CLP' }}</div>
              </td>
              <td>
                <span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span>
                <span v-if="x.informeId" class="badge text-bg-info ms-1">en informe</span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" @click.stop="openPreview(x)">
                    <i class="bi bi-eye"></i> Ver
                  </button>

                  <!-- Quitar solo si está devuelto y en edición -->
                  <button v-if="isDevuelto && editMode" class="btn btn-outline-danger"
                    @click.stop="removeFromInforme(x.id)">
                    <i class="bi bi-x-circle"></i> Quitar
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!rendiciones.length">
              <td colspan="7" class="text-center text-muted py-4">Este informe no tiene rendiciones.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- Resumen Aprobado / Rechazado -->
  <div class="row g-3 mt-2" v-if="rendiciones.length">
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="small text-muted">Aprobado</div>
              <div class="fs-5 fw-semibold">{{ resumen.aprobadas.count }} rendición(es)</div>
            </div>
            <div class="text-end">
              <div v-for="(monto, code) in resumen.aprobadas.totales" :key="'a-' + code" class="small">
                <span class="text-muted">{{ code }}:</span> <strong>{{ formatMoney(monto, code) }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer"><span class="badge text-bg-success">aprobadas</span></div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="small text-muted">Rechazado</div>
              <div class="fs-5 fw-semibold">{{ resumen.rechazadas.count }} rendición(es)</div>
            </div>
            <div class="text-end">
              <div v-for="(monto, code) in resumen.rechazadas.totales" :key="'r-' + code" class="small">
                <span class="text-muted">{{ code }}:</span> <strong>{{ formatMoney(monto, code) }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer"><span class="badge text-bg-danger">rechazadas</span></div>
      </div>
    </div>
  </div>

  <!-- Drawer imagen -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="preview.show" class="drawer-backdrop" @click.self="closePreview">
        <div class="drawer">
          <div class="drawer-header">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="closePreview">
                <i class="bi bi-chevron-left"></i>
              </button>
              <h6 class="m-0">Detalle de rendición</h6>
            </div>
            <div class="small text-muted">{{ formatFecha(preview.data?.fecha) }}</div>
          </div>

          <div class="drawer-body">
            <div class="row g-3">
              <div class="col-lg-6">
                <div class="image-card">
                  <div class="image-toolbar">
                    <button class="btn btn-sm btn-outline-secondary" :disabled="!preview.data?.fotoPreview"
                      @click="rotateImage(-90)">
                      <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" :disabled="!preview.data?.fotoPreview"
                      @click="rotateImage(90)">
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" :disabled="!preview.data?.fotoPreview"
                      @click="zoomOut">
                      <i class="bi bi-zoom-out"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" :disabled="!preview.data?.fotoPreview"
                      @click="zoomIn">
                      <i class="bi bi-zoom-in"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" :disabled="!preview.data?.fotoPreview"
                      @click="resetView">
                      <i class="bi bi-aspect-ratio"></i>
                    </button>
                    <a v-if="preview.data?.fotoPreview" class="btn btn-sm btn-outline-primary"
                      :href="preview.data.fotoPreview" download="comprobante.jpg" target="_blank" rel="noopener">
                      <i class="bi bi-download"></i> Descargar
                    </a>
                  </div>

                  <div class="image-stage">
                    <div class="image-wrap" :style="{
                      transform: 'translate(-50%, -50%) scale(' + preview.zoom + ') rotate(' + preview.rotate + 'deg)'
                    }">
                      <img v-if="preview.data?.fotoPreview" :src="preview.data.fotoPreview" alt="comprobante" />
                      <div v-else class="no-image">
                        <i class="bi bi-receipt fs-1"></i>
                        <div class="small text-muted mt-1">Sin imagen</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-6">
                <div class="card">
                  <div class="card-body">
                    <div class="mb-2">
                      <div class="text-muted small">Monto</div>
                      <div class="fs-5 fw-semibold">
                        {{ formatMoney(preview.data?.monto, preview.data?.moneda || 'CLP') }}
                        <span class="small text-muted">{{ preview.data?.moneda || 'CLP' }}</span>
                      </div>
                    </div>
                    <div class="mb-2">
                      <div class="text-muted small">Categoría</div>
                      <div class="fw-semibold">{{ preview.data?.categoria }}</div>
                    </div>
                    <div class="mb-2">
                      <div class="text-muted small">Motivo</div>
                      <div>{{ preview.data?.motivo }}</div>
                    </div>
                    <div class="mb-2">
                      <div class="text-muted small">Documento</div>
                      <div>
                        {{ preview.data?.tipoDocumento }} · Folio {{ preview.data?.folio ||
                          preview.data?.numeroDocumento
                        }}
                      </div>
                    </div>
                    <div class="mb-2" v-if="preview.data?.empresa">
                      <div class="text-muted small">Empresa</div>
                      <div>{{ preview.data?.empresa }}</div>
                    </div>
                    <div class="mb-2" v-if="preview.data?.notas">
                      <div class="text-muted small">Notas</div>
                      <pre class="mb-0 small">{{ preview.data?.notas }}</pre>
                    </div>
                    <div class="mt-3">
                      <span :class="['badge', badgeClass(preview.data?.estado)]">{{ preview.data?.estado }}</span>
                      <span v-if="preview.data?.informeId" class="badge text-bg-info ms-1">en informe</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import {
  doc, getDoc, collection, query, where, getDocs, documentId, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({ id: { type: String, required: true } })
const id = String(props.id)

const auth = useAuthStore()

const informe = ref(null)
const rendiciones = ref([])
const error = ref('')
const saving = ref(false)

/* ====== Edición solo si está devuelto ====== */
const editMode = ref(false)
const formTitulo = ref('')
const formNota = ref('')
const canSend = computed(() => (informe.value?.rendicionIds?.length || 0) > 0) // tiene algo que enviar

// deltaCount para mostrar conteo anticipado al agregar (preview)
const deltaCount = ref(0)

/* Pool de rendiciones (agregables) */
const poolRendiciones = ref([])
const selectedToAdd = ref([])
const loadingPool = ref(false)
const allPoolChecked = computed(() =>
  poolRendiciones.value.length > 0 &&
  poolRendiciones.value.every(r => selectedToAdd.value.includes(r.id))
)

/* Toast */
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast(text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 2600)
}

onMounted(loadAll)

async function loadAll() {
  try {
    const refInf = doc(db, 'informes', id)
    const snap = await getDoc(refInf)
    if (!snap.exists()) { error.value = 'El informe no existe.'; return }
    informe.value = { id: snap.id, ...snap.data() }

    const ids = Array.isArray(informe.value.rendicionIds) ? informe.value.rendicionIds : []
    rendiciones.value = await fetchRendicionesByIds(ids)

    // hidratar form si ya está devuelto (por si entra directo)
    if (isDevuelto.value) {
      formTitulo.value = informe.value.titulo || ''
      formNota.value = informe.value.nota || ''
    }
  } catch (e) {
    console.error(e); error.value = 'No fue posible cargar el informe.'
  }
}

async function fetchRendicionesByIds(ids) {
  if (!ids.length) return []
  const chunks = []
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10))
  const results = []
  for (const ch of chunks) {
    const qRef = query(collection(db, 'rendiciones'), where(documentId(), 'in', ch))
    const snap = await getDocs(qRef)
    snap.forEach(d => results.push({ id: d.id, ...d.data() }))
  }
  results.sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
    const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
    return dbb - da
  })
  return results
}

/* ====== Totales preview (en edición suma lo agregado) ====== */
const totalesPreview = computed(() => {
  const base = recalcTotales(rendiciones.value)
  if (editMode.value && selectedToAdd.value.length) {
    const add = poolRendiciones.value.filter(x => selectedToAdd.value.includes(x.id))
    const extra = recalcTotales(add)
    for (const [code, monto] of Object.entries(extra)) {
      base[code] = (base[code] || 0) + monto
    }
  }
  return base
})
function recalcTotales(arr) {
  return arr.reduce((acc, x) => {
    const code = x.moneda || 'CLP'
    acc[code] = (acc[code] || 0) + Number(x.monto || 0)
    return acc
  }, {})
}

/* ====== UI edición ====== */
function enterEdit() {
  if (!isDevuelto.value) return
  editMode.value = true
  formTitulo.value = informe.value.titulo || ''
  formNota.value = informe.value.nota || ''
  selectedToAdd.value = []
  deltaCount.value = 0
  loadPoolRendiciones()
}
async function cancelEdit() {
  editMode.value = false
  selectedToAdd.value = []
  deltaCount.value = 0
  await loadAll() // recarga estado desde Firestore
}
async function saveInforme() {
  try {
    saving.value = true

    // 1) Si hay seleccionadas para agregar, actualiza rendiciones target y doc de informe
    let newIds = [...(informe.value.rendicionIds || [])]
    if (selectedToAdd.value.length) {
      const toAdd = poolRendiciones.value.filter(x => selectedToAdd.value.includes(x.id))
      await Promise.all(
        toAdd.map(x =>
          updateDoc(doc(db, 'rendiciones', x.id), {
            informeId: informe.value.id,
            actualizadoEn: serverTimestamp()
          })
        )
      )
      newIds = [...new Set([...newIds, ...selectedToAdd.value])]
    }

    // 2) Recalcular totales con nuevas IDs
    const newDocs = await fetchRendicionesByIds(newIds)
    const newTotals = recalcTotales(newDocs)

    // 3) Actualizar campos del informe
    await updateDoc(doc(db, 'informes', informe.value.id), {
      titulo: formTitulo.value || null,
      nota: formNota.value || null,
      rendicionIds: newIds,
      totalesPorMoneda: newTotals,
      actualizadoEn: serverTimestamp()
    })

    // 4) Refrescar UI local
    informe.value = { ...informe.value, titulo: formTitulo.value || null, nota: formNota.value || null, rendicionIds: newIds, totalesPorMoneda: newTotals }
    rendiciones.value = newDocs
    selectedToAdd.value = []
    deltaCount.value = 0
  } catch (e) {
    console.error(e); error.value = 'No se pudo guardar el informe.'
  } finally {
    saving.value = false
  }
}
async function sendInforme() {
  try {
    saving.value = true

    if (!canSend.value) { saving.value = false; return }

    await updateDoc(doc(db, 'informes', informe.value.id), {
      estado: 'pendiente',
      enviadoPor: auth.user?.email || 'usuario',
      enviadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })

    informe.value.estado = 'pendiente'
    editMode.value = false
    showToast('Informe enviado a revisión', 'bi-send-check')
  } catch (e) {
    console.error(e); error.value = 'No se pudo enviar el informe.'
  } finally {
    saving.value = false
  }
}

/* ====== Pool handlers ====== */
async function loadPoolRendiciones() {
  try {
    loadingPool.value = true
    selectedToAdd.value = []
    const qRef = query(
      collection(db, 'rendiciones'),
      where('userId', '==', auth.uid),
      where('informeId', '==', null)
    )
    const snap = await getDocs(qRef)
    const arr = []
    snap.forEach(d => {
      const x = { id: d.id, ...d.data() }
      if (x.estado === 'borrador' || x.estado === 'pendiente') arr.push(x)
    })
    arr.sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || a.creadoEn)
      const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || b.creadoEn)
      return dbb - da
    })
    poolRendiciones.value = arr
  } catch (e) {
    console.error(e)
  } finally {
    loadingPool.value = false
  }
}
function toggleAllPool(e) {
  if (e.target.checked) selectedToAdd.value = poolRendiciones.value.map(x => x.id)
  else selectedToAdd.value = []
}
async function addSelected() {
  try {
    if (!isDevuelto.value || !editMode.value) {
      return showToast('Solo puedes agregar rendiciones cuando el informe está devuelto y en edición.', 'bi-exclamation-triangle')
    }
    if (!selectedToAdd.value.length) {
      return showToast('Selecciona al menos una rendición para agregar.', 'bi-exclamation-circle')
    }

    // Evitar duplicados
    const currentIds = new Set(informe.value?.rendicionIds || [])
    const toAddIds = selectedToAdd.value.filter(id => !currentIds.has(id))
    if (!toAddIds.length) {
      selectedToAdd.value = []
      return showToast('Las rendiciones seleccionadas ya están en el informe.', 'bi-info-circle')
    }

    saving.value = true

    const toAddDocs = poolRendiciones.value.filter(x => toAddIds.includes(x.id))

    // 1) Asignar informeId a cada rendición
    await Promise.all(
      toAddDocs.map(x =>
        updateDoc(doc(db, 'rendiciones', x.id), {
          informeId: informe.value.id,
          actualizadoEn: serverTimestamp()
        })
      )
    )

    // 2) Actualizar IDs del informe
    const newIds = [...new Set([...(informe.value.rendicionIds || []), ...toAddIds])]

    // 3) Recalcular totales y refrescar
    const newDocs = await fetchRendicionesByIds(newIds)
    const newTotals = recalcTotales(newDocs)

    await updateDoc(doc(db, 'informes', informe.value.id), {
      rendicionIds: newIds,
      totalesPorMoneda: newTotals,
      actualizadoEn: serverTimestamp()
    })

    // 4) UI local
    informe.value.rendicionIds = newIds
    informe.value.totalesPorMoneda = newTotals
    rendiciones.value = newDocs

    // 5) Limpiar selección y sacar del pool
    poolRendiciones.value = poolRendiciones.value.filter(x => !toAddIds.includes(x.id))
    selectedToAdd.value = []
    deltaCount.value = 0

    // ✅ Toast éxito
    showToast('Rendición(es) agregada(s) al informe', 'bi-check-circle')
  } catch (e) {
    console.error(e)
    showToast('No pudimos agregar las rendiciones. Intenta nuevamente.', 'bi-x-octagon')
  } finally {
    saving.value = false
  }
}

/* ====== Quitar del informe (devuelto + edición) ====== */
async function removeFromInforme(idRend) {
  try {
    if (!isDevuelto.value || !editMode.value) return
    saving.value = true

    const newIds = (informe.value.rendicionIds || []).filter(id => id !== idRend)

    await updateDoc(doc(db, 'rendiciones', idRend), {
      informeId: null,
      actualizadoEn: serverTimestamp()
    })

    const newDocs = await fetchRendicionesByIds(newIds)
    const newTotals = recalcTotales(newDocs)

    await updateDoc(doc(db, 'informes', informe.value.id), {
      rendicionIds: newIds,
      totalesPorMoneda: newTotals,
      actualizadoEn: serverTimestamp()
    })

    informe.value.rendicionIds = newIds
    informe.value.totalesPorMoneda = newTotals
    rendiciones.value = newDocs
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

/* ====== Resumen ====== */
const resumen = computed(() => {
  const sum = (arr) => arr.reduce((acc, x) => {
    const code = x.moneda || 'CLP'
    acc.totales[code] = (acc.totales[code] || 0) + Number(x.monto || 0)
    acc.count++
    return acc
  }, { count: 0, totales: {} })

  const aprobadas = sum(rendiciones.value.filter(x => x.estado === 'aprobada'))
  const rechazadas = sum(rendiciones.value.filter(x => x.estado === 'rechazada'))
  return { aprobadas, rechazadas }
})

/* ====== Drawer imagen ====== */
const preview = ref({ show: false, data: null, zoom: 1, rotate: 0 })
function openPreview(x) { preview.value = { show: true, data: x, zoom: 1, rotate: 0 } }
function closePreview() { preview.value.show = false }
function rotateImage(deg) { preview.value.rotate = (preview.value.rotate + deg) % 360 }
function zoomIn() { preview.value.zoom = Math.min(preview.value.zoom + 0.2, 5) }
function zoomOut() { preview.value.zoom = Math.max(preview.value.zoom - 0.2, 0.2) }
function resetView() { preview.value.zoom = 1; preview.value.rotate = 0 }

/* ====== Formato ====== */
const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) }
  catch { return '-' }
}
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF') return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2 }).format(n)}`
  return n
}
// Estados clave
const isDevuelto = computed(() => (informe.value?.estado || '').toLowerCase() === 'devuelto')
const isAprobado = computed(() => (informe.value?.estado || '').toLowerCase() === 'aprobado')
const isFinalizado = computed(() => (informe.value?.estado || '').toLowerCase() === 'finalizado')

// Observación del aprobador (devuelto o aprobado; oculta si "no" o vacío)
const showObsAprobador = computed(() => {
  const estadoOk = isDevuelto.value || isAprobado.value
  const txt = String(informe.value?.observacionDevolucion ?? '').trim()
  const tieneObs = txt && txt.toLowerCase() !== 'no'
  return estadoOk && tieneObs
})

// Observación final (solo finalizado; oculta si "no" o vacío)
const showObsFinal = computed(() => {
  if (!isFinalizado.value) return false
  const txt = String(informe.value?.observacionFinal ?? '').trim()
  return txt && txt.toLowerCase() !== 'no'
})

const badgeClass = (estado) => ({
  borrador: 'text-bg-secondary',
  pendiente: 'text-bg-warning',
  aprobada: 'text-bg-success',
  rechazada: 'text-bg-danger',
  aprobado: 'text-bg-success',
  parcial: 'text-bg-info',
  devuelto: 'text-bg-secondary',
  finalizado: 'text-bg-primary'
}[estado] || 'text-bg-secondary')

</script>

<style scoped>
/* Mini thumb */
.thumb-sm {
  width: 56px;
  height: 40px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Drawer */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(12, 16, 24, .55);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(980px, 94vw);
  background: #fff;
  box-shadow: -14px 0 40px rgba(0, 0, 0, .18);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, .06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-body {
  padding: 12px;
  overflow: auto;
  height: calc(100vh - 54px);
}

/* Animaciones */
.drawer-enter-from {
  transform: translateX(8px);
  opacity: 0;
}

.drawer-enter-active {
  transition: all .2s ease;
}

.drawer-leave-to {
  transform: translateX(6px);
  opacity: 0;
}

.drawer-leave-active {
  transition: all .16s ease;
}

/* Image viewer */
.image-card {
  border: 1px solid rgba(0, 0, 0, .06);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.image-toolbar {
  padding: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, .06);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.image-stage {
  position: relative;
  height: 420px;
  background: #0b1220;
  overflow: hidden;
}

.image-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
}

.image-wrap img {
  max-width: 100%;
  max-height: 100%;
  display: block;
  user-select: none;
  pointer-events: none;
}

.no-image {
  color: #cbd5e1;
  display: grid;
  place-items: center;
  width: 380px;
  height: 280px;
  border: 1px dashed rgba(255, 255, 255, .25);
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
}

/* Snackbar / Toast */
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
</style>
