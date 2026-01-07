import { createI18n } from 'vue-i18n'
import pl from './pl.json'
import en from './en.json'

const savedLang = localStorage.getItem('language') || 'pl'

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'pl',
  fallbackLocale: 'en',
  messages: {
    pl,
    en
  }
})
