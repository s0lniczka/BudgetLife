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

      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">
          {{ t('register.title') }}
        </h1>
        <p class="text-sm text-[var(--text-main)]/60 mt-1">
          {{ t('register.subtitlePrefix') }}
          <span class="text-emerald-500 font-semibold">BudgetLife</span>
          {{ t('register.subtitleSuffix') }}
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- Username -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('register.username') }}
          </label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-user" />
            <InputText
              v-model="username"
              :placeholder="t('register.usernamePlaceholder')"
              class="w-full"
            />
          </span>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('register.email') }}
          </label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-envelope" />
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('register.emailPlaceholder')"
              class="w-full"
            />
          </span>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('register.password') }}
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

        <!-- Repeat password -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('register.password2') }}
          </label>
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

        <!-- Messages -->
        <InlineMessage v-if="error" severity="error" class="w-full">
          {{ error }}
        </InlineMessage>

        <InlineMessage v-if="ok" severity="success" class="w-full">
          {{ ok }}
        </InlineMessage>

        <!-- Button -->
        <Button
          :label="t('register.submit')"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition"
          @click="register"
        />

        <!-- Links -->
        <div class="text-center text-sm text-[var(--text-main)]/60 mt-3">
          <RouterLink
            to="/login"
            class="hover:text-emerald-500"
          >
            {{ t('register.haveAccount') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

const { t } = useI18n()

const username = ref('')
const email = ref('')
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref('')

const API = 'http://localhost:5000/api'

const register = async () => {
  error.value = ''
  ok.value = ''

  if (!username.value || !email.value || !password.value) {
    error.value = t('register.validation.required')
    return
  }
  if (password.value.length < 6) {
    error.value = t('register.validation.passwordMin')
    return
  }
  if (password.value !== password2.value) {
    error.value = t('register.validation.passwordMismatch')
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      error.value =
        data?.error ||
        data?.errors?.[0]?.msg ||
        t('register.validation.failed')
      return
    }

    if (data?.token) {
      localStorage.setItem('token', data.token)
    }

    ok.value = t('register.success', { username: username.value })
  } catch {
    error.value = t('register.error')
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
