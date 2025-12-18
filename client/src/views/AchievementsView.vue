<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-200 via-sky-200 to-indigo-300 p-4 md:p-6">
    <div class="max-w-6xl mx-auto bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900">
          🏆 Osiągnięcia
        </h1>
      </div>

      <div v-if="loading" class="text-gray-600">Ładowanie…</div>

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="a in all"
          :key="a.id"
          class="rounded-xl p-5 border shadow-sm"
          :class="unlockedIds.has(a.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-black/10 opacity-70'"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ a.name }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">{{ a.description }}</p>
            </div>
            <i
              class="pi"
              :class="unlockedIds.has(a.id) ? 'pi-check-circle text-emerald-500' : 'pi-lock text-gray-400'"
            ></i>
          </div>

          <div class="mt-4">
            <Tag
              :severity="unlockedIds.has(a.id) ? 'success' : 'secondary'"
              :value="unlockedIds.has(a.id) ? 'Odblokowane' : 'Zablokowane'"
            />
          </div>

          <div v-if="unlockedMap.get(a.id)?.date_awarded" class="mt-2 text-xs text-gray-500">
            Zdobyto: {{ new Date(unlockedMap.get(a.id).date_awarded).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Tag from 'primevue/tag'

defineOptions({ components: { Tag } })

const API = 'http://localhost:5000/api'
const loading = ref(true)
const all = ref([])
const mine = ref([])


const unlockedIds = ref(new Set())
const unlockedMap = ref(new Map())



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
