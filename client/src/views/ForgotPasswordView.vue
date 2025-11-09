<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Resetuj hasło</h1>
        <p class="text-sm text-gray-500 mt-1">Podaj swój e-mail, aby otrzymać link do zmiany hasła.</p>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">E-mail</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-envelope" />
            <InputText
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full"
            />
          </span>
        </div>

        <InlineMessage v-if="error" severity="error" class="w-full">{{ error }}</InlineMessage>
        <InlineMessage v-if="ok" severity="success" class="w-full">{{ ok }}</InlineMessage>

        <Button
          label="Wyślij link resetujący"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition-all duration-300"
          @click="sendLink"
        />

        <div class="text-center text-sm text-gray-600 mt-3 space-y-1">
          <RouterLink to="/login" class="hover:text-emerald-600 block">
            Wróć do logowania
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

defineOptions({ components: { InputText, Button, InlineMessage } })

const email = ref('')
const error = ref('')
const ok = ref('')
const loading = ref(false)
const API = 'http://localhost:5000/api'

const sendLink = async () => {
  error.value = ''
  ok.value = ''
  if (!email.value) return (error.value = 'Podaj adres e-mail.')

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    ok.value = data.ok
  } catch (e) {
    error.value = e.message || 'Błąd połączenia z API.'
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.p-input-icon-left > i {
  color: #6b7280;
}
</style>
