import { defineStore } from 'pinia'

function nowLabel() {
  return new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date())
}

export const useToastStore = defineStore('toasts', {
  state: () => ({
    // { id, title, subtitle, body, time, variant, timeout, to, channel }
    // channel: 'support' | 'rendicion' | 'general'
    items: [],
  }),
  actions: {
    push({ title, subtitle = '', body = '', variant = 'light', timeout = 6000, to = null, channel = 'general' }) {
      const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
      this.items.push({ id, title, subtitle, body, time: nowLabel(), variant, timeout, to, channel })
      if (timeout > 0) setTimeout(() => this.remove(id), timeout)
      return id
    },
    // atajos convenientes (opcionales)
    pushSupport(payload)   { return this.push({ ...payload, channel: 'support' }) },
    pushRendicion(payload) { return this.push({ ...payload, channel: 'rendicion' }) },

    remove(id) { this.items = this.items.filter(t => t.id !== id) },
    clear(channel) {
      this.items = channel ? this.items.filter(t => t.channel !== channel) : []
    },
  },
})
