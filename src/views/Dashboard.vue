<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Encabezado -->
  <div class="p-4 rounded-3 border bg-white shadow-sm mb-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <h1 class="h4 mb-1">¡Hola{{ saludoNombre }}!</h1>
        <p class="text-muted mb-0">
          Crea nuevas rendiciones, revisa tus estados y controla tus últimos movimientos.
        </p>
      </div>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-danger" to="/crear">
          <i class="bi bi-plus-lg me-1"></i> Nueva rendición
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- KPIs del usuario -->
  <div class="row g-3">
    <div class="col-12 col-md-6 col-xl-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted small">Total rendiciones</div>
              <div class="fs-4 fw-semibold">{{ kpis.total }}</div>
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
              <div class="fs-4 fw-semibold">{{ kpis.pendientes }}</div>
            </div>
            <span class="badge text-bg-warning align-self-start">pendiente</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-warning" :style="{ width: porcentaje(kpis.pendientes) + '%' }"></div>
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
              <div class="fs-4 fw-semibold">{{ kpis.aprobadas }}</div>
            </div>
            <span class="badge text-bg-success align-self-start">aprobada</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-success" :style="{ width: porcentaje(kpis.aprobadas) + '%' }"></div>
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
              <div class="fs-4 fw-semibold">{{ kpis.rechazadas }}</div>
            </div>
            <span class="badge text-bg-danger align-self-start">rechazada</span>
          </div>
          <div class="progress mt-3" style="height:6px;">
            <div class="progress-bar bg-danger" :style="{ width: porcentaje(kpis.rechazadas) + '%' }"></div>
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
            <div class="fs-3 fw-semibold">{{ formatMoney(kpis.montoAprobadoMes, 'CLP') }}</div>
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
              <span v-if="ultimos[0]">{{ formatFecha(ultimos[0].creadoEn || ultimos[0].fecha) }}</span>
              <span v-else>—</span>
            </div>
          </div>
          <RouterLink class="btn btn-outline-secondary" to="/mis-rendiciones">
            Ver historial
          </RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Últimas rendiciones (con imagen si hay) -->
  <div class="row g-3 mt-1">
    <div class="col-12 col-xl-8">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">Últimos movimientos</h5>
            <RouterLink to="/mis-rendiciones" class="btn btn-sm btn-outline-secondary">Ver todos</RouterLink>
          </div>

          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border"></div>
          </div>

          <div v-else-if="!ultimos.length" class="text-center text-muted py-4">
            Aún no registras rendiciones.
          </div>

          <ul v-else class="list-group list-group-flush">
            <li class="list-group-item" v-for="r in ultimos" :key="r.id">
              <div class="d-flex align-items-center gap-3">
                <div style="width:64px;height:64px" class="flex-shrink-0 d-flex align-items-center justify-content-center bg-light rounded border overflow-hidden">
                  <img v-if="r.fotoPreview" :src="r.fotoPreview" alt="Comprobante" class="img-fluid" style="max-height:64px;max-width:64px;">
                  <i v-else class="bi bi-image text-muted fs-4"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="fw-semibold">
                      {{ r.categoria }} — {{ formatMoney(r.monto, r.moneda || 'CLP') }}
                    </div>
                    <span :class="['badge', badgeClass(r.estado)]">{{ r.estado }}</span>
                  </div>
                  <div class="small text-muted">
                    {{ formatFecha(r.fecha) }} · {{ r.motivo }}
                  </div>
                </div>
                <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name:'detalle', params:{ id:r.id } }">
                  Ver
                </RouterLink>
              </div>
            </li>
          </ul>

        </div>
      </div>
    </div>

    <!-- Ayuda / tips -->
    <div class="col-12 col-xl-4">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h5 class="card-title">Sugerencias</h5>
          <ul class="list-unstyled mb-0">
            <li class="d-flex gap-2 mb-3">
              <i class="bi bi-camera text-secondary"></i>
              <div>
                <div class="fw-semibold">Adjunta foto clara</div>
                <div class="small text-muted">Asegúrate que se lea el monto, fecha e ítem. Usa modo “documento”.</div>
              </div>
            </li>
            <li class="d-flex gap-2 mb-3">
              <i class="bi bi-calendar2-week text-secondary"></i>
              <div>
                <div class="fw-semibold">Fecha correcta</div>
                <div class="small text-muted">La fecha debe coincidir con el comprobante para evitar rechazos.</div>
              </div>
            </li>
            <li class="d-flex gap-2 mb-3">
              <i class="bi bi-cash-coin text-secondary"></i>
              <div>
                <div class="fw-semibold">Moneda</div>
                <div class="small text-muted">Si no es CLP, selecciona USD/EUR/UF al crear la rendición.</div>
              </div>
            </li>
          </ul>
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

// Datos UI
const cargando = ref(true)
const ultimos = ref([])

const kpis = ref({
  total: 0,
  pendientes: 0,
  aprobadas: 0,
  rechazadas: 0,
  montoAprobadoMes: 0,
})

// Nombre/empresa visibles
const perfilNombre = computed(() => auth.perfil?.nombre || auth.user?.email || 'Usuario')
const perfilEmpresa = computed(() => auth.perfil?.empresa || '')
const saludoNombre = computed(() => perfilNombre.value ? `, ${perfilNombre.value}` : '')

// Helpers
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR' }).format(n)
  if (code === 'UF')  return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n)}`
  return n
}
const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) }
  catch { return '-' }
}
const badgeClass = (estado) =>
  ({ pendiente:'badge text-bg-warning', aprobada:'badge text-bg-success', rechazada:'badge text-bg-danger' }[estado] || 'badge text-bg-secondary')

const porcentaje = (num) => {
  const total = kpis.value.total || 1
  return Math.round((num / total) * 100)
}

onMounted(() => {
  // Últimos 5 del usuario
  const qUltimos = query(
    collection(db, 'rendiciones'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc'),
    limit(5)
  )
  onSnapshot(qUltimos, (snap) => {
    ultimos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })

  // Todas del usuario para KPIs (client-side)
  const qAllUser = query(
    collection(db, 'rendiciones'),
    where('userId', '==', auth.uid),
    orderBy('creadoEn', 'desc')
  )
  onSnapshot(qAllUser, (snap) => {
    const docs = snap.docs.map(d => d.data())
    const now = new Date()
    const hace30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)

    const k = {
      total: docs.length,
      pendientes: docs.filter(x => x.estado === 'pendiente').length,
      aprobadas: docs.filter(x => x.estado === 'aprobada').length,
      rechazadas: docs.filter(x => x.estado === 'rechazada').length,
      montoAprobadoMes: docs
        .filter(x => x.estado === 'aprobada' && (x.fecha?.toDate ? x.fecha.toDate() : new Date(x.fecha)) >= hace30)
        .reduce((acc, x) => acc + Number(x.monto || 0), 0),
    }
    kpis.value = k
    cargando.value = false
  })
})
</script>
