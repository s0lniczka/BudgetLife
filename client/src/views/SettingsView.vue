<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Dropdown from 'primevue/dropdown'

const settings = useSettingsStore()

onMounted(() => {
  settings.fetchPoints()
})
</script>

<template>

    <!-- <div class="p-10 bg-white dark:bg-black text-black dark:text-white">
    TEST DARK MODE
    </div> -->

  <div class="max-w-xl mx-auto p-6 rounded-xl shadow
              bg-white text-gray-900
              dark:bg-slate-900 dark:text-gray-100">

    <h2 class="text-2xl font-bold mb-6">⚙️ Ustawienia</h2>

    <!-- MOTYW -->
    <div class="flex justify-between items-center mb-4">
      <span>Motyw</span>
      <Dropdown
        :options="['light', 'dark']"
        v-model="settings.theme"
        @change="settings.setTheme(settings.theme)"
      />
    </div>

    <!-- WALUTA -->
    <div class="flex justify-between items-center mb-4">
      <span>Waluta</span>
      <Dropdown
        :options="['PLN', 'EUR', 'USD']"
        v-model="settings.currency"
        @change="settings.persist()"
      />
    </div>

    <!-- JĘZYK -->
    <div class="flex justify-between items-center mb-4">
      <span>Język</span>
      <Dropdown
        :options="[
          { label: 'Polski', value: 'pl' },
          { label: 'English', value: 'en' }
        ]"
        optionLabel="label"
        optionValue="value"
        v-model="settings.language"
        @change="settings.persist()"
      />
    </div>

    <!-- PUNKTY -->
    <div class="mt-6 text-lg font-semibold">
      🏆 Punkty za osiągnięcia:
      <span class="text-emerald-500">{{ settings.points }}</span>
    </div>
  </div>
</template>
