<!-- src/views/LoginView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <!-- Logo / Nagłówek -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Budget<span class="text-emerald-600">Life</span></h1>
        <p class="text-sm text-gray-500 mt-1">Witaj ponownie w swoim budżecie!</p>
      </div>

      <!-- Formularz logowania -->
      <div class="space-y-4">
        <!-- E-mail -->
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

        <!-- Hasło -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">Hasło</label>
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

        <!-- Komunikaty -->
        <InlineMessage v-if="error" severity="error" class="w-full">{{ error }}</InlineMessage>
        <InlineMessage v-if="ok" severity="success" class="w-full">{{ ok }}</InlineMessage>

        <!-- Przycisk logowania -->
        <Button
          label="Zaloguj się"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition-all duration-300"
          @click="login"
        />

        <!-- Linki -->
        <div class="text-center text-sm text-gray-600 mt-3 space-y-1">
          <RouterLink to="/forgot-password" class="hover:text-emerald-600 block">
            Nie pamiętasz hasła?
          </RouterLink>
          <RouterLink to="/register" class="hover:text-emerald-600 block">
            Nie masz konta? Zarejestruj się
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// PrimeVue komponenty
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

defineOptions({ components: { InputText, Password, Button, InlineMessage } })

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref('')

const router = useRouter()
const API = 'http://localhost:5000/api'

const login = async () => {
  error.value = ''
  ok.value = ''

  if (!email.value || !password.value) {
    error.value = 'Podaj e-mail i hasło.'
    return 
  }

  loading.value = true
  try {

    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data?.error || 'Nieprawidłowy e-mail lub hasło.'
      return
    }

    // jeśli logowanie się udało — zapisz token
    localStorage.setItem('token', data.token)
    ok.value = `Zalogowano jako ${data.user.username}.`

    // przekierowanie (np. na dashboard)
    setTimeout(() => router.push('/dashboard'), 1500)
  } catch (e) {
    error.value = 'Błąd połączenia z API.'
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.p-input-icon-left > i {
  color: #6b7280; /* szary */
}
</style>