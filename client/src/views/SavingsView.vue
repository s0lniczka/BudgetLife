<template>
  <div class="view-wrapper space-y-6">

    <!-- HEADER -->
    <div class="app-card p-6 flex justify-between items-center">
      <h1 class="text-3xl font-bold">
        🏆 {{ t('savings.title') }}
      </h1>
      <Button
        :label="'➕ ' + t('savings.new')"
        class="p-button-success"
        @click="showDialog = true"
      />
    </div>

    <!-- FILTERS -->
    <div class="app-card p-4 flex gap-2 flex-wrap">
      <button
        v-for="f in filters"
        :key="f.value"
        @click="activeFilter = f.value"
        class="px-4 py-2 rounded-full text-sm font-medium transition"
        :class="
          activeFilter === f.value
            ? f.activeClass
            : 'opacity-60 hover:opacity-100'
        "
      >
        {{ f.label }}
        <span class="ml-1 opacity-70">
          ({{ counts[f.value] }})
        </span>
      </button>
    </div>

    <!-- EMPTY STATE -->
    <div
      v-if="goals.length === 0"
      class="app-card p-10 text-center opacity-60"
    >
      {{ t('savings.filters.all') }}
    </div>

    <!-- GOALS GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="g in filteredGoals"
        :key="g.id"
        class="app-card p-5 hover:shadow-lg transition cursor-pointer"
      >
        <div class="flex justify-between items-start mb-3">
          <h2 class="text-xl font-semibold">
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

        <!-- PROGRESS -->
        <div>
          <div class="text-sm opacity-70 mb-1">
            {{ formatCurrency(g.saved_amount) }}
            /
            {{ formatCurrency(g.target_amount) }}
          </div>

          <div class="w-full bg-black/10 dark:bg-white/10 rounded-full h-4 overflow-hidden">
            <div
              class="h-4 bg-emerald-500 transition-all"
              :style="{ width: progress(g) + '%' }"
            />
          </div>

          <div class="text-right text-sm font-medium mt-1 opacity-70">
            {{ progress(g).toFixed(0) }}%
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="flex justify-between mt-4">
          <Button
            :label="t('savings.details')"
            class="p-button-sm p-button-outlined"
            @click="goToGoal(g.id)"
          />
          <Button
            v-if="g.status === 'in_progress'"
            icon="pi pi-times"
            class="p-button-rounded p-button-warning p-button-sm"
            @click="cancelGoal(g.id)"
          />
          <Button
            v-if="g.status === 'canceled' || g.status === 'failed'"
            icon="pi pi-trash"
            class="p-button-rounded p-button-danger p-button-sm"
            @click="deleteGoal(g.id)"
          />

        </div>
      </div>
    </div>

    <!-- NEW GOAL DIALOG -->
    <Dialog
      v-model:visible="showDialog"
      :header="t('savings.form.new')"
      modal
      class="w-[90vw] md:w-[30rem]"
    >
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('savings.form.name') }}
          </label>
          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="np. Nowy komputer"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('savings.form.target') }}
          </label>
          <InputNumber
            v-model="form.target_amount"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('savings.form.deadline') }}
          </label>
          <Calendar
            v-model="form.deadline"
            showIcon
            dateFormat="yy-mm-dd"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <Button
            :label="t('common.cancel')"
            class="p-button-text"
            @click="showDialog = false"
          />
          <Button
            :label="t('common.save')"
            class="p-button-success"
            @click="createGoal"
          />
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
import { useI18n } from 'vue-i18n'
import {useSettingsStore} from "@/stores/settings";

const API = 'http://localhost:5000/api'

const goals = ref([])
const showDialog = ref(false)
const activeFilter = ref('all')
const router = useRouter()
const { t } = useI18n()
const settings = useSettingsStore()

const form = ref({
  name: '',
  target_amount: null,
  deadline: null
})

const filters = [
  { label: t('savings.filters.all'), value: 'all', activeClass: 'bg-gray-800 text-white' },
  { label: t('savings.filters.in_progress'), value: 'in_progress', activeClass: 'bg-blue-500 text-white' },
  { label: t('savings.filters.completed'), value: 'completed', activeClass: 'bg-emerald-500 text-white' },
  { label: t('savings.filters.canceled'), value: 'canceled', activeClass: 'bg-yellow-500 text-white' },
  { label: t('savings.filters.failed'), value: 'failed', activeClass: 'bg-red-500 text-white' }
]

const statusMap = {
  in_progress: { label: t('savings.filters.in_progress'), class: 'bg-blue-100 text-blue-700' },
  completed: { label: t('savings.filters.completed'), class: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: t('savings.filters.canceled'), class: 'bg-yellow-100 text-yellow-700' },
  failed: { label: t('savings.filters.failed'), class: 'bg-red-100 text-red-700' }
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

function goToGoal(id) {
  router.push(`/savings/${id}`)
}

async function createGoal() {
  if (!form.value.name) return alert(t('savings.validation.name'))
  if (!form.value.target_amount || form.value.target_amount <= 0)
    return alert(t('savings.validation.target'))
  if (!form.value.deadline)
    return alert(t('savings.validation.deadline'))

  const d = new Date(form.value.deadline)
  d.setHours(12,0,0,0)
  const payload = {
    name: form.value.name,
    target_amount: Number(form.value.target_amount),
    deadline: d.toISOString().slice(0, 10)
  }

  const res = await fetch(`${API}/savings`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    return alert(e.error || t('savings.createError'))
  }

  showDialog.value = false
  form.value = { name: '', target_amount: null, deadline: null }
  await loadGoals()
}

async function cancelGoal(id) {
  if (!confirm(t('savings.confirmCancel'))) return;

  await fetch(`${API}/savings/${id}/cancel`, {
    method: 'PUT',
    headers: authHeader()
  });

  await loadGoals();
}


async function deleteGoal(id) {
  if (!confirm(t('savings.confirmDelete'))) return
  await fetch(`${API}/savings/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  })
  await loadGoals()
}

function progress(g) {
  if (!g.saved_amount || !g.target_amount) return 0
  return Math.min((g.saved_amount / g.target_amount) * 100, 100)
}

function formatDate(v) {
  if (!v) return '---'

  const d = new Date(v)
  if (isNaN(d.getTime())) return '---'

  return d.toLocaleDateString('pl-PL', {
    timeZone: 'Europe/Warsaw'
  })
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


onMounted(loadGoals)
</script>
