<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Ustaw nowe hasło</h1>
        <p class="text-sm text-gray-500 mt-1">Wprowadź nowe hasło, aby odzyskać dostęp do konta.</p>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">Nowe hasło</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-lock" />
            <Password
              v-model="password"
              :feedback="false"
              toggleMask
              input-class="w-full"
              class="w-full"
            />
          </span>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">Powtórz hasło</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-lock" />
            <Password
              v-model="password2"
              :feedback="false"
              toggleMask
              input-class="w-full"
              class="w-full"
            />
          </span>
        </div>

        <InlineMessage v-if="error" severity="error" class="w-full">{{ error }}</InlineMessage>
        <InlineMessage v-if="ok" severity="success" class="w-full">{{ ok }}</InlineMessage>

        <Button
          label="Zmień hasło"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition-all duration-300"
          @click="resetPass"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Password from 'primevue/password'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

defineOptions({ components: { Password, Button, InlineMessage } })

const route = useRoute()
const router = useRouter()
const token = route.query.token || ''
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref('')
const API = 'http://localhost:5000/api'

const resetPass = async () => {
  if (!password.value || !password2.value) return (error.value = 'Uzupełnij oba pola.')
  if (password.value !== password2.value) return (error.value = 'Hasła różnią się.')
  if (password.value.length < 6) return (error.value= 'Hasło musi miec co najmniej 6 znaków')
  if (!token) return (error.value = 'Brak tokenu resetującego.')

  loading.value = true
  error.value = ''
  ok.value = ''

  try {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    ok.value = data.ok
    setTimeout(() => router.push('/login'), 2000)
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