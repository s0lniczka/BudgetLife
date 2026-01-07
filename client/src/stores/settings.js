import { i18n } from '@/i18n'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light',
    currency: localStorage.getItem('currency') || 'PLN',
    language: localStorage.getItem('language') || 'pl',
    points: 0
  }),

  actions: {
    initTheme() {
      const html = document.documentElement
      if (this.theme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    },

    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      this.initTheme()
    },

    persist() {
      localStorage.setItem('currency', this.currency)
      localStorage.setItem('language', this.language)
    },

    async fetchPoints() {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/achievements/points', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      this.points = data.points
    },

    setLanguage(lang) {
      this.language = lang
      localStorage.setItem('language', lang)
      i18n.global.locale.value = lang
    }
  }
})
