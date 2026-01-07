<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-6">
    <div class="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">🧾 {{ t('expenses.title') }}</h1>
        <div class="flex gap-3">
          <Button :label="'➕' + t('expenses.add')" class="p-button-success" @click="showDialog = true" />
          <Button :label="'📊' + t('expenses.exportExcel')" class="p-button-outlined" @click="exportXLS"/>
          <Button :label="'📊' + t('expenses.add')" class="p-button-outlined" @click="exportPDF"/>
        </div>  
      </div>

      <DataTable :value="expenses" stripedRows responsiveLayout="scroll">
        <Column field="budget_name" :header="t('expenses.columns.budget')" />
        <Column field="category" :header="t('expenses.columns.category')" />
        <Column field="amount" :header="t('expenses.columns.amount')" />
        <Column field="description" :header="t('expenses.columns.description')" />
        <Column field="date" :header="t('expenses.columns.date')" />
        <Column :header="t('expenses.columns.actions')">
          <template #body="slotProps">
            <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger p-button-sm"
              @click="deleteExpense(slotProps.data.id)"
              v-tooltip="t('expenses.actions.delete')"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- DIALOG DODAWANIA WYDATKU -->
    <Dialog v-model:visible="showDialog" :header="t('expenses.dialog.title')" modal class="w-[90vw] md:w-[30rem]">
      <div class="flex flex-col gap-3">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('expenses.form.budget') }}</label>
          <Dropdown
            v-model="form.budget_id"
            :options="budgets"
            optionLabel="name"
            optionValue="id"
            class="w-full"
            :placeholder="t('expenses.form.selectBudget')"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('expenses.form.category') }}</label>
          <InputText v-model="form.category" class="w-full" :placeholder=" t('expenses.form.categoryPlaceholder') " />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('expenses.form.amount') }}</label>
          <InputNumber v-model="form.amount" mode="currency" currency="PLN" locale="pl-PL" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('expenses.form.description') }}</label>
          <InputText v-model="form.description" class="w-full" :placeholder="t('expenses.form.descriptionPlaceholder')" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('expenses.form.date') }}</label>
          <Calendar v-model="form.date" showIcon dateFormat="yy-mm-dd" class="w-full" />
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <Button :label=" t('common.cancel')" class="p-button-text" @click="showDialog = false" />
          <Button :label="t('common.save')" class="p-button-success" @click="addExpense" />
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
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

const API = 'http://localhost:5000/api'

const expenses = ref([])
const budgets = ref([])
const showDialog = ref(false)
const toast = useToast()
const { t } = useI18n()

const form = ref({
  budget_id: null,
  category: '',
  amount: null,
  description: '',
  date: ''
})

function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function exportXLS() {
  try {
    const res = await fetch(`${API}/expenses/export/xls`, {
      headers: authHeader()
    })

    if (!res.ok) throw new Error('Błąd eksportu')

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'wydatki.xlsx'
    document.body.appendChild(a)
    a.click()

    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    alert('Nie udało się wyeksportować danych')
  }
}
async function exportPDF() {
  try {
    const res = await fetch(`${API}/expenses/export/pdf`, {
      headers: authHeader()
    })

    if (!res.ok) throw new Error('Błąd eksportu PDF')

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'wydatki.pdf'
    document.body.appendChild(a)
    a.click()

    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    alert('Nie udało się wyeksportować PDF')
  }
}

async function loadExpenses() {
  try {
    const res = await fetch(`${API}/expenses`, { headers: authHeader() })
    if (!res.ok) throw new Error('Błąd podczas pobierania wydatków')
    expenses.value = await res.json()
  } catch (err) {
    console.error(err)
  }
}

async function loadBudgets() {
  try {
    const res = await fetch(`${API}/budgets`, { headers: authHeader() })
    if (!res.ok) throw new Error('Błąd podczas pobierania budżetów')
    const data = await res.json()
    budgets.value = data.map(b => ({ ...b, id: Number(b.id) }))
  } catch (err) {
    console.error(err)
  }
}


async function addExpense() {
  if (!form.value.budget_id)
    return alert('Wybierz budżet')
  if (!form.value.category)
    return alert('Wybierz lub wpisz kategorię')
  if (!form.value.amount || form.value.amount <= 0)
    return alert('Podaj poprawną kwotę')
  if (!form.value.date)
    return alert('Wybierz datę wydatku')

  const cleanAmount = Number(form.value.amount)
  const payload = {
    ...form.value,
    budget_id: Number(form.value.budget_id),
    amount: cleanAmount,
    date: new Date(form.value.date).toISOString()
  }

  const res = await fetch(`${API}/expenses`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return alert(err.error || 'Nie udało się dodać wydatku')
  }
  const data = await res.json()
  if (data.achievementUnlocked) {
  toast.add({
    severity: 'success',
    summary: t('expenses.achievement.unlocked'),
    detail: data.achievementName ?? t('expenses.achievement.default'),
    life: 4000
  })
}


  showDialog.value = false
  form.value = { budget_id: null, category: '', amount: null, description: '', date: '' }
  await loadExpenses()
  await checkForNewAchievements()
}

async function deleteExpense(id) {
  try {
    await fetch(`${API}/expenses/${id}`, {
      method: 'DELETE',
      headers: authHeader()
    })
    await loadExpenses()
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  await loadBudgets()
  await loadExpenses()
})
</script>
