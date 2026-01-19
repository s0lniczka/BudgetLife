<template>
  <div class="view-wrapper space-y-8">

    
    <div class="app-card p-6">
      <h1 class="text-3xl font-extrabold">
        📊 {{ t('stats.title') }}
      </h1>
      <p class="opacity-70 mt-1">
        {{ t('stats.subtitle') }}
      </p>
    </div>

    
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

    
    <div class="app-card p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="flex flex-col sm:flex-row gap-4 items-start">
        <Dropdown
          v-model="selectedBudget"
          :options="budgets"
          optionLabel="name"
          optionValue="id"
          :placeholder="t('stats.selectBudget')"
          showClear
          class="w-full sm:w-64"
        />

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
      <div class="lg:col-span-2 h-36">
        <Chart
          type="line"
          :data="chartData"
          :options="chartOptions"
        />
      </div>
  
    </div>

    
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
          
          <div
            class="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
            :class="eventColor(e.type)"
          >
            {{ eventIcon(e.type) }}
          </div>

          
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
import { ref, onMounted, computed,watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from 'primevue/dropdown'
import {useSettingsStore} from '@/stores/settings'
import Chart from 'primevue/chart'

const { t } = useI18n()
const API = 'http://localhost:5000/api'
const settings = useSettingsStore()
const selectedBudget = ref(null)
const budgets = ref([])


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



function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

async function loadBudgets() {
  const res = await fetch(`${API}/budgets`, {
    headers: authHeader()
  })
  budgets.value = await res.json()
}

async function loadStats() {
  const query = selectedBudget.value
    ? `?budget_id=${selectedBudget.value}`
    : ''

  const res = await fetch(`${API}/stats${query}`, {
    headers: authHeader()
  })

  const data = await res.json()
  summary.value = data.summary
  events.value = data.events
}


watch(selectedBudget, async () => {
  await loadStats()
})

const chartData = computed(() => {
  const income = {}
  const expenses = {}

  events.value.forEach(e => {
    if (!e.date || e.amount == null) return

    const day = e.date.slice(0, 10)

    if (e.type === 'income') {
      income[day] = (income[day] || 0) + Number(e.amount)
    }

    if (e.type === 'expense') {
      expenses[day] = (expenses[day] || 0) + Math.abs(Number(e.amount))
    }
  })

  const labels = Array.from(
    new Set([...Object.keys(income), ...Object.keys(expenses)])
  ).sort()

  return {
    labels,
    datasets: [
      {
        label: t('stats.chart.income'),
        data: labels.map(d => income[d] || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.15)',
        tension: 0.4
      },
      {
        label: t('stats.chart.expenses'),
        data: labels.map(d => expenses[d] || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        tension: 0.4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
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


const filteredEvents = computed(() => {
  if (!filters.value.type) return events.value
  return events.value.filter(e => e.type === filters.value.type)
})

onMounted(async () => {
  await loadBudgets()
  await loadStats()
})

</script>
