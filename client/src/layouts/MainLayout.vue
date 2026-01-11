<template>
  <div class="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)]">
    <!-- SIDEBAR -->
    <aside
      class="relative z-20
             w-64
             bg-[var(--bg-card)]
             border-r border-black/5 dark:border-white/10
             flex flex-col p-4"
    >
      <!-- LOGO -->
      <h1 class="text-xl font-bold text-[var(--brand-color)] mb-6">
        BudgetLife
      </h1>

      <!-- MENU -->
      <nav class="flex-1 space-y-1">
        <RouterLink to="/dashboard" class="menu-link">
          <i class="pi pi-home mr-3"></i> {{ t('menu.dashboard') }}
        </RouterLink>

        <RouterLink to="/budgets" class="menu-link">
          <i class="pi pi-wallet mr-3"></i> {{ t('menu.budgets') }}
        </RouterLink>

        <RouterLink to="/expenses" class="menu-link">
          <i class="pi pi-list mr-3"></i> {{ t('menu.expenses') }}
        </RouterLink>

        <RouterLink to="/savings" class="menu-link">
          <i class="pi pi-money-bill mr-3"></i> {{ t('menu.savings') }}
        </RouterLink>

        <RouterLink to="/stats" class="menu-link">
          <i class="pi pi-chart-line mr-3"></i> {{ t('menu.stats') }}
        </RouterLink>

        <RouterLink to="/achievements" class="menu-link">
          <i class="pi pi-trophy mr-3"></i> {{ t('menu.achievements') }}
        </RouterLink>

        <RouterLink to="/settings" class="menu-link">
          <i class="pi pi-cog mr-3"></i> {{ t('menu.settings') }}
        </RouterLink>
      </nav>

      <!-- FOOTER -->
      <div class="space-y-3 mt-4">
        <!-- THEME TOGGLE -->
        <Button
          type="button"
          @click="settings.toggleTheme"
          class="w-full flex justify-center"
        >
          <span v-if="settings.theme === 'dark'">🌙 Dark mode</span>
          <span v-else>☀️ Light mode</span>
        </Button>

        <!-- LOGOUT -->
        <Button
          label="Wyloguj"
          icon="pi pi-sign-out"
          class="p-button-danger w-full"
          @click="logout"
        />
      </div>
    </aside>

    <!-- CONTENT -->
    <main class="flex-1 p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>


<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'

const settings = useSettingsStore()
const { t } = useI18n()

const router = useRouter()
const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.menu-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  color: var(--nav-link);
  font-weight: 500;
  transition: background 0.2s;
}
.menu-link:hover {
  background: var(--nav-hover);
}
.router-link-active {
  background: var(--nav-active);
  font-weight: 600;
}
</style>
