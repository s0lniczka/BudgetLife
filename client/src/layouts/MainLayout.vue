<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 flex">
    <!-- SIDEBAR -->
    <aside class="w-64 bg-white/70 backdrop-blur-lg shadow-xl flex flex-col p-4">
      <div class="font-bold text-xl text-gray-800 mt-2 mb-4">BudgetLife</div>

      <!-- Menu -->
      <nav class="flex-1 space-y-1">
        <RouterLink to="/dashboard" class="menu-link">
          <i class="pi pi-home mr-3"></i> Dashboard
        </RouterLink>

        <RouterLink to="/budgets" class="menu-link">
          <i class="pi pi-wallet mr-3"></i> Budżety
        </RouterLink>

        <RouterLink to="/expenses" class="menu-link">
          <i class="pi pi-list mr-3"></i> Wydatki
        </RouterLink>

        <RouterLink to="/savings" class="menu-link">
          <i class="pi pi-money-bill mr-3"></i> Oszczędności
        </RouterLink>


        <RouterLink to="/stats" class="menu-link">
          <i class="pi pi-chart-line mr-3"></i> Statystyki
        </RouterLink>

        <RouterLink to="/achievements" class="menu-link">
          <i class="pi pi-trophy mr-3"></i> Osiągnięcia
        </RouterLink>

        <RouterLink to="/settings" class="menu-link">
          <i class="pi pi-cog mr-3"></i> Ustawienia
        </RouterLink>
      </nav>

      <Button label="Wyloguj" icon="pi pi-sign-out" class="p-button-danger mt-auto" @click="logout" />
    </aside>

    <!-- GŁÓWNA ZAWARTOŚĆ -->
    <main class="flex-1 p-6 overflow-y-auto">

      <div class="max-w-[1700px] mx-auto min-h-[calc(100vh-4rem)]">


        <router-view />
      </div>
</main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

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
  color: #374151;
  font-weight: 500;
  transition: background 0.2s;
}
.menu-link:hover {
  background: #d1fae5;
}
.router-link-active {
  background: #a7f3d0;
  font-weight: 600;
}
</style>
