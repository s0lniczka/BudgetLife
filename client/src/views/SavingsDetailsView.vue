<template>
  <div class="min-h-screen  bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-6 flex justify-center">
    <div class="w-full max-w-5xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-10">

      <!-- HEADER -->
      <div class="flex items-center justify-between mb-6">

      <!-- LEWA STRONA -->
      <div class="flex items-center gap-3">
        <button
          class="text-gray-600 font-bold hover:text-gray-900 text-xl"
          @click="router.push('/savings')"
          title="Wróć"
        >
          ←
        </button>

        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-2">
          🏆 Szczegóły celu
        </h1>
      </div>

      <!-- PRAWA STRONA -->
      <div class="flex items-center gap-3">
        <button
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          @click="openEdit"
        >
          Edytuj cel
        </button>

        <button
          class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
          @click="deleteGoal"
        >
          Usuń
        </button>

        <span class="text-gray-700 font-medium whitespace-nowrap">
          | Deadline: {{ formatDate(goal.deadline) }}
        </span>
      </div>

    </div>



      <!-- CEL -->
    <div class="border rounded-xl p-6 bg-white/70">

      <h2 class="text-2xl font-semibold text-gray-900 mb-4">
        {{ goal.name }}
      </h2>

      <div class="grid grid-cols-12 gap-6 items-center md:divide-x">

        <!-- LEWA STRONA -->
        <div class="col-span-12 md:col-span-5 space-y-3">

          <p class="text-gray-700">
            <strong>Cel:</strong> {{ money(goal.target_amount) }}
          </p>

          <p class="text-gray-700">
            <strong>Uzbierano:</strong> {{ money(goal.saved_amount) }}
          </p>

          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700"><strong>Status:</strong></span>

            <span
              class="px-3 py-1 text-xs rounded-full font-semibold"
              :class="statusBadgeClass"
            >
              {{translateStatus(goal.status) }}
            </span>
          </div>


          <!-- Pasek postępu -->
          <div class="mt-4 max-w-sm">
            <div class="bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                class="h-3 transition-all"
                :class="goal.status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'"
                :style="{ width: progress + '%' }"
              ></div>
            </div>
            <p class="mt-1 text-xs text-gray-600 text-right">
              {{ progress }}%
            </p>
          </div>
          <div
            v-if="goal.status === 'completed'"
            class="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-emerald-700 text-sm"
          >
            🎉 Gratulacje! Osiągnąłeś swój cel oszczędnościowy.
          </div>


        </div>

        <!-- PRAWA STRONA -->
        <div class="col-span-12 md:col-span-7 h-56">
          <div class="flex gap-2 mb-2 justify-end">
            <button
              class="px-3 py-1 text-xs rounded border"
              :class="chartMode === 'count'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600'"
              @click="chartMode = 'count'"
            >
              Liczba wpłat
            </button>

            <button
              class="px-3 py-1 text-xs rounded border"
              :class="chartMode === 'sum'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600'"
              @click="chartMode = 'sum'"
            >
              Suma (PLN)
            </button>
          </div>

          <Chart
            type="bar"
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
        </div>

      </div>
    </div>


    <!-- </div> -->

      <!-- DODAWANIE WPŁATY -->
      <div class="space-y-4 border-b pb-8">
        <h3 class="text-xl font-semibold text-gray-900">Dodaj wpłatę</h3>

        <!-- Gdy cel ukończony -->
        <div
          v-if="goal.status === 'completed'"
          class="text-sm text-gray-500 italic"
        >
          Ten cel jest już ukończony — nie można dodać kolejnych wpłat :)
        </div>

        <!-- Gdy w trakcie -->
        <div v-else class="flex gap-3 items-center">
          <InputNumber
            v-model="paymentAmount"
            inputClass="w-40"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            placeholder="Kwota"
          />
          <Button
            label="Dodaj"
            class="p-button-success"
            @click="addPayment"
          />
        </div>
      </div>

     

      <!-- HISTORIA WPŁAT -->
      <div>
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Historia wpłat</h3>

        <div v-if="payments.length === 0" class="text-gray-500">
          Brak wpłat.
        </div>

        <!-- HISTORIA WPŁAT – TIMELINE -->
        <div
          v-else
          class="relative space-y-6 transition"
          :class="goal.status === 'completed' ? 'opacity-70 grayscale' : ''"
        >

          <!-- pionowa linia -->
          <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>

          <div
            v-for="p in payments"
            :key="p.id"
            class="relative flex items-center gap-4"
          >
            <!-- kropka -->
            <div
              class="relative z-10 flex items-center justify-center
                    w-6 h-6 rounded-full bg-emerald-500
                    text-white text-xs shadow"
            >
              +
            </div>

            <!-- karta -->
            <div
              class="group flex items-center justify-between
                    w-full bg-white rounded-lg shadow
                    px-5 py-3
                    text-[15px]
                    hover:bg-gray-50 transition"
            >
              <!-- lewa strona -->
              <div class="flex items-center gap-3 text-sm text-gray-500">
                <span>{{ formatDate(p.date) }}</span>
                <span class="text-gray-300">|</span>
                <strong class="text-emerald-700">
                  {{ money(p.amount) }}
                </strong>
              </div>

              <!-- prawa strona: akcje -->
              <div
                class="flex gap-2 opacity-0 group-hover:opacity-100 transition"
              >
                <button
                  class="text-blue-500 hover:text-blue-700"
                  @click="openEditPayment(p)"
                  title="Edytuj"
                >
                  ✏️
                </button>

                <button
                  class="text-red-500 hover:text-red-700"
                  @click="deletePayment(p.id)"
                  title="Usuń"
                >
                  🗑️
                </button>
              </div>
            </div>

          </div>
        </div>


      </div>
      <Dialog
        v-model:visible="editDialog"
        header="Edytuj cel"
        modal
        class="w-[90vw] md:w-[30rem]"
      >
        <div class="space-y-4">

          <div>
            <label class="block text-sm font-medium mb-1">Nazwa</label>
            <InputText v-model="editForm.name" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Kwota docelowa</label>
            <InputNumber
              v-model="editForm.target_amount"
              mode="currency"
              currency="PLN"
              locale="pl-PL"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Deadline</label>
            <Calendar v-model="editForm.deadline" showIcon class="w-full" />
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <Button label="Anuluj" class="p-button-text" @click="editDialog = false" />
            <Button label="Zapisz" class="p-button-success" @click="saveEdit" />
          </div>

        </div>
      </Dialog>
      <Dialog
        v-model:visible="editPaymentDialog"
        header="Edytuj wpłatę"
        modal
        class="w-[90vw] md:w-[22rem]"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Kwota</label>
            <InputNumber
              v-model="editedPayment.amount"
              mode="currency"
              currency="PLN"
              locale="pl-PL"
              class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <Button
              label="Anuluj"
              class="p-button-text"
              @click="editPaymentDialog = false"
            />
            <Button
              label="Zapisz"
              class="p-button-success"
              @click="savePaymentEdit"
            />
          </div>
        </div>
      </Dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Chart from 'primevue/chart'
import { useToast } from 'primevue/usetoast'


const API = 'http://localhost:5000/api'
const route = useRoute()
const router = useRouter()

const editDialog = ref(false)
const deleteDialog = ref(false)

const toast = useToast()
const goal = ref({})
const payments = ref([])
const paymentAmount = ref(null)

const chartMode = ref('count') // count, sum

const editPaymentDialog = ref(false)
const editedPayment = ref({
  id: null,
  amount: null
})


const editForm = ref({
  name: '',
  target_amount: null,
  deadline: null
})

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

const monthlyStats = computed(() => {
  const map = {}

  for (const p of payments.value) {
    const d = new Date(p.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!map[key]) {
      map[key] = { count: 0, sum: 0 }
    }

    map[key].count += 1
    map[key].sum += Number(p.amount)
  }

  const labels = Object.keys(map).sort()
  return {
    labels,
    counts: labels.map(k => map[k].count),
    sums: labels.map(k => map[k].sum)
  }
})

const chartData = computed(() => ({
  labels: monthlyStats.value.labels,
  datasets: [
    chartMode.value === 'count'
      ? {
          label: 'Liczba wpłat',
          data: monthlyStats.value.counts,
          backgroundColor: '#60a5fa',
          borderRadius: 6
        }
      : {
          label: 'Suma wpłat (PLN)',
          data: monthlyStats.value.sums,
          backgroundColor: '#34d399',
          borderRadius: 6
        }
  ]
}))


const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 16,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          return chartMode.value === 'sum'
            ? `${ctx.raw.toLocaleString('pl-PL')} zł`
            : `${ctx.raw} wpłat`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#e5e7eb'
      },
      ticks: {
        font: { size: 11 }
      }
    }
  }
}

const statusBadgeClass = computed(() => {
  switch (goal.value.status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700'
    case 'canceled':
      return 'bg-gray-200 text-gray-600'
    case 'failed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
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

  const data = await res.json();

  if (data.achievements?.length) {
    data.achievements.forEach(name => {
      toast.add({
        severity: 'success',
        summary: '🏆 Osiągnięcie odblokowane!',
        detail: name,
        life: 4000
      });
    });
  }


  paymentAmount.value = null
  await loadGoal()
  await loadPayments()
}

function openEditPayment(p) {
  editedPayment.value = {
    id: p.id,
    amount: p.amount
  }
  editPaymentDialog.value = true
}

async function savePaymentEdit() {
  const res = await fetch(
    `${API}/savings/${route.params.id}/payments/${editedPayment.value.id}`,
    {
      method: 'PUT',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(editedPayment.value.amount)
      })
    }
  )

  if (!res.ok) {
    return alert('Nie udało się zapisać zmian')
  }

  editPaymentDialog.value = false
  await loadGoal()
  await loadPayments()
}

async function deletePayment(paymentId) {
  if (!confirm('Usunąć tę wpłatę?')) return

  const res = await fetch(
    `${API}/savings/${route.params.id}/payments/${paymentId}`,
    {
      method: 'DELETE',
      headers: auth()
    }
  )

  if (!res.ok) {
    return alert('Nie udało się usunąć wpłaty')
  }

  await loadGoal()
  await loadPayments()
}


async function deleteGoal() {
  if (!confirm('Czy na pewno chcesz usunąć ten cel?')) return

  const res = await fetch(`${API}/savings/${route.params.id}`, {
    method: 'DELETE',
    headers: auth()
  })

  if (!res.ok) {
    return alert('Nie udało się usunąć celu.')
  }

  router.push('/savings')
}

function openEdit() {
  editForm.value = {
    name: goal.value.name,
    target_amount: goal.value.target_amount,
    deadline: goal.value.deadline ? new Date(goal.value.deadline) : null
  }
  editDialog.value = true
}

async function saveEdit() {
  const payload = {
    name: editForm.value.name,
    target_amount: Number(editForm.value.target_amount),
    deadline: editForm.value.deadline
      ? `${editForm.value.deadline.getFullYear()}-${String(editForm.value.deadline.getMonth() + 1).padStart(2, '0')}-${String(editForm.value.deadline.getDate()).padStart(2, '0')}`
      : null
  }

  const res = await fetch(`${API}/savings/${route.params.id}`, {
    method: 'PUT',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    return alert('Nie udało się zapisać zmian.')
  }

  editDialog.value = false
  await loadGoal()
}


onMounted(async () => {
  await loadGoal()
  await loadPayments()
})
</script>
