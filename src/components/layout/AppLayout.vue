<template>
<q-layout view="lHh Lpr lFf">

  <!-- Pasamos el estado con v-model para que sea bidireccional -->
  <AppSidebar
    v-model="leftDrawerOpen"
    :collapsed="sidebarCollapsed"
  />

  <q-page-container>

    <!-- El botón ahora cambia el estado de apertura -->
    <AppTopbar
      @toggle-sidebar="leftDrawerOpen = !leftDrawerOpen"
    />

    <q-page class="q-pa-md">
      <RouterView />
    </q-page>

  </q-page-container>

</q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const leftDrawerOpen = ref(false)
const sidebarCollapsed = ref(false)
</script>