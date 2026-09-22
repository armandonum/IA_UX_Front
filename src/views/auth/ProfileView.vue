
<template>
  <div class="q-pa-lg">

    <!-- Encabezado -->
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">
        Mi Perfil
      </div>

      <div class="text-grey-7">
        Gestiona tu información y seguridad
      </div>
    </div>

    <!-- Información del usuario -->
    <q-card
      bordered
      flat
      class="q-mb-lg"
    >
      <q-card-section>

        <div class="row items-center q-col-gutter-md">

          <div class="col-auto">
            <q-avatar
              size="64px"
              color="primary"
              text-color="white"
            >
              {{ avatarInitials }}
            </q-avatar>
          </div>

          <div class="col">

            <div class="text-h6">
              {{ auth.user?.display_name }}
            </div>

            <div class="text-grey-7">
              {{ auth.user?.email.value }}
            </div>

            <div class="q-mt-sm">

              <q-chip
                color="primary"
                text-color="white"
                dense
              >
                {{ auth.currentRole }}
              </q-chip>

              <q-chip
                :color="auth.user?.status === 'active'
                  ? 'positive'
                  : 'grey-6'"
                text-color="white"
                dense
              >
                {{ auth.user?.status }}
              </q-chip>

            </div>

          </div>

        </div>

      </q-card-section>

      <q-separator />

      <q-card-section>

        <div class="row q-col-gutter-lg">

          <div class="col-12 col-md-6">

            <div class="text-caption text-grey">
              ID
            </div>

            <div class="text-body2">
              {{ auth.user?.user_id }}
            </div>

          </div>

          <div
            v-if="auth.user?.last_login_at"
            class="col-12 col-md-6"
          >

            <div class="text-caption text-grey">
              Último acceso
            </div>

            <div class="text-body2">
              {{ formatDate(auth.user.last_login_at) }}
            </div>

          </div>

        </div>

      </q-card-section>

    </q-card>

    <!-- Cambiar contraseña -->
    <q-card
      bordered
      flat
    >

      <q-card-section>

        <div class="text-h6 q-mb-md">
          Cambiar contraseña
        </div>

        <q-form
          class="q-gutter-md"
          @submit="handleChangePassword"
        >

          <q-input
            v-model="form.currentPassword"
            outlined
            type="password"
            label="Contraseña actual"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="form.newPassword"
            outlined
            type="password"
            label="Nueva contraseña"
          >
            <template #prepend>
              <q-icon name="vpn_key" />
            </template>
          </q-input>

          <q-input
            v-model="form.confirm"
            outlined
            type="password"
            label="Confirmar nueva contraseña"
            :error="mismatch"
            error-message="Las contraseñas no coinciden"
          >
            <template #prepend>
              <q-icon name="verified_user" />
            </template>
          </q-input>

          <q-banner
            v-if="auth.error"
            rounded
            class="bg-red-1 text-negative"
          >
            <template #avatar>
              <q-icon name="error" />
            </template>

            {{ auth.error }}
          </q-banner>

          <div class="row justify-end">

            <q-btn
              color="primary"
              icon="save"
              label="Actualizar contraseña"
              :loading="auth.loading"
              :disable="mismatch"
              type="submit"
              unelevated
            />

          </div>

        </q-form>

      </q-card-section>

    </q-card>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirm: ''
})

const mismatch = computed(() =>
  !!form.confirm && form.newPassword !== form.confirm
)

const avatarInitials = computed(() => {
  const name = auth.user?.display_name ?? ''
  const parts = name.trim().split(' ')

  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }

  return name.substring(0, 2)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

async function handleChangePassword() {
  if (mismatch.value) return

  try {
    await auth.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    })

    toast.success('Contraseña actualizada correctamente')

    form.currentPassword = ''
    form.newPassword = ''
    form.confirm = ''

  } catch {
    // El store maneja el error
  }
}
</script>
