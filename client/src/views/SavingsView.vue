<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-6">
    <div class="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8">

      <!-- HEADER -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">🏆 Twoje cele oszczędnościowe</h1>
        <Button label="➕ Nowy cel" class="p-button-success" @click="showDialog = true" />
      </div>

      <div class="flex gap-2 mb-6 flex-wrap">
        <button
          v-for="f in filters"
          :key="f.value"
          @click="activeFilter = f.value"
          class="px-4 py-2 rounded-full text-sm font-medium transition"
          :class="[
            activeFilter === f.value
              ? f.activeClass
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          ]"
        >
          {{ f.label }}
          <span class="ml-1 opacity-80">
            ({{ counts[f.value] }})
          </span>
        </button>
      </div>


      <!-- LISTA CELÓW -->
      <div v-if="goals.length === 0" class="text-gray-600 text-center py-10">
        Brak celów oszczędnościowych. Dodaj pierwszy cel!
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="g in filteredGoals"
          :key="g.id"
          class="bg-white border border-gray-200 rounded-xl shadow p-5 hover:shadow-lg transition cursor-pointer"
        >
          <div class="flex justify-between items-start mb-3">
            <h2 class="text-xl font-semibold text-gray-800">
              {{ g.name }}
            </h2>

            <div
              v-if="statusMap[g.status]"
              class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              :class="statusMap[g.status].class"
            >
              <span>{{ statusMap[g.status].label }}</span>
              <span class="opacity-70">|</span>
              <span>{{ formatDate(g.deadline) }}</span>
            </div>
          </div>

          <!-- PROGRESS BAR -->
          <div>
            <div class="text-sm text-gray-700 mb-1">
              {{ formatCurrency(g.saved_amount) }} / {{ formatCurrency(g.target_amount) }}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                class="h-4 bg-emerald-500 transition-all"
                :style="{ width: progress(g) + '%' }"
              ></div>
            </div>
            <div class="text-right text-sm font-medium mt-1 text-gray-700">
              {{ progress(g).toFixed(0) }}%
            </div>
          </div>

          <!-- BUTTONS -->
          <div class="flex justify-between mt-4">
            <Button
              label="Szczegóły"
              class="p-button-sm p-button-outlined"
              @click="goToGoal(g.id)"
            />
            <Button
              v-if="g.status !== 'completed'"
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger p-button-sm"
              @click="deleteGoal(g.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- DIALOG NOWEGO CELU -->
    <Dialog
      v-model:visible="showDialog"
      header="Nowy cel"
      modal
      class="w-[90vw] md:w-[30rem]"
    >
      <div class="flex flex-col gap-3">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa celu</label>
          <InputText v-model="form.name" class="w-full" placeholder="np. Nowy komputer" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kwota docelowa</label>
          <InputNumber
            v-model="form.target_amount"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Termin</label>
          <Calendar v-model="form.deadline" showIcon dateFormat="yy-mm-dd" class="w-full" />
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <Button label="Anuluj" class="p-button-text" @click="showDialog = false" />
          <Button label="Zapisz" class="p-button-success" @click="createGoal" />
        </div>

      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import { useRouter } from 'vue-router'

const API = "http://localhost:5000/api"

const goals = ref([])
const showDialog = ref(false)
const router = useRouter()
const activeFilter = ref('all')


const form = ref({
  name: '',
  target_amount: null,
  deadline: null
})

const filters = [
  {
    label: 'Wszystkie',
    value: 'all',
    activeClass: 'bg-gray-800 text-white'
  },
  {
    label: 'W realizacji',
    value: 'in_progress',
    activeClass: 'bg-blue-500 text-white'
  },
  {
    label: 'Zakończone',
    value: 'completed',
    activeClass: 'bg-emerald-500 text-white'
  },
  {
    label: 'Anulowane',
    value: 'canceled',
    activeClass: 'bg-yellow-500 text-white'
  },
  {
    label: 'Nieudane',
    value: 'failed',
    activeClass: 'bg-red-500 text-white'
  }
]

const statusMap = {
  in_progress: {
    label: 'W realizacji',
    class: 'bg-blue-100 text-blue-700'
  },
  completed: {
    label: 'Zakończony',
    class: 'bg-emerald-100 text-emerald-700'
  },
  canceled: {
    label: 'Anulowany',
    class: 'bg-yellow-100 text-yellow-700'
  },
  failed: {
    label: 'Nieudany',
    class: 'bg-red-100 text-red-700'
  }
}


function goToGoal(id) {
  router.push(`/savings/${id}`)
}

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function loadGoals() {
  const res = await fetch(`${API}/savings`, { headers: authHeader() })
  goals.value = await res.json()
}

const filteredGoals = computed(() => {
  if (activeFilter.value === 'all') return goals.value
  return goals.value.filter(g => g.status === activeFilter.value)
})

const counts = computed(() => ({
  all: goals.value.length,
  in_progress: goals.value.filter(g => g.status === 'in_progress').length,
  completed: goals.value.filter(g => g.status === 'completed').length,
  canceled: goals.value.filter(g => g.status === 'canceled').length,
  failed: goals.value.filter(g => g.status === 'failed').length
}))


async function createGoal() {
  if (!form.value.name)
    return alert("Podaj nazwę celu")
  if (!form.value.target_amount || form.value.target_amount <= 0)
    return alert("Podaj poprawną kwotę docelową")
  if (!form.value.deadline)
    return alert("Wybierz termin")

  const d= form.value.deadline

  const payload = {
    name: form.value.name,
    target_amount: Number(form.value.target_amount),
    deadline: d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : null
  }

  const res = await fetch(`${API}/savings`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    return alert(e.error || "Błąd podczas tworzenia celu")
  }

  showDialog.value = false
  form.value = { name: '', target_amount: null, deadline: null }
  await loadGoals()
}

async function deleteGoal(id) {
  if (!confirm("Czy na pewno chcesz usunąć ten cel?")) return
  await fetch(`${API}/savings/${id}`, { method: "DELETE", headers: authHeader() })
  await loadGoals()
}


function progress(g) {
  if (!g.saved_amount || !g.target_amount) return 0
  return Math.min((g.saved_amount / g.target_amount) * 100, 100)
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v)
}

function formatDate(v) {
  if (!v) return '---'
  return v.slice(0, 10).split('-').reverse().join('.')
}

onMounted(loadGoals)
</script>
