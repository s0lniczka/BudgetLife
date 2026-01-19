<template>
  <div class="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)]">
    

    
    <aside
      class="fixed xl:relative z-30
         inset-y-0 left-0
         w-64
         bg-[var(--bg-card)]
         border-r border-black/5 dark:border-white/10
         flex flex-col p-4
         transform transition-transform duration-300
         xl:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      
      <h1 class="text-xl font-bold text-[var(--brand-color)] mb-6">
        BudgetLife
      </h1>
      

      
      <nav class="flex-1 space-y-1">
        <RouterLink to="/dashboard" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-home mr-3"></i> {{ t('menu.dashboard') }}
        </RouterLink>

        <RouterLink to="/budgets" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-wallet mr-3"></i> {{ t('menu.budgets') }}
        </RouterLink>

        <RouterLink to="/expenses" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-list mr-3"></i> {{ t('menu.expenses') }}
        </RouterLink>

        <RouterLink to="/savings" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-money-bill mr-3"></i> {{ t('menu.savings') }}
        </RouterLink>

        <RouterLink to="/stats" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-chart-line mr-3"></i> {{ t('menu.stats') }}
        </RouterLink>

        <RouterLink to="/achievements" class="menu-link" @click="sidebarOpen = false">
          <i class="pi pi-trophy mr-3"></i> {{ t('menu.achievements') }}
        </RouterLink>

        <RouterLink to="/settings" class="menu-link" @click="sidebarOpen = false"> 
          <i class="pi pi-cog mr-3"></i> {{ t('menu.settings') }}
        </RouterLink>
      </nav>

      
      <div class="space-y-3 mt-4">
        
        <Button
          type="button"
          @click="settings.toggleTheme"
          class="w-full flex justify-center"
        >
          <span v-if="settings.theme === 'dark'">🌙 Dark mode</span>
          <span v-else>☀️ Light mode</span>
        </Button>

        
        <Button
          label="Wyloguj"
          icon="pi pi-sign-out"
          class="p-button-danger w-full"
          @click="logout"
        />
      </div>
    </aside>
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-20 xl:hidden"
      @click="sidebarOpen = false"
    />

    
    <main class="flex-1 overflow-y-auto">

  
  <div
    class="xl:hidden sticky top-0 z-10
           bg-[var(--bg-main)]
           border-b border-black/5 dark:border-white/10
           px-3 py-2 flex items-center gap-3"
  >
    <button
      class="p-2 rounded-md border border-black/10 dark:border-white/20"
      @click="sidebarOpen = true"
    >
      ☰
    </button>

    <span class="font-semibold text-sm">
      BudgetLife
    </span>
  </div>

  <!-- CONTENT -->
  <div class="p-3 sm:p-4 lg:p-6">
    <router-view />
  </div>

</main>

  </div>
</template>


<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const settings = useSettingsStore()
const { t } = useI18n()
const sidebarOpen = ref(false)

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
