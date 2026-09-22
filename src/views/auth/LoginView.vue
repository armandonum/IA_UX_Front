<template>

    <div class="column items-center full-width q-px-md">

      <!-- Logo -->
      <div class="text-center q-mb-xl">

        <q-avatar
          size="72px"
          color="primary"
          text-color="white"
          icon="school"
          class="shadow-6"
        />

        <div class="text-h4 text-weight-bold q-mt-md">
          EduPlatform
        </div>

        <div class="text-grey-7">
          Accede a tu cuenta para continuar
        </div>

      </div>

      <!-- Login -->
      <q-card
        flat
        bordered
        class="login-card"
      >

        <q-card-section>

          <q-form
            class="column q-gutter-md"
            @submit="handleLogin"
          >

            <q-input
              v-model="form.email"
              outlined
              label="Correo electrónico"
              type="email"
              autocomplete="email"
              lazy-rules
              :rules="[v => !!v || 'Ingrese su correo']"
            >
              <template #prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              outlined
              :type="showPassword ? 'text' : 'password'"
              label="Contraseña"
              autocomplete="current-password"
              lazy-rules
              :rules="[v => !!v || 'Ingrese su contraseña']"
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>

              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-banner
              v-if="auth.error"
              rounded
              dense
              class="bg-red-1 text-negative"
            >
              <template #avatar>
                <q-icon name="error" />
              </template>

              {{ auth.error }}
            </q-banner>

            <q-btn
              type="submit"
              color="primary"
              unelevated
              rounded
              size="lg"
              class="full-width"
              :loading="auth.loading"
              label="Iniciar sesión"
            />

          </q-form>

        </q-card-section>

      </q-card>

      <div class="text-caption text-grey-6 q-mt-lg">
        EduPlatform © {{ new Date().getFullYear() }}
      </div>

    </div>

</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: ''
})

async function handleLogin () {
  try {
    const user = await auth.login(form)

    toast.success(`¡Bienvenido ${user?.display_name}!`)

    router.push('/dashboard')
  } catch {
    // El store maneja el error
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
}
</style>
