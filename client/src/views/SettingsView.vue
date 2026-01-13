<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const settings = useSettingsStore()



onMounted(() => {
  settings.fetchPoints()
})
</script>

<template>
  <div class="view-wrapper">

    <div class="app-card max-w-xl mx-auto p-6 space-y-6">

      
      <h2 class="text-2xl font-bold flex items-center gap-2">
        ⚙️ {{ t('settings.title') }}
      </h2>

      
      <div class="flex justify-between items-center">
        <span class="font-medium">
          {{ t('settings.theme') }}
        </span>

        <Button
          @click="settings.toggleTheme"
          class="p-button-outlined"
        >
          <span v-if="settings.theme === 'dark'">🌙 Dark</span>
          <span v-else>☀️ Light</span>
        </Button>
      </div>

      
      <div class="flex justify-between items-center">
        <span class="font-medium">
          {{ t('settings.currency') }}
        </span>

        <Dropdown
          :options="['PLN', 'EUR', 'USD', 'GBP', 'JPY']"
          v-model="settings.currency"
          class="w-40"
          @change="settings.setCurrency(settings.currency)"
        />
      </div>

      
      <div class="flex justify-between items-center">
        <span class="font-medium">
          {{ t('settings.language') }}
        </span>

        <Dropdown
          :options="[
            { label: 'Polski', value: 'pl' },
            { label: 'English', value: 'en' }
          ]"
          optionLabel="label"
          optionValue="value"
          v-model="settings.language"
          class="w-40"
          @change="settings.setLanguage(settings.language)"
        />
      </div>

      
      <div class="pt-4 border-t border-black/10 dark:border-white/10 font-semibold">
        🏆 {{ t('settings.points') }}:
        <span class="text-emerald-500">
          {{ settings.points }}
        </span>
      </div>

    </div>

  </div>
</template>
