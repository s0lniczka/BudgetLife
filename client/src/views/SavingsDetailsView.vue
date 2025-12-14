<template>
  <div class="min-h-screen  bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-6 flex justify-center">
    <div class="w-full max-w-4xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-10">

      <!-- HEADER -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-2">
          💰 Szczegóły celu
        </h1>
        <button
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          @click="editDialog = true"
        >
          Edytuj cel
        </button>

        <span class="text-gray-600 text-sm">
          Deadline: {{ formatDate(goal.deadline) }}
        </span>
      </div>

      <!-- CEL -->
      <div class="space-y-4 border-b pb-8">
        <h2 class="text-2xl font-semibold text-gray-900">{{ goal.name }}</h2>

        <div class="text-gray-700 space-y-1">
          <p><strong>Cel:</strong> {{ money(goal.target_amount) }}</p>
          <p><strong>Uzbierano:</strong> {{ money(goal.saved_amount) }}</p>
          <p><strong>Status:</strong>
            <span class="text-green-600 font-semibold">● {{ translateStatus(goal.status) }}</span>
          </p>
        </div>

        <!-- Progress Bar -->
        <div>
          <div class="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
            <div class="h-4 bg-emerald-500 transition-all" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="mt-1 text-sm text-gray-600 text-right">{{ progress }}%</p>
        </div>
      </div>

      <!-- DODAWANIE WPŁATY -->
      <div class="space-y-4 border-b pb-8">
        <h3 class="text-xl font-semibold text-gray-900">Dodaj wpłatę</h3>

        <div class="flex gap-3 items-center">
          <InputNumber
            v-model="paymentAmount"
            inputClass="w-40"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            placeholder="Kwota"
          />
          <Button label="Dodaj" class="p-button-success" @click="addPayment" />
        </div>
      </div>

      <!-- HISTORIA WPŁAT -->
      <div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Historia wpłat</h3>

        <div v-if="payments.length === 0" class="text-gray-500">
          Brak wpłat.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="p in payments"
            :key="p.id"
             class="flex justify-between items-center bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <span class="text-gray-700 font-medium">{{ formatDate(p.date) }}</span>
            <strong class="text-gray-900">{{ money(p.amount) }}</strong>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const API = 'http://localhost:5000/api'
const route = useRoute()

const goal = ref({})
const payments = ref([])
const paymentAmount = ref(null)

function auth() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function money(v) {
  return Number(v).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

function formatDate(d) {
  if (!d) return 'Brak terminu'
  return new Date(d).toLocaleDateString('pl-PL')
}

function translateStatus(s) {
  return {
    in_progress: 'W realizacji',
    completed: 'Zakończony',
    canceled: 'Przerwany',
    failed: 'Nieudany'
  }[s] || s
}

const progress = computed(() => {
  if (!goal.value.target_amount) return 0
  const p = (goal.value.saved_amount / goal.value.target_amount) * 100
  return Math.min(100, Math.round(p))
})

async function loadGoal() {
  const res = await fetch(`${API}/savings/${route.params.id}`, { headers: auth() })
  goal.value = await res.json()
}

async function loadPayments() {
  const res = await fetch(`${API}/savings/${route.params.id}/payments`, { headers: auth() })
  payments.value = await res.json()
}

async function addPayment() {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    return alert('Podaj poprawną kwotę')
  }

  const res = await fetch(`${API}/savings/${route.params.id}/payments`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Number(paymentAmount.value) })
  })

  if (!res.ok) {
    return alert('Nie udało się dodać wpłaty.')
  }

  paymentAmount.value = null
  await loadGoal()
  await loadPayments()
}

onMounted(async () => {
  await loadGoal()
  await loadPayments()
})
</script>
