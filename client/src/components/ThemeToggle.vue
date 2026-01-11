<script setup>
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <button
    @click="settings.toggleTheme"
    class="w-9 h-9 rounded-full
           flex items-center justify-center
           bg-black/10 dark:bg-white/10
           hover:bg-black/20 dark:hover:bg-white/20
           transition"
    aria-label="Toggle theme"
  >
    <span v-if="settings.theme === 'dark'">🌙</span>
    <span v-else>☀️</span>
  </button>
</template>
