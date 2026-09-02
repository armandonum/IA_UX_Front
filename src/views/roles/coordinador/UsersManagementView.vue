  <template>
    <q-page class="q-pa-md">

      <q-toolbar class="q-pa-none q-mb-md">
        <div>
          <div class="text-h5 text-weight-bold">
            Gestión de Usuarios
          </div>
          <div class="text-grey-6">
            Administra los usuarios de la plataforma
          </div>
        </div>

        <q-space />

        <q-btn
          v-if="can('users.create')"
          color="primary"
          icon="add"
          label="Nuevo usuario"
          @click="openCreate"
        />
      </q-toolbar>
      <!-- Indicador de semestre -->
      <div v-if="currentSemester" class="q-mb-md text-caption text-grey-6">
        <q-icon name="calendar_month" size="16px" class="q-mr-xs" />
        Semestre actual: {{ currentSemesterName }}
        <q-badge color="primary" class="q-ml-sm">
          {{ usersStore.users.length }} usuarios registrados
        </q-badge>
      </div>

      <div class="row q-mb-md">
        <div class="col-12 col-md-4">
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            debounce="300"
            label="Buscar usuario"
            prepend-icon="search"
          />
        </div>
      </div>

      <q-card flat bordered>

        <q-table
          :rows="filtered"
          :columns="columns"
          row-key="user_id"
          :loading="usersStore.loading"
          flat
        >

          <template v-slot:body-cell-display_name="props">

            <q-td :props="props">

              <div class="row items-center no-wrap">

                <q-avatar
                  color="primary"
                  text-color="white"
                  size="32px"
                >
                  {{ avatarInitials(props.row.display_name) }}
                </q-avatar>

                <span class="q-ml-sm">
                  {{ props.row.display_name }}
                </span>

              </div>

            </q-td>

          </template>

          <template v-slot:body-cell-role="props">

            <q-td :props="props">

              <q-chip
                dense
                color="primary"
                text-color="white"
              >
                {{ props.row.roles?.[0]?.name ?? 'Sin rol' }}
              </q-chip>

            </q-td>

          </template>

          <template v-slot:body-cell-status="props">

            <q-td :props="props">

              <q-chip
                dense
                :color="props.row.status === 'active' ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ props.row.status }}
              </q-chip>

            </q-td>

          </template>

          <template v-slot:body-cell-actions="props">

            <q-td
              :props="props"
              class="text-right"
            >

              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEdit(props.row)"
              />

              <q-btn
                v-if="can('*')"
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
              />

            </q-td>

          </template>

        </q-table>

      </q-card>

  <UserModal
    v-model="modalOpen"
    :user="editingUser"
    :roles="rolesStore.roles"
    @close="modalOpen = false"
    @saved="onSaved"
  />
    </q-page>
  </template>

  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useUsersStore } from '@/stores/users.store'
  import { useRolesStore } from '@/stores/roles.store'
  import { usePermissions } from '@/composables/usePermissions'
  import { useToast } from '@/composables/useToast'
  import UserModal from '@/components/common/UserModal.vue'
  import type { User } from '@/types'
  import { useSemesterStore } from '@/stores/semester.store'

  const usersStore = useUsersStore()
  const rolesStore = useRolesStore()
  const { can } = usePermissions()
  const toast = useToast()

  const search = ref('')
  const modalOpen = ref(false)
  const editingUser = ref<User | null>(null)
  const semesterStore = useSemesterStore()


onMounted(async () => {
  await usersStore.fetchAll()
  await rolesStore.fetchAll()
})

  const filtered = computed(() => {
    const q = search.value.toLowerCase()
    return usersStore.users.filter(
      (u) => !q || u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  })

  function avatarInitials(name: string) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
    return name.slice(0, 2)
  }

  function openCreate() { editingUser.value = null; modalOpen.value = true }
  function openEdit(user: User) { editingUser.value = user; modalOpen.value = true }

  async function confirmDelete(user: User) {
    if (!confirm(`¿Eliminar a ${user.display_name}?`)) return
    try {
      await usersStore.remove(user.user_id)
      toast.success('Usuario eliminado')
    } catch {
      toast.error('No se pudo eliminar el usuario')
    }
  }

  function onSaved() {
    modalOpen.value = false
    usersStore.fetchAll()
  }


  const currentSemester = computed(() => semesterStore.currentSemester)
  const currentSemesterName = computed(() => {
    if (!currentSemester.value) return ''
    return `${currentSemester.value.name} (${currentSemester.value.code})`
  })

  const columns = [
    {
      name: 'display_name',
      label: 'Nombre',
      field: 'display_name',
      align: 'left'
    },
    {
      name: 'email',
      label: 'Email',
      field: row => row.email,
      align: 'left'
    },
    {
      name: 'role',
      label: 'Rol',
      field: row => row.roles?.[0]?.name,
      align: 'left'
    },
    {
      name: 'status',
      label: 'Estado',
      field: 'status',
      align: 'left'
    },
    {
      name: 'actions',
      label: 'Acciones',
      field: '',
      align: 'right'
    }
  ]
  </script>
