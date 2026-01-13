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
      
      <div class="absolute top-3 right-3">
        <ThemeToggle />
      </div>

      
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">
          {{ t('forgot.title') }}
        </h1>
        <p class="text-sm text-[var(--text-main)]/60 mt-1">
          {{ t('forgot.subtitle') }}
        </p>
      </div>

      
      <div class="space-y-4">
        
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ t('forgot.email') }}
          </label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-envelope" />
            <InputText
              v-model="email"
              type="email"
              :placeholder="t('forgot.emailPlaceholder')"
              class="w-full"
            />
          </span>
        </div>

        
        <InlineMessage v-if="error" severity="error" class="w-full">
          {{ error }}
        </InlineMessage>

        <InlineMessage v-if="ok" severity="success" class="w-full">
          {{ ok }}
        </InlineMessage>

        
        <Button
          :label="t('forgot.send')"
          :loading="loading"
          class="w-full bg-emerald-500 border-none hover:bg-emerald-600 transition"
          @click="sendLink"
        />

        
        <div class="text-center text-sm text-[var(--text-main)]/60 mt-3">
          <RouterLink
            to="/login"
            class="hover:text-emerald-500"
          >
            {{ t('forgot.back') }}
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
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'

import ThemeToggle from '@/components/ThemeToggle.vue'

defineOptions({
  components: {
    InputText,
    Button,
    InlineMessage
  }
})

const email = ref('')
const error = ref('')
const ok = ref('')
const loading = ref(false)

const API = 'http://localhost:5000/api'
const { t } = useI18n()

const sendLink = async () => {
  error.value = ''
  ok.value = ''

  if (!email.value) {
    error.value = t('forgot.validation.email')
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data?.error || 'Request failed')
    }

    ok.value = data.ok || t('forgot.success')
  } catch (e) {
    error.value = e.message || t('forgot.error')
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
