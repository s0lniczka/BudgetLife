<template>
  <div class="view-wrapper space-y-8">

    
    <div class="app-card p-6">
      <h1 class="text-3xl font-extrabold">
        <span class="mr-2">👋</span>
        {{ t('dashboard.welcome') }},
        <span class="text-emerald-500">{{ user?.username }}</span>!
      </h1>

      <p class="opacity-70 mt-1">
        {{ t('dashboard.email') }}:
        <span class="font-medium">{{ user?.email }}</span>
        <span class="mx-2">|</span>
        {{ t('dashboard.currency') }}:
        <span class="font-medium">{{ settings.currency }}</span>
      </p>
    </div>

    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      
      <div class="lg:col-span-2 grid sm:grid-cols-3 gap-6">
        <div class="app-card p-5 space-y-2">
          <div class="font-semibold flex items-center gap-2">
            🪙 {{ t('dashboard.balance') }}
          </div>
          <div class="text-2xl font-bold text-emerald-500">
            {{ formatCurrency(balance) }}
          </div>
        </div>

        <div class="app-card p-5 space-y-1">
  <div class="font-semibold flex items-center gap-2">
    📚 {{ t('dashboard.activeBudgets') }}
  </div>

  <div class="text-2xl font-bold text-sky-500">
    {{ budgetsCount }}
  </div>

  <div class="text-sm opacity-70">
    {{ nearestBudget }}
  </div>
</div>


        <div class="app-card p-5 space-y-2">
          <div class="font-semibold flex items-center gap-2">
            🧾 {{ t('dashboard.monthExpenses') }}
          </div>
          <div class="text-2xl font-bold text-indigo-500">
            {{ expensesCount }}
          </div>
          
        </div>
      </div>

      
      <div class="app-card p-4 relative">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">
            📊 {{ t('dashboard.expensesStructure') }}
          </h2>

          <Dropdown
            v-model="selectedBudget"
            :options="budgets"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('dashboard.selectBudget')"
            class="w-56 bg-[var(--bg-card)] text-[var(--text-main)]"
            showClear
          />
        </div>

        <div class="relative h-64">
          <Chart
            ref="chartRef"
            :data="doughnutData"
            :options="doughnutOptions"
            type="doughnut"
            class="w-full h-full"
          />
          <div class="text-center text-sm opacity-70 mt-3">
  {{ t('dashboard.totalExpenses') }}:
  <strong>
    {{ formatCurrency(
      doughnutData.datasets[0].data.reduce((a,b)=>a+b,0)
    ) }}
  </strong>
</div>


          <div
            v-if="loadingChart"
            class="absolute inset-0 flex items-center justify-center
                   bg-black/5 dark:bg-black/30
                   backdrop-blur-sm rounded-lg"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-emerald-500"></i>
          </div>
        </div>
      </div>
    </div>

    
    <div class="app-card p-6">
      <h2 class="text-xl font-semibold mb-4">
        {{ t('dashboard.recentTransactions') }}
      </h2>

      <div v-if="loadingTransactions" class="opacity-60">
        {{ t('dashboard.loading') }}
      </div>

      <DataTable
        v-else
        :value="transactions"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="date" :header="t('dashboard.table.date')" >
          <template #body="slotProps">
            {{ formatDate(slotProps.data.date) }}
          </template>
        </Column>
        <Column :header="t('dashboard.table.category')">
          <template #body="slotProps">
            <div>
              <div class="font-medium">
                {{ slotProps.data.category }}
              </div>
            </div>
          </template>
        </Column>

        <Column :header="t('dashboard.table.amount')" class="text-right">
  <template #body="slotProps">
    <span
      class="font-semibold"
      :class="slotProps.data.amount >= 0
        ? 'text-emerald-500'
        : 'text-red-500'"
    >
      {{ formatCurrency(slotProps.data.amount) }}
    </span>
  </template>
</Column>

      </DataTable>

      <div
        v-if="!loadingTransactions && transactions.length === 0"
        class="opacity-60 mt-2"
      >
        {{ t('dashboard.noData') }}
      </div>
    </div>
    <div
  class="app-card p-6 flex flex-col md:flex-row
         md:items-center md:justify-between gap-4"
>
  
  <div>
    <h3 class="font-semibold text-lg flex items-center gap-2">
      🚀 Co dalej?
    </h3>
    <p class="text-sm opacity-70">
      Dodaj nowy wydatek albo sprawdź statystyki i trendy
    </p>
  </div>

  
  <div class="flex gap-3">
    <Button
      severity="success"
      class="px-4 py-2 font-semibold"
      @click="$router.push('/expenses')"
    >
      ➕ Dodaj wydatek
    </Button>

    <Button
      outlined
      severity="secondary"
      class="px-4 py-2"
      @click="$router.push('/stats')"
    >
      📊 Zobacz statystyki
    </Button>
  </div>
</div>


  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const API = 'http://localhost:5000/api'
const { t } = useI18n()
const settings = useSettingsStore()


const user = ref(null)
const budgets = ref([])
const selectedBudget = ref(null)

const monthExpensesSum = ref(0)
const balance = ref(0)
const budgetsCount = ref(0)
const expensesCount = ref(0)

const transactions = ref([])
const loadingTransactions = ref(true)
const loadingChart = ref(false)


const chartRef = ref(null)
const isDark = () => document.documentElement.classList.contains('dark')

const doughnutData = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [
        '#10b981',
        '#60a5fa',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6'
      ],
      borderWidth: 0
    }
  ]
})

const doughnutOptions = ref({
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: isDark() ? '#e5e7eb' : '#111827',
        font: { size: 12, weight: '500' }
      }
    },
    tooltip: {
      titleColor: isDark() ? '#e5e7eb' : '#111827',
      bodyColor: isDark() ? '#e5e7eb' : '#111827',
      backgroundColor: isDark() ? '#020617' : '#ffffff',
      borderColor: isDark() ? '#334155' : '#e5e7eb',
      borderWidth: 1,
      callbacks: {
        label: (ctx) =>
          ` ${ctx.label}: ${formatCurrency(ctx.raw ?? 0)}`
      }
    }
  },
  cutout: '65%'
})

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



onMounted(async () => {
  await loadBudgets()
  await loadSummary()

  if (selectedBudget.value) {
    await loadExpensesByCategory()
    await loadRecentExpenses()
  }
})

async function loadSummary() {
  const u = await fetch(`${API}/user/me`, { headers: authHeader() })
  user.value = await u.json()

  const b = await fetch(`${API}/budgets`, { headers: authHeader() })
  const allBudgets = await b.json()
  budgetsCount.value = allBudgets.length

  const e = await fetch(`${API}/expenses`, { headers: authHeader() })
  const allExpenses = await e.json()
  expensesCount.value = allExpenses.length
  monthExpensesSum.value = allExpenses.reduce(
  (sum, e) => sum + Number(e.amount || 0),
  0
)

  balance.value = allBudgets.reduce(
    (sum, b) =>
      sum + ((b.actual_income || 0) - (b.actual_expenses || 0)),
    0
  )
}

async function loadBudgets() {
  const res = await fetch(`${API}/budgets`, { headers: authHeader() })
  budgets.value = await res.json()

  if (budgets.value.length && !selectedBudget.value) {
    selectedBudget.value = budgets.value[0].id
  }
}

async function loadExpensesByCategory() {
  loadingChart.value = true

  const res = await fetch(
    `${API}/expenses/categories?budget_id=${selectedBudget.value}`,
    { headers: authHeader() }
  )
  const data = await res.json()

  const chart = chartRef.value?.chart
  if (chart) {
    chart.data.labels = data.map(d => d.category)
    chart.data.datasets[0].data = data.map(d => d.total)
    chart.update()
  }

  loadingChart.value = false
}

async function loadRecentExpenses() {
  loadingTransactions.value = true

  const res = await fetch(
    `${API}/expenses/recent?budget_id=${selectedBudget.value}`,
    { headers: authHeader() }
  )
  const newData = await res.json()

  transactions.value.splice(
    0,
    transactions.value.length,
    ...newData
  )

  loadingTransactions.value = false
}

function formatDate(value) {
  const d = new Date(value)
  d.setHours(d.getHours() + 1) 
  return d.toISOString().slice(0, 10)
}



watch(selectedBudget, async () => {
  if (!selectedBudget.value) return
  await loadExpensesByCategory()
  await loadRecentExpenses()
})

watch(
  () => document.documentElement.classList.contains('dark'),
  () => {
    const chart = chartRef.value?.chart
    if (!chart) return

    chart.options.plugins.legend.labels.color =
      isDark() ? '#e5e7eb' : '#111827'

    chart.options.plugins.tooltip.titleColor =
      isDark() ? '#e5e7eb' : '#111827'
    chart.options.plugins.tooltip.bodyColor =
      isDark() ? '#e5e7eb' : '#111827'
    chart.options.plugins.tooltip.backgroundColor =
      isDark() ? '#020617' : '#ffffff'
    chart.options.plugins.tooltip.borderColor =
      isDark() ? '#334155' : '#e5e7eb'

    chart.update()
  }
)
</script>

