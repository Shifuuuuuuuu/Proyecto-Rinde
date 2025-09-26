<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Encabezado -->
  <div class="p-4 rounded-3 border bg-white shadow-sm mb-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <h1 class="h4 mb-1">¡Hola{{ saludoNombre }}!</h1>
        <p class="text-muted mb-0">
          Crea y gestiona tus rendiciones e informes desde un solo lugar.
        </p>
      </div>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-danger" :to="{ name: 'crear' }">
          <i class="bi bi-plus-lg me-1"></i> Nueva rendición
        </RouterLink>
        <RouterLink class="btn btn-outline-dark" :to="{ name: 'informes' }">
          <i class="bi bi-file-earmark-text me-1"></i> Ver informes
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- KPIs: Rendiciones -->
  <div class="row g-3">
    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Total rendiciones</div>
              <div class="fs-4 fw-semibold">{{ kpisR.total }}</div>
            </div>
            <i class="bi bi-receipt fs-3 text-secondary"></i>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-secondary" style="width:100%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Pendientes</div>
              <div class="fs-4 fw-semibold">{{ kpisR.pendientes }}</div>
            </div>
            <span class="badge text-bg-warning align-self-start">pendiente</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-warning" :style="{ width: porcentaje(kpisR.pendientes, kpisR.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Aprobadas</div>
              <div class="fs-4 fw-semibold">{{ kpisR.aprobadas }}</div>
            </div>
            <span class="badge text-bg-success align-self-start">aprobada</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-success" :style="{ width: porcentaje(kpisR.aprobadas, kpisR.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Rechazadas</div>
              <div class="fs-4 fw-semibold">{{ kpisR.rechazadas }}</div>
            </div>
            <span class="badge text-bg-danger align-self-start">rechazada</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-danger" :style="{ width: porcentaje(kpisR.rechazadas, kpisR.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- KPIs de monto (usuario) -->
  <div class="row g-3 mt-1">
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex align-items-center justify-content-between">
          <div>
            <div class="text-muted small">Gasto aprobado (últimos 30 días)</div>
            <div class="fs-3 fw-semibold">{{ formatMoney(kpisR.montoAprobadoMes, 'CLP') }}</div>
          </div>
          <i class="bi bi-graph-up-arrow fs-2 text-success"></i>
        </div>
      </div>
    </div>

    <div class="col-12 col-lg-6">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex align-items-center justify-content-between">
          <div>
            <div class="text-muted small">Última rendición</div>
            <div class="fw-semibold">
              <span v-if="ultimosR[0]">{{ formatFecha(ultimosR[0].creadoEn || ultimosR[0].fecha) }}</span>
              <span v-else>—</span>
            </div>
          </div>
          <RouterLink class="btn btn-outline-secondary" :to="{ name: 'rendiciones' }">
            Ver historial
          </RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- KPIs: Informes -->
  <div class="row g-3 mt-1">
    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Total informes</div>
              <div class="fs-4 fw-semibold">{{ kpisI.total }}</div>
            </div>
            <i class="bi bi-files fs-3 text-secondary"></i>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-secondary" style="width:100%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Pendientes</div>
              <div class="fs-4 fw-semibold">{{ kpisI.pendiente }}</div>
            </div>
            <span class="badge text-bg-warning align-self-start">pendiente</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-warning" :style="{ width: porcentaje(kpisI.pendiente, kpisI.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Aprobados</div>
              <div class="fs-4 fw-semibold">{{ kpisI.aprobado }}</div>
            </div>
            <span class="badge text-bg-success align-self-start">aprobado</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-success" :style="{ width: porcentaje(kpisI.aprobado, kpisI.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Rechazados</div>
              <div class="fs-4 fw-semibold">{{ kpisI.rechazado }}</div>
            </div>
            <span class="badge text-bg-danger align-self-start">rechazado</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-danger" :style="{ width: porcentaje(kpisI.rechazado, kpisI.total) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Últimos movimientos + Últimos informes -->
  <div class="row g-3 mt-1">
    <!-- Últimas rendiciones -->
    <div class="col-12 col-xl-8">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">Últimos movimientos</h5>
            <RouterLink :to="{ name: 'rendiciones' }" class="btn btn-sm btn-outline-secondary">Ver todos</RouterLink>
          </div>

          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border"></div>
          </div>

          <div v-else-if="!ultimosR.length" class="text-center text-muted py-4">
            Aún no registras rendiciones.
          </div>

          <ul v-else class="list-group list-group-flush">
            <li class="list-group-item" v-for="r in ultimosR" :key="r.id">
              <div class="d-flex align-items-center gap-3">
                <div style="width:64px;height:64px"
                  class="flex-shrink-0 d-flex align-items-center justify-content-center bg-light rounded border overflow-hidden">
                  <img v-if="r.fotoPreview" :src="r.fotoPreview" alt="Comprobante" class="img-fluid"
                    style="max-height:64px;max-width:64px;">
                  <i v-else class="bi bi-image text-muted fs-4"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="fw-semibold">
                      {{ r.categoria }} — {{ formatMoney(r.monto, r.moneda || 'CLP') }}
                    </div>
                    <span :class="['badge', badgeRendicion(r.estado)]">{{ r.estado }}</span>
                  </div>
                  <div class="small text-muted">
                    {{ formatFecha(r.fecha) }} · {{ r.motivo }}
                  </div>
                </div>
                <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name: 'detalle', params: { id: r.id } }">
                  Ver
                </RouterLink>
              </div>
            </li>
          </ul>

        </div>
      </div>
    </div>

    <!-- Últimos informes -->
    <div class="col-12 col-xl-4">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">Últimos informes</h5>
            <RouterLink :to="{ name: 'informes' }" class="btn btn-sm btn-outline-secondary">Ver todos</RouterLink>
          </div>

          <div v-if="cargandoInformes" class="text-center py-4">
            <div class="spinner-border"></div>
          </div>

          <div v-else-if="!ultimosI.length" class="text-center text-muted py-4">
            Aún no has creado informes.
          </div>

          <ul v-else class="list-group list-group-flush">
            <li class="list-group-item" v-for="inf in ultimosI" :key="inf.id">
              <div class="d-flex align-items-start justify-content-between gap-2">
                <div class="me-2">
                  <div class="fw-semibold text-truncate" :title="inf.titulo || '(Sin título)'">
                    {{ inf.titulo || '(Sin título)' }}
                  </div>
                  <div class="small text-muted">
                    {{ formatFecha(inf.creadoEn) }} · {{ inf.rendicionIds?.length || 0 }} rend.
                  </div>
                  <div class="small mt-1" v-if="inf.totalesPorMoneda">
                    <span v-for="(monto, code) in inf.totalesPorMoneda" :key="code" class="me-2 text-muted">
                      {{ code }}: <strong>{{ formatMoney(monto, code) }}</strong>
                    </span>
                  </div>
                </div>
                <div class="text-end">
                  <span :class="['badge', badgeInforme(inf.estado)]">{{ inf.estado }}</span>
                  <div class="mt-2">
                    <RouterLink class="btn btn-sm btn-outline-secondary"
                      :to="{ name: 'informeDetalle', params: { id: inf.id } }">
                      Ver
                    </RouterLink>
                  </div>
                </div>
              </div>
            </li>
          </ul>

          <div class="mt-auto pt-3 d-grid">
            <RouterLink :to="{ name: 'rendiciones' }" class="btn btn-dark">
              <i class="bi bi-file-earmark-plus me-1"></i>
              Crear informe (seleccionando rendiciones)
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Estado de cuenta simple -->
      <div class="card shadow-sm mt-3">
        <div class="card-body">
          <h6 class="text-muted mb-1">Tu cuenta</h6>
          <div class="fw-semibold">{{ perfilNombre }}</div>
          <div class="small text-muted">{{ perfilEmpresa || 'Sin empresa' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'

const auth = useAuthStore()

// ----- Datos UI
const cargando = ref(true)
const cargandoInformes = ref(true)
const ultimosR = ref([])
const ultimosI = ref([])

// KPIs Rendiciones
const kpisR = ref({
  total: 0,
  pendientes: 0,
  aprobadas: 0,
  rechazadas: 0,
  montoAprobadoMes: 0,
})

// KPIs Informes
const kpisI = ref({
  total: 0,
  pendiente: 0,
  aprobado: 0,
  parcial: 0,
  rechazado: 0
})

// Nombre/empresa visibles
const perfilNombre = computed(() => auth.perfil?.nombre || auth.user?.email || 'Usuario')
const perfilEmpresa = computed(() => auth.perfil?.empresa || '')
const saludoNombre = computed(() => (perfilNombre.value ? `, ${perfilNombre.value}` : ''))

// Helpers
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF') return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
  return n
}
const toDate = (ts) => (ts?.toDate ? ts.toDate() : new Date(ts))
const formatFecha = (ts) => {
  try { return new Intl.DateTimeFormat('es-CL').format(toDate(ts)) }
  catch { return '-' }
}
const badgeRendicion = (estado) =>
  ({ pendiente: 'badge text-bg-warning', aprobada: 'badge text-bg-success', rechazada: 'badge text-bg-danger', borrador: 'badge text-bg-secondary' }[estado] || 'badge text-bg-secondary')
const badgeInforme = (estado) =>
  ({ pendiente: 'badge text-bg-warning', aprobado: 'badge text-bg-success', parcial: 'badge text-bg-info', rechazado: 'badge text-bg-danger' }[estado] || 'badge text-bg-secondary')

const porcentaje = (num, total) => {
  const t = total || 1
  return Math.round((Number(num || 0) / t) * 100)
}

onMounted(() => {
  // ===== Rendiciones - Últimos 5
  const qUltimosR = query(
    collection(db, 'rendiciones'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc'),
    limit(5)
  )
  onSnapshot(qUltimosR, (snap) => {
    ultimosR.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })

  // ===== Rendiciones - KPIs
  const qAllR = query(
    collection(db, 'rendiciones'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc')
  )
  onSnapshot(qAllR, (snap) => {
    const docs = snap.docs.map(d => d.data())
    const now = new Date()
    const hace30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)

    const k = {
      total: docs.length,
      pendientes: docs.filter(x => x.estado === 'pendiente').length,
      aprobadas: docs.filter(x => x.estado === 'aprobada').length,
      rechazadas: docs.filter(x => x.estado === 'rechazada').length,
      montoAprobadoMes: docs
        .filter(x => x.estado === 'aprobada' && toDate(x.fecha) >= hace30)
        .reduce((acc, x) => acc + Number(x.monto || 0), 0),
    }
    kpisR.value = k
    cargando.value = false
  })

  // ===== Informes - Últimos 5
  const qUltimosI = query(
    collection(db, 'informes'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc'),
    limit(5)
  )
  onSnapshot(qUltimosI, (snap) => {
    ultimosI.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargandoInformes.value = false
  })

  // ===== Informes - KPIs
  const qAllI = query(
    collection(db, 'informes'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc')
  )
  onSnapshot(qAllI, (snap) => {
    const docs = snap.docs.map(d => d.data())
    const k = {
      total: docs.length,
      pendiente: docs.filter(x => x.estado === 'pendiente').length,
      aprobado: docs.filter(x => x.estado === 'aprobado').length,
      parcial: docs.filter(x => x.estado === 'parcial').length,
      rechazado: docs.filter(x => x.estado === 'rechazado').length
    }
    kpisI.value = k
  })
})
</script>

<style scoped>
/* Pequeños detalles visuales para hacerlo más pulido */
.card-title {
  font-weight: 600;
}

.list-group-item {
  border-left: 0;
  border-right: 0;
}

.list-group-item:first-child {
  border-top: 0;
}

.progress {
  background: rgba(0, 0, 0, .06);
}
</style>
