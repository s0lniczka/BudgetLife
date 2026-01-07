<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Dropdown from 'primevue/dropdown'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const settings = useSettingsStore()

onMounted(() => {
  settings.fetchPoints()
})
</script>

<template>

    <div class="max-w-xl mx-auto p-6 rounded-xl shadow bg-white">
        <h2 class="text-2xl font-bold mb-6">
            ⚙️ {{ t('settings.title') }}
        </h2>

        <div class="flex justify-between items-center mb-4">
            <span>{{ t('settings.theme') }}</span>
            <span>—</span>
        </div>

        <div class="flex justify-between items-center mb-4">
            <span>{{ t('settings.currency') }}</span>
            <Dropdown
            :options="['PLN', 'EUR', 'USD']"
            v-model="settings.currency"
            />
        </div>

        <div class="flex justify-between items-center mb-4">
            <span>{{ t('settings.language') }}</span>
            <Dropdown
            :options="[
                { label: 'Polski', value: 'pl' },
                { label: 'English', value: 'en' }
            ]"
            optionLabel="label"
            optionValue="value"
            v-model="settings.language"
            @change="settings.setLanguage(settings.language)"
            />
        </div>

        <div class="mt-6 font-semibold">
            🏆 {{ t('settings.points') }}:
            <span class="text-emerald-500">{{ settings.points }}</span>
        </div>
    </div>

</template>
