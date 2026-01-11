import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import MainLayout from '../layouts/MainLayout.vue' // ⬅️ to jest Twój layout z sidebar’em

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/register', name: 'register', component: RegisterView },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/forgot-password', name: 'forgot', component: () => import('../views/ForgotPasswordView.vue') },
  { path: '/reset-password', name: 'reset', component: () => import('../views/ResetPasswordView.vue') },

  {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'budgets', component: () => import('../views/BudgetsView.vue') },
        { path: 'expenses', component: () => import('../views/ExpensesView.vue') },
        { path: 'savings', component: () => import('../views/SavingsView.vue')},
        { path: '/savings/:id',  name: 'SavingDetails', component: () => import('../views/SavingsDetailsView.vue')},
        { path: 'stats', component: () => import('../views/StatsView.vue') },
        { path: 'achievements', component: () => import('../views/AchievementsView.vue') },
        { path: 'settings', component: () => import('../views/SettingsView.vue') }
      ]
    }

  // (opcjonalnie) 404
  //{ path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// (opcjonalnie) prosty guard – odkomentuj, jeśli chcesz pilnować logowania
// router.beforeEach((to, from, next) => {
//   const publicPages = ['/login', '/register', '/forgot-password', '/reset-password']
//   const token = localStorage.getItem('token')
//   if (!publicPages.includes(to.path) && !token) next('/login')
//   else next()
// })

export default router
