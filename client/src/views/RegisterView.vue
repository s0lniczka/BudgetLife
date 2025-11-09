<!-- src/views/RegisterView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8">
      <!-- Nagłówek -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Utwórz konto</h1>
        <p class="text-sm text-gray-500 mt-1">Dołącz do <span class="text-emerald-600 font-semibold">BudgetLife</span> i zacznij zarządzać swoimi finansami!</p>
      </div>

      <!-- Formularz -->
      <div class="space-y-4">
        <!-- Nazwa użytkownika -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">Nazwa użytkownika</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-user" />
            <InputText
              v-model="username"
              type="text"
              placeholder="Twoja nazwa"
              class="w-full"
            />
          </span>
        </div>

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

        <!-- Powtórz hasło -->
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

        <!-- Komunikaty -->
        <InlineMessage v-if="error" severity="error" class="w-full">{{ error }}</InlineMessage>
        <InlineMessage v-if="ok" severity="success" class="w-full">{{ ok }}</InlineMessage>

        <!-- Przycisk -->
        <Button
          label="Zarejestruj się"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition-all duration-300"
          @click="register"
        />

        <!-- Linki -->
        <div class="text-center text-sm text-gray-600 mt-3 space-y-1">
          <RouterLink to="/login" class="hover:text-emerald-600 block">
            Masz już konto? Zaloguj się
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// PrimeVue komponenty
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

// rejestracja komponentów lokalnie
defineOptions({ components: { InputText, Password, Button, InlineMessage } })

const username=ref('')
const email = ref('')
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref('')

// 👉 dopasuj URL, jeśli masz inny port
const API = 'http://localhost:5000/api'

const register = async () => {
  error.value = ''
  ok.value = ''

  // prosta walidacja po stronie klienta
  if (!username.value || !email.value || !password.value) {
    error.value = 'Podaj nazwę użytkownika, e-mail i hasło.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Hasło musi mieć co najmniej 6 znaków.'
    return
  }
  if (password.value !== password2.value) {
    error.value = 'Hasła różnią się.'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
    })

    const data = await res.json()

    if (!res.ok) {
      // backend może zwracać {error: "..."} lub {errors:[...]}
      error.value = data?.error || data?.errors?.[0]?.msg || 'Rejestracja nie powiodła się.'
      return
    }

    // jeśli Twój backend zwraca token od razu, możesz go zapisać:
    if (data?.token) localStorage.setItem('token', data.token)

    ok.value = `Konto ${username.value} utworzone! Sprawdź e-mail (jeśli wymagane) lub przejdź do logowania.`
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