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
          {{ t('reset.title') }}
        </h1>
        <p class="text-sm text-[var(--text-main)]/60 mt-1">
          {{ t('reset.subtitle') }}
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- New password -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('reset.password') }}
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
            {{ t('reset.password2') }}
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
          :label="t('reset.submit')"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition"
          @click="resetPass"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Password from 'primevue/password'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

import ThemeToggle from '@/components/ThemeToggle.vue'

defineOptions({
  components: {
    Password,
    Button,
    InlineMessage
  }
})

const { t } = useI18n()
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
  error.value = ''
  ok.value = ''

  if (!password.value || !password2.value) {
    error.value = t('reset.validation.required')
    return
  }
  if (password.value !== password2.value) {
    error.value = t('reset.validation.mismatch')
    return
  }
  if (password.value.length < 6) {
    error.value = t('reset.validation.minLength')
    return
  }
  if (!token) {
    error.value = t('reset.validation.noToken')
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        newPassword: password.value
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      error.value = data?.error || t('reset.error')
      return
    }

    ok.value = t('reset.success')
    setTimeout(() => router.push('/login'), 2000)
  } catch {
    error.value = t('reset.error')
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
