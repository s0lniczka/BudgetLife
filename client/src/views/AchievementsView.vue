<template>
  <div class="view-wrapper space-y-6">

    <!-- HEADER -->
    <div class="app-card p-6">
      <h1 class="text-2xl md:text-3xl font-extrabold">
        🏆 {{ t('achievements.title') }}
      </h1>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="app-card p-6 opacity-70">
      {{ t('achievements.loading') }}
    </div>

    <!-- ACHIEVEMENTS GRID -->
    <div
      v-else
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="a in all"
        :key="a.id"
        class="app-card p-5 transition"
        :class="unlockedIds.has(a.id)
          ? 'ring-2 ring-emerald-400/40'
          : 'opacity-70'"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-lg">
              {{ a.name }}
            </h3>
            <p class="text-sm opacity-70 mt-1">
              {{ a.description }}
            </p>
          </div>

          <i
            class="pi text-xl"
            :class="unlockedIds.has(a.id)
              ? 'pi-check-circle text-emerald-500'
              : 'pi-lock opacity-50'"
          />
        </div>

        <div class="mt-4">
          <Tag
            :severity="unlockedIds.has(a.id) ? 'success' : 'secondary'"
            :value="
              unlockedIds.has(a.id)
                ? t('achievements.status.unlocked')
                : t('achievements.status.locked')
            "
          />
        </div>

        <div
          v-if="unlockedMap.get(a.id)?.date_awarded"
          class="mt-2 text-xs opacity-60"
        >
          {{ t('achievements.earnedAt') }}:
          {{
            new Date(
              unlockedMap.get(a.id).date_awarded
            ).toLocaleString()
          }}
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Tag from 'primevue/tag'
import { useI18n } from 'vue-i18n'

defineOptions({ components: { Tag } })

const API = 'http://localhost:5000/api'
const loading = ref(true)
const all = ref([])
const mine = ref([])
const unlockedIds = ref(new Set())
const unlockedMap = ref(new Map())
const { t } = useI18n()

onMounted(async () => {
  loading.value = true

  try {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const [allRes, mineRes] = await Promise.all([
      fetch(`${API}/achievements`, { headers }),
      fetch(`${API}/achievements/mine`, { headers })
    ])

    if (!allRes.ok) {
      console.error('Achievements error:', await allRes.text())
      all.value = []
      mine.value = []
      return
    }

    if (!mineRes.ok) {
      console.error('My achievements error:', await mineRes.text())
      all.value = await allRes.json()
      mine.value = []
      return
    }

    all.value = await allRes.json()
    mine.value = await mineRes.json()

    unlockedIds.value = new Set(mine.value.map(x => x.id))
    unlockedMap.value = new Map(mine.value.map(x => [x.id, x]))

  } catch (err) {
    console.error('Achievements fetch crashed:', err)
    all.value = []
    mine.value = []
  } finally {
    loading.value = false
  }
})
</script>
