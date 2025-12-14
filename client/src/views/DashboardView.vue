<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300">
    <main class="flex-1 p-4 md:p-6">

      <div class="w-full min-h-[calc(100vh-2rem)] bg-white/85 backdrop-blur-lg shadow-2xl rounded-2xl p-6 md:p-8">

        <!-- HEADER -->
        <div class="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900">
              <span class="mr-2">👋</span>Witaj,
              <span class="text-emerald-600">{{ user?.username }}</span>!
            </h1>
            <p class="text-gray-600 mt-1">
              Twój e-mail: <span class="font-medium text-gray-800">{{ user?.email }}</span>
              <span class="mx-2">|</span>
              Waluta: <span class="font-medium">{{ user?.currency }}</span>
            </p>
          </div>
        </div>

        <!-- TOP GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

          <!-- LEFT SUMMARY -->
          <div class="order-2 lg:order-1 lg:col-span-2 grid sm:grid-cols-3 gap-6">
            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2"><span>🪙</span> Saldo</div>
              <div class="text-2xl font-bold text-emerald-400 mt-2">{{ formatCurrency(balance) }}</div>
            </div>

            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2"><span>📚</span> Aktywne budżety</div>
              <div class="text-2xl font-bold text-sky-400 mt-2">{{ budgetsCount }}</div>
            </div>

            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2"><span>🧾</span> Wydatki w tym miesiącu</div>
              <div class="text-2xl font-bold text-indigo-400 mt-2">{{ expensesCount }}</div>
            </div>
          </div>

          <!-- RIGHT CHART -->
          <div class="order-1 lg:order-2">
            <div class="rounded-xl bg-white border border-black/5 shadow p-4 relative">

              <div class="flex justify-between items-center mb-2">
                <h2 class="text-lg font-semibold text-gray-800">📊 Struktura wydatków</h2>

                <Dropdown
                  v-model="selectedBudget"
                  :options="budgets"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Wybierz budżet"
                  class="w-56"
                  showClear
                />
              </div>

              <!-- LOCAL CHART LOADER -->
              <div class="relative h-64">
                <Chart
                  ref="chartRef"
                  :data="doughnutData"
                  :options="doughnutOptions"
                  type="doughnut"
                  class="w-full h-full"
                />

                <div
                  v-if="loadingChart"
                  class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg"
                >
                  <i class="pi pi-spin pi-spinner text-3xl text-emerald-600"></i>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- RECENT TRANSACTIONS -->
        <div class="mt-8 bg-white rounded-xl p-4 shadow-inner">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Ostatnie transakcje</h2>

          <div v-if="loadingTransactions" class="text-gray-500">Ładowanie danych...</div>

          <div v-else>
            <!-- DataTable ALWAYS mounted = zero flicker -->
            <DataTable
              :value="transactions"
              stripedRows
              responsiveLayout="scroll"
            >
              <Column field="date" header="Data" />
              <Column field="category" header="Kategoria" />
              <Column field="amount" header="Kwota" />
            </DataTable>

            <div v-if="transactions.length === 0" class="text-gray-500 mt-2">
              Brak transakcji dla wybranego budżetu.
            </div>
          </div>

        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'

const API = 'http://localhost:5000/api'

/* STATE */
const user = ref(null)
const budgets = ref([])
const selectedBudget = ref(null)

const balance = ref(0)
const budgetsCount = ref(0)
const expensesCount = ref(0)

const transactions = ref([])
const loadingTransactions = ref(true)
const loadingChart = ref(false)

/* CHART FIX */
const chartRef = ref(null)  // ⭐ ważne

const doughnutData = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: ['#10b981', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6'],
      borderWidth: 0
    }
  ]
})

const doughnutOptions = ref({
  plugins: {
    legend: { position: 'bottom', labels: { color: '#111827' } },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw ?? 0)}`
      }
    }
  },
  cutout: '65%'
})

/* HELPERS */
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
}

/* INITIAL LOAD */
onMounted(async () => {
  await loadBudgets()
  await loadSummary()

  if (selectedBudget.value) {
    await loadExpensesByCategory()
    await loadRecentExpenses()
  }
})

/* LOAD STATIC SUMMARY ONCE */
async function loadSummary() {
  const u = await fetch(`${API}/user/me`, { headers: authHeader() })
  user.value = await u.json()

  const b = await fetch(`${API}/budgets`, { headers: authHeader() })
  const allBudgets = await b.json()
  budgetsCount.value = allBudgets.length

  const e = await fetch(`${API}/expenses`, { headers: authHeader() })
  const allExpenses = await e.json()
  expensesCount.value = allExpenses.length

  balance.value = allBudgets.reduce(
    (sum, b) => sum + ((b.actual_income || 0) - (b.actual_expenses || 0)),
    0
  )
}

/* LOAD BUDGETS */
async function loadBudgets() {
  const res = await fetch(`${API}/budgets`, { headers: authHeader() })
  budgets.value = await res.json()

  if (budgets.value.length > 0 && !selectedBudget.value) {
    selectedBudget.value = budgets.value[0].id
  }
}

/* LOAD CHART (ZERO FLICKER VERSION) */
async function loadExpensesByCategory() {
  loadingChart.value = true

  const res = await fetch(`${API}/expenses/categories?budget_id=${selectedBudget.value}`, {
    headers: authHeader()
  })
  const data = await res.json()

  const chart = chartRef.value?.chart
  if (chart) {
    chart.data.labels = data.map(d => d.category)
    chart.data.datasets[0].data = data.map(d => d.total)
    chart.update()   // ⭐ najważniejsze – bez resetu canvas
  }

  loadingChart.value = false
}

/* LOAD TABLE (ZERO FLICKER VERSION) */
async function loadRecentExpenses() {
  loadingTransactions.value = true

  const res = await fetch(`${API}/expenses/recent?budget_id=${selectedBudget.value}`, {
    headers: authHeader()
  })
  const newData = await res.json()

  // mutate array = component never unmounts
  transactions.value.splice(0, transactions.value.length, ...newData)

  loadingTransactions.value = false
}

/* WATCH ONLY CHANGING DATA */
watch(selectedBudget, async () => {
  if (!selectedBudget.value) return

  await loadExpensesByCategory()
  await loadRecentExpenses()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
