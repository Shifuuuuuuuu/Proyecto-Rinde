<!-- src/components/ModalPro.vue -->
<!-- eslint-disable vue/require-toggle-inside-transition -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="pro-backdrop" @click.self="$emit('close')">
        <Transition name="zoom">
          <div class="pro-confirm" :class="danger ? 'is-danger' : 'is-primary'">
            <div class="pro-head">
              <div class="pro-icon"><i class="bi" :class="icon"></i></div>
              <div class="pro-title">
                <div class="pro-eyebrow">{{ danger ? 'Acción crítica' : 'Confirmación' }}</div>
                <h5 class="m-0">{{ title }}</h5>
              </div>
              <button class="pro-close" @click="$emit('close')"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="pro-body">
              <slot name="body"/>
            </div>
            <div class="pro-footer">
              <button class="btn btn-danger pro-btn-ghost" :disabled="loading" @click="$emit('close')">Cancelar</button>
              <button class="btn pro-btn-cta" :class="danger ? 'btn-danger' : 'btn-success'" :disabled="loading" @click="$emit('ok')">
                <i class="bi" :class="danger ? 'bi-exclamation-octagon' : 'bi-check2-circle'"></i>
                {{ okText || 'Aceptar' }}
                <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'bi-info-circle' },
  danger: { type: Boolean, default: false },
  okText: { type: String, default: 'Aceptar' },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.pro-backdrop{ position: fixed; inset:0; z-index:2000; background: rgba(12,16,24,.55); backdrop-filter: blur(2px); display:grid; place-items:center; }
.fade-enter-from,.fade-leave-to{ opacity:0; } .fade-enter-active,.fade-leave-active{ transition:opacity .18s ease; }
.zoom-enter-from{ transform: translateY(8px) scale(.98); opacity:0; } .zoom-enter-active{ transition: all .22s cubic-bezier(.21,.8,.35,1); }
.zoom-leave-to{ transform: translateY(4px) scale(.995); opacity:0; } .zoom-leave-active{ transition: all .16s ease; }
.pro-confirm{ width:min(680px,96vw); border-radius:16px; overflow:hidden; background:#fff; box-shadow: 0 24px 60px rgba(9,11,15,.28), 0 8px 24px rgba(9,11,15,.18); border:1px solid rgba(16,24,40,.06); }
.pro-confirm.is-primary .pro-head{ --grad-a:#0ea5e9; --grad-b:#6366f1; }
.pro-confirm.is-danger  .pro-head{ --grad-a:#ef4444; --grad-b:#ea2323; }
.pro-head{ display:grid; grid-template-columns:auto 1fr auto; gap:.75rem; align-items:center; padding:14px 16px; background: linear-gradient(135deg, var(--grad-a), var(--grad-b)); color:#fff; }
.pro-icon{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background: rgba(255,255,255,.18); box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); }
.pro-eyebrow{ font-size:.72rem; opacity:.9; letter-spacing:.4px; text-transform:uppercase; }
.pro-close{ border:0; background: rgba(255,255,255,.14); color:#fff; width:32px; height:32px; border-radius:10px; }
.pro-body{ padding:16px; }
.pro-footer{ display:flex; justify-content:flex-end; gap:.5rem; padding:12px 16px; border-top:1px solid rgba(16,24,40,.06); background: linear-gradient(180deg, #fff, #fafafa); }
.pro-btn-ghost{ border-radius:10px; border:1px solid rgba(2,6,23,.12); }
.pro-btn-cta{ border-radius:10px; display:inline-flex; align-items:center; gap:.4rem; }
</style>
