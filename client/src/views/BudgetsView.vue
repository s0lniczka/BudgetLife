<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-6">
    <div class="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">💰 Twoje budżety</h1>
        <Button label="➕ Nowy budżet" class="p-button-success" @click="showDialog = true" />
      </div>

      <DataTable :value="budgets" stripedRows responsiveLayout="scroll">
        <Column field="month" header="Miesiąc" />
        <Column field="planned_income" header="Planowany przychód" />
        <Column field="planned_expenses" header="Planowane wydatki" />
        <Column field="actual_income" header="Rzeczywisty przychód" />
        <Column field="actual_expenses" header="Rzeczywiste wydatki" />
        <Column header="Akcje">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                icon="pi pi-plus-circle"
                class="p-button-rounded p-button-success p-button-sm"
                @click="openIncomeDialog(slotProps.data.id)"
                v-tooltip="'Dodaj przychód'"
              />
              <Button
               icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-sm"
               @click="deleteBudget(slotProps.data.id)"
               v-tooltip="'Usuń budżet'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- dodanie budzetu -->
    <Dialog v-model:visible="showDialog" header="Nowy budżet" modal class="w-[90vw] md:w-[30rem]">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Miesiąc budżetu</label>
          <Calendar
            v-model="form.month"
            view="month"
            dateFormat="yy-mm"
            showIcon
            class="w-full"
            :manualInput="false"
            />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Planowany przychód</label>
          <InputNumber v-model="form.planned_income" mode="currency" currency="PLN" locale="pl-PL" :min="0" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Planowane wydatki</label>
          <InputNumber v-model="form.planned_expenses" mode="currency" currency="PLN" locale="pl-PL" :min="0" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <Button label="Anuluj" class="p-button-text" @click="showDialog = false" />
          <Button label="Zapisz" class="p-button-success" @click="addBudget" />
        </div>
      </div>
    </Dialog>
    <!-- Ddodanie przychodu  -->
    <Dialog v-model:visible="showIncomeDialog" header="Dodaj przychód" modal class="w-[90vw] md:w-[25rem]">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kwota przychodu</label>
          <InputNumber v-model="incomeForm.amount" mode="currency" currency="PLN" locale="pl-PL" :min="1" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <Button label="Anuluj" class="p-button-text" @click="showIncomeDialog = false" />
          <Button label="Zapisz" class="p-button-success" @click="addIncome" />
        </div>
      </div>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'

const API = 'http://localhost:5000/api'
const budgets = ref([])
const showDialog = ref(false)
const form = ref({ month: '', planned_income: null, planned_expenses: null })
const showIncomeDialog = ref(false)
const incomeForm = ref({ id: null, amount: null })

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function loadBudgets() {
  const res = await fetch(`${API}/budgets`, { headers: authHeader() })
  budgets.value = await res.json()
}
function openIncomeDialog(budgetId) {
  incomeForm.value = { id: budgetId, amount: null }
  showIncomeDialog.value = true
}

async function addIncome() {
  const { id, amount } = incomeForm.value

  if (!amount || amount <= 0) {
    return alert('Podaj poprawną kwotę przychodu.')
  }

  const res = await fetch(`${API}/budgets/${id}/income`, {
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return alert(err.error || 'Nie udało się dodać przychodu.')
  }

  showIncomeDialog.value = false
  await loadBudgets()
}

async function addBudget() {
  // 🔒 Walidacja
  if (!form.value.month)
    return alert('Wybierz miesiąc budżetu.')
  if (!form.value.planned_income || form.value.planned_income <= 0)
    return alert('Podaj poprawny planowany przychód (większy od 0).')
  if (!form.value.planned_expenses || form.value.planned_expenses < 0)
    return alert('Podaj planowane wydatki (nie mogą być ujemne).')

  // 🧹 Przygotowanie danych
  const payload = {
    ...form.value,
    month: form.value.month.toISOString().slice(0, 7),
    planned_income: Number(form.value.planned_income),
    planned_expenses: Number(form.value.planned_expenses)
  }

  // 💾 Wysyłka
  const res = await fetch(`${API}/budgets`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return alert(err.error || 'Nie udało się dodać budżetu.')
  }

  // ✅ Reset i odświeżenie
  showDialog.value = false
  form.value = { month: '', planned_income: null, planned_expenses: null }
  await loadBudgets()
}

async function deleteBudget(id) {
  await fetch(`${API}/budgets/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  })
  await loadBudgets()
}

onMounted(loadBudgets)
</script>
