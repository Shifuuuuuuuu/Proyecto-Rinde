import { defineStore } from 'pinia'

function nowLabel() {
  return new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date())
}

export const useToastStore = defineStore('toasts', {
  state: () => ({
    // { id, title, subtitle, body, time, variant, timeout, to, channel, icon }
    items: [],
    maxStack: 5,
  }),

  actions: {
    push({ title, subtitle = '', body = '', variant = 'info', timeout = 6000, to = null, channel = 'general', icon = null }) {
      const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
      const item = { id, title, subtitle, body, time: nowLabel(), variant, timeout, to, channel, icon }
      // Debug opcional:
      // console.log('[toastStore.push]', item)

      this.items = [item, ...this.items].slice(0, this.maxStack)
      if (timeout > 0) setTimeout(() => this.remove(id), timeout)
      return id
    },

    remove(id) { this.items = this.items.filter(t => t.id !== id) },
    clear(channel) { this.items = channel ? this.items.filter(t => t.channel !== channel) : [] },

    // ===== Informes =====
    pushInformePendiente(p)  { return this.push({ channel: 'informe',   variant:'warning', icon:'bi-hourglass-split',   ...p }) },
    pushInformeAprobado(p)   { return this.push({ channel: 'informe',   variant:'success', icon:'bi-clipboard-check',   ...p }) },
    pushInformeRechazado(p)  { return this.push({ channel: 'informe',   variant:'danger',  icon:'bi-x-octagon',         ...p }) },
    pushInformeDevuelto(p)   { return this.push({ channel: 'informe',   variant:'warning', icon:'bi-arrow-return-left', ...p }) },
    pushInformeFinalizado(p) { return this.push({ channel: 'informe',   variant:'info',    icon:'bi-flag',              ...p }) },

    // ===== Rendiciones =====
    pushRendicionEnviada(p)   { return this.push({ channel: 'rendicion', variant:'info',    icon:'bi-send',              ...p }) },
    pushRendicionAprobada(p)  { return this.push({ channel: 'rendicion', variant:'success', icon:'bi-check2-circle',     ...p }) },
    pushRendicionRechazada(p) { return this.push({ channel: 'rendicion', variant:'danger',  icon:'bi-x-circle',          ...p }) },
    pushRendicionDevuelta(p)  { return this.push({ channel: 'rendicion', variant:'warning', icon:'bi-arrow-return-left', ...p }) },
    pushRendicionFinalizada(p){ return this.push({ channel: 'rendicion', variant:'info',    icon:'bi-flag',              ...p }) },
  },
})
