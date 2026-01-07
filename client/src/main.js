import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'

import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import 'primeicons/primeicons.css'
import './assets/main.css'

import { useSettingsStore } from '@/stores/settings'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(i18n)

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})

app.use(ToastService)
app.directive('tooltip', Tooltip)
app.use(router)

const settings = useSettingsStore()
settings.initTheme() // ⬅️ TU

app.mount('#app')
