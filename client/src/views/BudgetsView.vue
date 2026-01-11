<template>
  <div class="view-wrapper space-y-6">

    <!-- HEADER -->
    <div class="app-card p-6 flex justify-between items-center">
      <h1 class="text-3xl font-bold">
        💰 {{ t('budgets.title') }}
      </h1>

      <Button
        :label="'➕ ' + t('budgets.new')"
        class="p-button-success"
        @click="showDialog = true"
      />
    </div>

    <!-- TABLE -->
    <div class="app-card p-6">
      <DataTable
        :value="budgets"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="name" :header="t('budgets.columns.name')" />
        <Column field="month" :header="t('budgets.columns.month')" />
        <Column field="planned_income" :header="t('budgets.columns.plannedIncome')" >
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.planned_income) }}
          </template>
        </Column>
        <Column field="planned_expenses" :header="t('budgets.columns.plannedExpenses')" >
        <template #body="slotProps">
            {{ formatCurrency(slotProps.data.planned_expenses) }}
          </template>
        </Column>
        <Column field="actual_income" :header="t('budgets.columns.actualIncome')" >
        <template #body="slotProps">
            {{ formatCurrency(slotProps.data.actual_income) }}
          </template>
        </Column>
        <Column field="actual_expenses" :header="t('budgets.columns.actualExpenses')" >
        <template #body="slotProps">
            {{ formatCurrency(slotProps.data.actual_expenses) }}
          </template>
        </Column>

        <Column :header="t('budgets.columns.actions')">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button
                icon="pi pi-plus-circle"
                class="p-button-rounded p-button-success p-button-sm"
                @click="openIncomeDialog(slotProps.data.id)"
                v-tooltip="t('budgets.actions.addIncome')"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-sm"
                @click="deleteBudget(slotProps.data.id)"
                v-tooltip="t('budgets.actions.delete')"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- DIALOG: NOWY BUDŻET -->
    <Dialog
      v-model:visible="showDialog"
      :header="t('budgets.dialogs.new')"
      modal
      class="w-[90vw] md:w-[30rem]"
    >
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('budgets.form.name') }}
          </label>
          <InputText v-model="form.name" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('budgets.form.month') }}
          </label>
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
          <label class="block text-sm font-medium mb-1">
            {{ t('budgets.form.plannedIncome') }}
          </label>
          <InputNumber
            v-model="form.planned_income"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            :min="0"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('budgets.form.plannedExpenses') }}
          </label>
          <InputNumber
            v-model="form.planned_expenses"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            :min="0"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <Button
            :label="t('budgets.dialogs.cancel')"
            class="p-button-text"
            @click="showDialog = false"
          />
          <Button
            :label="t('budgets.dialogs.save')"
            class="p-button-success"
            @click="addBudget"
          />
        </div>
      </div>
    </Dialog>

    <!-- DIALOG: DODANIE PRZYCHODU -->
    <Dialog
      v-model:visible="showIncomeDialog"
      :header="t('budgets.dialogs.addIncome')"
      modal
      class="w-[90vw] md:w-[25rem]"
    >
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('budgets.form.plannedIncome') }}
          </label>
          <InputNumber
            v-model="incomeForm.amount"
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            :min="1"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <Button
            :label="t('budgets.dialogs.cancel')"
            class="p-button-text"
            @click="showIncomeDialog = false"
          />
          <Button
            :label="t('budgets.dialogs.save')"
            class="p-button-success"
            @click="addIncome"
          />
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
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const API = 'http://localhost:5000/api'

const budgets = ref([])
const showDialog = ref(false)
const showIncomeDialog = ref(false)
const toast = useToast()
const { t } = useI18n()
const settings = useSettingsStore()

const form = ref({
  name: '',
  month: '',
  planned_income: null,
  planned_expenses: null
})

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
  if (!amount || amount <= 0) return alert('Podaj poprawną kwotę przychodu.')

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
  if (!form.value.name) return alert(t('budgets.validation.name'))
  if (!form.value.month) return alert(t('budgets.validation.month'))
  if (!form.value.planned_income || form.value.planned_income <= 0)
    return alert(t('budgets.validation.plannedIncome'))
  if (!form.value.planned_expenses || form.value.planned_expenses < 0)
    return alert(t('budgets.validation.plannedExpenses'))

  const payload = {
    ...form.value,
    month: form.value.month.toISOString().slice(0, 7),
    planned_income: Number(form.value.planned_income),
    planned_expenses: Number(form.value.planned_expenses)
  }

  const res = await fetch(`${API}/budgets`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return alert(err.error || 'Nie udało się dodać budżetu.')
  }

  const data = await res.json()

  if (data.achievementUnlocked) {
    toast.add({
      severity: 'success',
      summary: t('budgets.achievement.unlocked'),
      detail: data.achievementName,
      life: 4000
    })
  }

  showDialog.value = false
  form.value = { name: '', month: '', planned_income: null, planned_expenses: null }
  await loadBudgets()
}

async function deleteBudget(id) {
  await fetch(`${API}/budgets/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  })
  await loadBudgets()
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


onMounted(loadBudgets)
</script>
