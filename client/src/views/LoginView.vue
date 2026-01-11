<template>
  <div
    class="min-h-screen flex items-center justify-center
           bg-[var(--bg-main)] text-[var(--text-main)]"
  >
    <div
      class="relative w-full max-w-md
             bg-[var(--bg-card)]
             backdrop-blur-lg
             shadow-xl rounded-2xl p-8"
    >
      <!-- THEME TOGGLE -->
      <div class="absolute top-3 right-3">
        <ThemeToggle />
      </div>

      <!-- Logo / Nagłówek -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">
          Budget<span class="text-emerald-500">Life</span>
        </h1>
        <p class="text-sm text-[var(--text-main)]/60 mt-1">
          {{ t('login.subtitle') }}
        </p>
      </div>

      <!-- Formularz -->
      <div class="space-y-4">
        <!-- Email -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('login.email') }}
          </label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-envelope" />
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('login.emailPlaceholder')"
              class="w-full"
            />
          </span>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('login.password') }}
          </label>
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

        <!-- Messages -->
        <InlineMessage
          v-if="error"
          severity="error"
          class="w-full"
        >
          {{ error }}
        </InlineMessage>

        <InlineMessage
          v-if="ok"
          severity="success"
          class="w-full"
        >
          {{ ok }}
        </InlineMessage>

        <!-- Submit -->
        <Button
          :label="t('login.submit')"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition"
          @click="login"
        />

        <!-- Links -->
        <div class="text-center text-sm text-[var(--text-main)]/60 mt-3 space-y-1">
          <RouterLink
            to="/forgot-password"
            class="hover:text-emerald-500 block"
          >
            {{ t('login.forgot') }}
          </RouterLink>
          <RouterLink
            to="/register"
            class="hover:text-emerald-500 block"
          >
            {{ t('login.register') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

import ThemeToggle from '@/components/ThemeToggle.vue'

defineOptions({
  components: {
    InputText,
    Password,
    Button,
    InlineMessage
  }
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref('')

const { t } = useI18n()
const router = useRouter()
const API = 'http://localhost:5000/api'

const login = async () => {
  error.value = ''
  ok.value = ''

  if (!email.value || !password.value) {
    error.value = t('login.validation.required')
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data?.error || t('login.validation.invalid')
      return
    }

    localStorage.setItem('token', data.token)
    ok.value = t('login.success', { username: data.user.username })

    setTimeout(() => router.push('/dashboard'), 1200)
  } catch {
    error.value = 'Błąd połączenia z API.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.p-input-icon-left > i {
  color: currentColor;
  opacity: 0.6;
}
</style>
