<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-100">Panel IA & Modelos</h1>
      <p class="text-sm text-slate-500 mt-0.5">Monitoreo y configuración de modelos de inteligencia artificial</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Modelos activos" value="—" icon="🤖" color="teal" />
      <StatCard label="Inferencias hoy" value="—" icon="⚡" color="cyan" />
      <StatCard label="Precisión media" value="—%" icon="🎯" color="emerald" />
      <StatCard label="Alertas" value="0" icon="⚠️" color="amber" />
    </div>
    <div class="card">
      <h2 class="card-title mb-4">Estado de modelos</h2>
      <div class="space-y-3">
        <div v-for="m in models" :key="m.name" class="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
          <span class="text-xl">{{ m.icon }}</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-200">{{ m.name }}</p>
            <p class="text-xs text-slate-500">{{ m.desc }}</p>
          </div>
          <span class="badge" :class="m.status === 'activo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/20 text-slate-400'">
            {{ m.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import StatCard from '@/components/common/StatCard.vue'
const models = [
  { name: 'Clasificador de contenido', desc: 'NLP — Análisis de texto educativo', status: 'activo', icon: '📝' },
  { name: 'Recomendador de cursos', desc: 'Filtrado colaborativo', status: 'activo', icon: '🎯' },
  { name: 'Detector de plagio', desc: 'Similitud semántica', status: 'inactivo', icon: '🔍' },
]
</script>
