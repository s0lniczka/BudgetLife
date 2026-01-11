import { i18n } from '@/i18n'
import { defineStore } from 'pinia'

const FIXED_RATES = {
  PLN: 1,
  EUR: 0.23,
  USD: 0.25,
  GBP: 0.20,
  JPY: 36.5
}


export const useSettingsStore = defineStore('settings', {

    
  state: () => ({
    theme: localStorage.getItem('theme') || 'light',
    currency: localStorage.getItem('currency') || 'PLN',
    language: localStorage.getItem('language') || 'pl',
    points: 0
  }),

  actions: {
    initTheme() {
        const saved = localStorage.getItem('theme')

        // ⬇️ jawny default
        this.theme = saved === 'dark' || saved === 'light'
            ? saved
            : 'light'

        const root = document.documentElement
        const isDark = this.theme === 'dark'

        root.classList.toggle('dark', isDark)
        root.style.colorScheme = isDark ? 'dark' : 'light'
    },

    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      this.initTheme()
    },

    toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', this.theme)
    this.initTheme()
    console.log('TOGGLE', this.theme)
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
    },

    setCurrency(currency) {
      this.currency = currency
      localStorage.setItem('currency', currency)
    },

    convertFromPLN(value) {
        if (value == null) return null
        const rate = FIXED_RATES[this.currency] || 1
        return value * rate
    }

  }
})
