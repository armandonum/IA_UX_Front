<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-100">Panel de Ética</h1>
      <p class="text-sm text-slate-500 mt-0.5">Supervisión ética de la plataforma y sus modelos de IA</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Auditorías pendientes" value="—" icon="⚖️" color="amber" />
      <StatCard label="Alertas éticas" value="0" icon="🚨" color="red" />
      <StatCard label="Revisiones completadas" value="—" icon="✅" color="emerald" />
    </div>
    <div class="card">
      <h2 class="card-title mb-4">Principios éticos activos</h2>
      <div class="space-y-3">
        <div v-for="p in principles" :key="p.name" class="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
          <span class="text-xl mt-0.5">{{ p.icon }}</span>
          <div>
            <p class="text-sm font-semibold text-slate-200">{{ p.name }}</p>
            <p class="text-xs text-slate-500 mt-0.5">{{ p.desc }}</p>
          </div>
          <span class="badge ml-auto bg-emerald-500/20 text-emerald-300 shrink-0">Activo</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import StatCard from '@/components/common/StatCard.vue'
const principles = [
  { name: 'Transparencia algorítmica', desc: 'Los modelos deben ser explicables e interpretables', icon: '🔍' },
  { name: 'Equidad y no discriminación', desc: 'Auditoría regular de sesgos en datos y predicciones', icon: '⚖️' },
  { name: 'Privacidad por diseño', desc: 'Protección de datos desde el diseño del sistema', icon: '🔒' },
  { name: 'Responsabilidad humana', desc: 'Supervisión humana en decisiones críticas', icon: '👤' },
]
</script>
