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

        <!-- GÓRNY GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <!-- LEWA STRONA -->
          <div class="order-2 lg:order-1 lg:col-span-2 grid sm:grid-cols-3 gap-6">
            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2">
                <span>🪙</span> Saldo
              </div>
              <div class="text-2xl font-bold text-emerald-400 mt-2">
                {{ formatCurrency(balance) }}
              </div>
            </div>

            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2">
                <span>📚</span> Aktywne budżety
              </div>
              <div class="text-2xl font-bold text-sky-400 mt-2">{{ budgetsCount }}</div>
            </div>

            <div class="rounded-xl bg-gray-900 text-white p-5">
              <div class="font-semibold flex items-center gap-2">
                <span>🧾</span> Wydatki w tym miesiącu
              </div>
              <div class="text-2xl font-bold text-indigo-400 mt-2">{{ expensesCount }}</div>
            </div>
          </div>

          <!-- PRAWA STRONA: WYKRES -->
          <div class="order-1 lg:order-2">
            <div class="rounded-xl bg-white border border-black/5 shadow p-4">
              <div class="flex justify-between items-center mb-2">
                <h2 class="text-lg font-semibold text-gray-800">📊 Struktura wydatków</h2>
                <Dropdown
                  v-model="selectedBudget"
                  :options="budgets"
                  optionLabel="month"
                  optionValue="id"
                  placeholder="Wybierz budżet"
                  class="w-56"
                  showClear
                />
              </div>
              <Chart
                type="doughnut"
                :data="doughnutData"
                :options="doughnutOptions"
                class="w-full h-64"
              />
            </div>
          </div>
        </div>

        <!-- OSTATNIE TRANSAKCJE -->
        <div class="mt-8 bg-white rounded-xl p-4 shadow-inner">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Ostatnie transakcje</h2>

          <div v-if="loadingTransactions" class="text-gray-500">
            Ładowanie danych...
          </div>

          <div v-else-if="transactions.length === 0" class="text-gray-500">
            Brak transakcji dla wybranego budżetu.
          </div>

          <DataTable v-else :value="transactions" stripedRows responsiveLayout="scroll">
            <Column field="date" header="Data" />
            <Column field="category" header="Kategoria" />
            <Column field="amount" header="Kwota" />
          </DataTable>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import Dropdown from 'primevue/dropdown'

const router = useRouter()
const API = 'http://localhost:5000/api'

const user = ref(null)
const budgets = ref([])
const selectedBudget = ref(null)
const balance = ref(0)
const budgetsCount = ref(0)
const expensesCount = ref(0)
const transactions = ref([])
const loadingTransactions = ref(true)

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
        label: (ctx) => {
          const value = ctx.raw ?? 0
          return ` ${ctx.label}: ${formatCurrency(value)}`
        }
      }
    }
  },
  cutout: '65%'
})

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
}

// 🔹 Wczytanie listy budżetów
async function loadBudgets() {
  const res = await fetch(`${API}/budgets`, { headers: authHeader() })
  budgets.value = await res.json()
  if (budgets.value.length > 0 && !selectedBudget.value) {
    selectedBudget.value = budgets.value[0].id
  }
}

// 🔹 Wczytanie danych dla dashboardu
async function loadSummary() {
  const resUser = await fetch(`${API}/user/me`, { headers: authHeader() })
  user.value = await resUser.json()

  const resBudgets = await fetch(`${API}/budgets`, { headers: authHeader() })
  const allBudgets = await resBudgets.json()

  const resExpenses = await fetch(`${API}/expenses`, { headers: authHeader() })
  const allExpenses = await resExpenses.json()

  budgetsCount.value = allBudgets.length
  expensesCount.value = allExpenses.length
  balance.value = allBudgets.reduce((sum, b) => sum + ((b.actual_income || 0) - (b.actual_expenses || 0)), 0)
}

// 🔹 Wczytanie wydatków wg kategorii dla wybranego budżetu
async function loadExpensesByCategory() {
  if (!selectedBudget.value) return
  const res = await fetch(`${API}/expenses/categories?budget_id=${selectedBudget.value}`, { headers: authHeader() })
  const data = await res.json()
  doughnutData.value.labels = data.map(d => d.category)
  doughnutData.value.datasets[0].data = data.map(d => d.total)
}

// 🔹 Wczytanie ostatnich transakcji
async function loadRecentExpenses() {
  loadingTransactions.value = true
  if (!selectedBudget.value) return
  const res = await fetch(`${API}/expenses/recent?budget_id=${selectedBudget.value}`, { headers: authHeader() })
  transactions.value = await res.json()
  loadingTransactions.value = false
}

// 🔹 Reakcja na zmianę budżetu
watch(selectedBudget, async () => {
  await Promise.all([loadExpensesByCategory(), loadRecentExpenses()])
})

onMounted(async () => {
  await Promise.all([loadBudgets(), loadSummary()])
  if (selectedBudget.value) {
    await Promise.all([loadExpensesByCategory(), loadRecentExpenses()])
  }
})
</script>
