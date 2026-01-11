<template>
  <div class="view-wrapper space-y-8">

    <!-- HEADER -->
    <div class="app-card p-6">
      <h1 class="text-3xl font-extrabold">
        📊 {{ t('stats.title') }}
      </h1>
      <p class="opacity-70 mt-1">
        {{ t('stats.subtitle') }}
      </p>
    </div>

    <!-- SUMMARY -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="app-card p-5 space-y-2">
        <div class="font-semibold">💰 {{ t('stats.totalIncome') }}</div>
        <div class="text-2xl font-bold text-emerald-500">
          {{ formatCurrency(summary.income) }}
        </div>
      </div>

      <div class="app-card p-5 space-y-2">
        <div class="font-semibold">📉 {{ t('stats.totalExpenses') }}</div>
        <div class="text-2xl font-bold text-red-500">
          {{ formatCurrency(summary.expenses) }}
        </div>
      </div>

      <div class="app-card p-5 space-y-2">
        <div class="font-semibold">🏦 {{ t('stats.totalSaved') }}</div>
        <div class="text-2xl font-bold text-sky-500">
          {{ formatCurrency(summary.saved) }}
        </div>
      </div>

      <div class="app-card p-5 space-y-2">
        <div class="font-semibold">🏆 {{ t('stats.achievements') }}</div>
        <div class="text-2xl font-bold text-indigo-500">
          {{ summary.achievements }}
        </div>
      </div>
    </div>

    <!-- FILTER -->
    <div class="app-card p-4 flex gap-4">
      <Dropdown
        v-model="filters.type"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('stats.filters.type')"
        class="w-56"
        showClear
      />
    </div>

    <!-- HISTORY -->
    <div class="app-card p-6">
      <h2 class="text-xl font-semibold mb-6">
        🕒 {{ t('stats.history') }}
      </h2>

      <div v-if="filteredEvents.length === 0" class="opacity-60 text-sm">
        {{ t('stats.noHistory') }}
      </div>

      <div
        v-else
        class="relative border-l border-black/10 dark:border-white/10 pl-6 space-y-6"
      >
        <div
          v-for="e in filteredEvents"
          :key="e.id"
          class="relative"
        >
          <!-- DOT -->
          <div
            class="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
            :class="eventColor(e.type)"
          >
            {{ eventIcon(e.type) }}
          </div>

          <!-- CARD -->
          <div class="app-card p-4">
            <div class="flex justify-between items-start gap-4">
              <div>
                <div class="font-semibold">
                  {{ e.title }}
                </div>
                <div class="text-sm opacity-70">
                  {{ formatDate(e.date) }}
                </div>
              </div>

              <!-- KWOTA TYLKO DLA TRANSAKCJI -->
              <div
                v-if="e.amount !== null"
                class="font-bold"
                :class="e.amount >= 0 ? 'text-emerald-500' : 'text-red-500'"
              >
                {{ formatCurrency(e.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from 'primevue/dropdown'
import {useSettingsStore} from '@/stores/settings'

const { t } = useI18n()
const API = 'http://localhost:5000/api'
const settings = useSettingsStore()

/* ===================== STATE ===================== */
const summary = ref({
  income: 0,
  expenses: 0,
  saved: 0,
  achievements: 0
})

const events = ref([])

const filters = ref({
  type: null
})

const typeOptions = [
  { label: t('stats.types.income'), value: 'income' },
  { label: t('stats.types.expense'), value: 'expense' },
  { label: t('stats.types.saving'), value: 'saving' },
  { label: t('stats.types.achievement'), value: 'achievement' },
  { label: t('stats.types.budget'), value: 'budget' }
]


/* ===================== HELPERS ===================== */
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function formatCurrency(value) {
  if (value == null) return '—'

  const converted = settings.convertFromPLN(value)

  return new Intl.NumberFormat(
    settings.language === 'pl' ? 'pl-PL' : 'en-US',
    {
      style: 'currency',
      currency: settings.currency
    }
  ).format(converted)
}

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleString('pl-PL')
}

function eventIcon(type) {
  return {
    income: '➕',
    expense: '➖',
    saving: '🎯',
    achievement: '🏆',
    budget: '📁'
  }[type]
}

function eventColor(type) {
  return {
    income: 'bg-emerald-500',
    expense: 'bg-red-500',
    saving: 'bg-sky-500',
    achievement: 'bg-indigo-500',
    budget: 'bg-gray-400'
  }[type]
}

/* ===================== DATA ===================== */
const filteredEvents = computed(() => {
  if (!filters.value.type) return events.value
  return events.value.filter(e => e.type === filters.value.type)
})

onMounted(async () => {
  const res = await fetch(`${API}/stats`, {
    headers: authHeader()
  })

  const data = await res.json()

  summary.value = data.summary
  events.value = data.events
})
</script>
