<template>
  <div class="view-wrapper flex justify-center p-2 lg:p-5 xl:p-6">
    <div class="w-full max-w-5xl app-card p-4 lg:p-6 xl:p-8 space-y-10">

      
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button
            class="text-lg font-bold opacity-70 hover:opacity-100"
            @click="router.push('/savings')"
            :title="t('savings.back')"
          >
            ←
          </button>

          <h1 class="hidden sm:text-3xl font-bold flex items-center gap-2">
            🏆 {{ t('savings.detail.title') }}
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <Button
            :label="t('common.edit')"
            class="p-button-outlined"
            @click="openEdit"
          />
          <Button
            :label="t('common.delete')"
            class="p-button-danger"
            @click="deleteGoal"
          />
          <span class="opacity-70 text-sm whitespace-nowrap">
            | {{ t('savings.deadline') }}: {{ formatDate(goal.deadline) }}
          </span>
        </div>
      </div>

      
      <div class="border rounded-xl p-6 bg-black/5 dark:bg-white/5">
        <h2 class="text-2xl font-semibold mb-4">
          {{ goal.name }}
        </h2>

        <div class="grid grid-cols-12 gap-6 items-center md:divide-x">

          
          <div class="col-span-12 md:col-span-5 space-y-3">
            <p><strong>{{ t('savings.target') }}</strong> {{ money(goal.target_amount) }}</p>
            <p><strong>{{ t('savings.saved') }}</strong> {{ money(goal.saved_amount) }}</p>

            <div class="flex items-center gap-2">
              <strong>{{ t('savings.status') }}</strong>
              <span
                class="px-3 py-1 text-xs rounded-full font-semibold"
                :class="statusBadgeClass"
              >
                {{ translateStatus(goal.status) }}
              </span>
            </div>

            
            <div class="mt-4 max-w-sm">
              <div class="h-3 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 shadow-inner">
                <div
                  class="h-3 transition-all rounded-full"
                  :class="goal.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'"
                  :style="{ width: progress + '%' }"
                />
              </div>
              <p class="mt-1 text-xs opacity-70 text-right">
                {{ progress }}%   
              </p>
            </div>

            <div
              v-if="goal.status === 'completed'"
              class="mt-3 px-4 py-2 rounded-lg text-sm
                     bg-emerald-500/10 text-emerald-600"
            >
              🎉 {{ t('savings.completedMessage') }}
            </div>
          </div>

          
          <div class="col-span-12 md:col-span-7 h-56">
            <div class="flex gap-2 mb-2 justify-end">
              <Button
                size="small"
                :outlined="chartMode !== 'count'"
                @click="chartMode = 'count'"
              >
                {{ t('savings.chart.count') }}
              </Button>
              <Button
                size="small"
                :outlined="chartMode !== 'sum'"
                @click="chartMode = 'sum'"
              >
                {{ t('savings.chart.sum') }}
              </Button>
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

      
      <div class="space-y-4 border-b pb-8">
        <h3 class="text-xl font-semibold">{{ t('savings.addPayment') }}</h3>

        <div
          v-if="goal.status === 'completed'"
          class="opacity-60 italic"
        >
          {{ t('savings.cannotAdd') }}
        </div>

        <div v-else class="flex gap-3 items-center">
          <InputNumber
            v-model="paymentAmount"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            class="w-40"
          />
          <Button
            :label="t('common.add')"
            class="p-button-success"
            @click="addPayment"
          />
        </div>
      </div>

      
      <div>
        <h3 class="text-xl font-semibold mb-4">{{ t('savings.history') }}</h3>

        <div v-if="payments.length === 0" class="opacity-60">
          {{ t('savings.noPayments') }}
        </div>

        <div
          v-else
          class="relative space-y-6"
          :class="goal.status === 'completed' ? 'opacity-70 grayscale' : ''"
        >
          
          <div class="absolute left-4 top-0 bottom-0 w-px bg-black/20 dark:bg-white/20"></div>

          <div
            v-for="p in payments"
            :key="p.id"
            class="relative flex items-center gap-4 group"
          >
           
            <div
              class="relative z-10 flex items-center justify-center
                     w-6 h-6 rounded-full bg-emerald-500
                     text-white text-xs shadow"
            >
              +
            </div>

            
            <div
              class="flex items-center justify-between
                     w-full rounded-lg px-5 py-3
                     bg-white dark:bg-black/20
                     shadow-sm transition
                     group-hover:bg-black/5 dark:group-hover:bg-white/5"
            >
              <div class="flex items-center gap-3 text-sm opacity-70">
                <span>{{ formatDate(p.date) }}</span>
                <span class="opacity-30">|</span>
                <strong class="text-emerald-500">
                  {{ money(p.amount) }}
                </strong>
              </div>

              
              <div
                class="flex gap-3 opacity-0 group-hover:opacity-100 transition"
              >
                <button
                  class="text-blue-500 hover:text-blue-700"
                  @click="openEditPayment(p)"
                  :title="t('common.edit')"
                >
                  ✏️
                </button>

                <button
                  class="text-red-500 hover:text-red-700"
                  @click="deletePayment(p.id)"
                  :title="t('common.delete')"
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
        :header="t('savings.dialog.editGoal')"
        modal
        class="w-[90vw] md:w-[30rem]"
      >
        <div class="space-y-4">
          <InputText v-model="editForm.name" class="w-full" />
          <InputNumber
            v-model="editForm.target_amount"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            class="w-full"
          />
          <Calendar v-model="editForm.deadline" showIcon class="w-full" />

          <div class="flex justify-end gap-2">
            <Button text @click="editDialog = false">{{ t('common.cancel') }}</Button>
            <Button class="p-button-success" @click="saveEdit">{{ t('common.save') }}</Button>
          </div>
        </div>
      </Dialog>

      
      <Dialog
        v-model:visible="editPaymentDialog"
        header="Edytuj wpłatę"
        modal
        class="w-[90vw] md:w-[22rem]"
      >
        <InputNumber
          v-model="editedPayment.amount"
          mode="currency"
          currency="PLN"
          locale="pl-PL"
          class="w-full"
        />

        <div class="flex justify-end gap-2 mt-4">
          <Button text @click="editPaymentDialog = false">{{ t('common.cancel') }}</Button>
          <Button class="p-button-success" @click="savePaymentEdit">{{ t('common.save') }}</Button>
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
import { useI18n } from 'vue-i18n'
import {useSettingsStore} from '@/stores/settings'


const API = 'http://localhost:5000/api'
const route = useRoute()
const router = useRouter()

const editDialog = ref(false)
const deleteDialog = ref(false)

const toast = useToast()
const goal = ref({})
const payments = ref([])
const paymentAmount = ref(null)

const { t } = useI18n()
const settings = useSettingsStore()

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



function formatDate(d) {
  if (!d) return 'Brak terminu'
  return new Date(d).toLocaleDateString('pl-PL')
}

function translateStatus(s) {
  return t(`savings.statuses.${s}`)
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
          label: `Suma wpłat (${settings.currency})`,
          data: monthlyStats.value.sums,
          backgroundColor: '#34d399',
          borderRadius: 6
        }
  ]
}))


const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,

  layout: {
    padding: {
      bottom: 24, 
      top: 8,
      left: 8,
      right: 8
    }
  },

  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 16,
        font: { size: 12 }
      }
    }
  },

  scales: {
    x: {
      grid: { display: false }
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
    return alert(t('savings.validation.amount'))
  }

  const res = await fetch(`${API}/savings/${route.params.id}/payments`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Number(paymentAmount.value) })
  })

  if (!res.ok) {
    return alert(t('savings.errors.addPayment'))
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
    return alert(t('savings.errors.saveEdit'))
  }

  editPaymentDialog.value = false
  await loadGoal()
  await loadPayments()
}

async function deletePayment(paymentId) {
  if (!confirm(t('savings.confirmDelete'))) return

  const res = await fetch(
    `${API}/savings/${route.params.id}/payments/${paymentId}`,
    {
      method: 'DELETE',
      headers: auth()
    }
  )

  if (!res.ok) {
    return alert(t('savings.errors.deleteGoal'))
  }

  await loadGoal()
  await loadPayments()
}


async function deleteGoal() {
  if (!confirm(t('savings.confirmDelete'))) return

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

function money(value) {
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
  await loadGoal()
  await loadPayments()
})
</script>
