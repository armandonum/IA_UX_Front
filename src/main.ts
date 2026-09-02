import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './style.css'

import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

app.use(router)

app.use(createPinia())

app.use(Quasar, {
   plugins: {
    Notify,
    Dialog,
  },
  config: {
    brand: {
      primary: '#1E3A8A',
      secondary: '#334155',
      accent: '#3B82F6',

      
      dark: '#0F172A',
      positive: '#16A34A',
      negative: '#DC2626',
      info: '#0284C7',
      warning: '#D97706'
    },

  }
})

app.mount('#app')