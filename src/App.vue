<template>
  <RouterView />
  

  <!-- Global toast notifications -->
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium min-w-[260px] max-w-xs border"
          :class="toastClass(toast.type)"
        >
          <span class="text-lg">{{ toastIcon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            @click="dismiss(toast.id)"
            class="opacity-60 hover:opacity-100 text-xs ml-2 leading-none"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

function toastClass(type: string) {
  const map: Record<string, string> = {
    success: 'bg-emerald-900/90 text-emerald-100 border-emerald-700',
    error:   'bg-red-900/90 text-red-100 border-red-700',
    warning: 'bg-amber-900/90 text-amber-100 border-amber-700',
    info:    'bg-primary-900/90 text-primary-100 border-primary-700',
  }
  return map[type] ?? map.info
}

function toastIcon(type: string) {
  const map: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
  }
  return map[type] ?? 'ℹ'
}
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(10px) scale(0.95); }
.toast-leave-to   { opacity: 0; transform: translateX(20px) scale(0.95); }
.toast-move       { transition: transform 0.25s ease; }
</style>
