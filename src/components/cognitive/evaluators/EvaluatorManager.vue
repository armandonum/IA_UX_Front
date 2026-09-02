<!-- components/evaluators/EvaluatorManager.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-md font-semibold text-secondary">
        Evaluadores Asignados
      </h3>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Asignar Evaluadores"
        size="sm"
        @click="$emit('add')"
      />
    </div>

    <div v-if="evaluators.length === 0" class="text-center py-8">
      <q-icon name="people" size="48px" color="grey-6" />
      <p class="text-secondary mt-2">No hay evaluadores asignados</p>
      <q-btn
        v-if="canEdit"
        flat
        color="primary"
        label="Asignar evaluadores"
        @click="$emit('add')"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <q-card
        v-for="evaluator in evaluators"
        :key="evaluator.id"
        class="bg-slate-700 border-slate-600"
      >
        <q-card-section>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <q-avatar color="primary" text-color="white" size="40px">
                {{ getInitials(evaluator.userFullName || evaluator.userId) }}
              </q-avatar>
              <div>
                <div class="font-semibold text-secondary">
                  {{ getUserDisplayName(evaluator.userId) }}
                </div>
                <div class="text-xs text-secondary">
                  {{ evaluator.userEmail || "" }}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <q-badge
                    :color="getRoleColor(evaluator.evaluatorRole)"
                    size="sm"
                  >
                    {{ getRoleLabel(evaluator.evaluatorRole) }}
                  </q-badge>
                  <q-badge
                    :color="evaluator.hasCompleted ? 'positive' : 'warning'"
                    size="sm"
                  >
                    {{ evaluator.hasCompleted ? "Completado" : "Pendiente" }}
                  </q-badge>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <q-circular-progress
                :value="evaluator.progress || 0"
                size="40px"
                :color="getProgressColor(evaluator.progress || 0)"
                track-color="grey-7"
                show-value
                font-size="8px"
              />
              <q-btn
                v-if="canEdit && !evaluator.hasCompleted"
                icon="delete"
                flat
                dense
                size="sm"
                color="negative"
                @click="confirmRemove(evaluator.id)"
              />
            </div>
          </div>
          <div v-if="evaluator.notes" class="mt-2 text-sm text-slate-400">
            <q-icon name="note" size="14px" />
            {{ evaluator.notes }}
          </div>
          <div v-if="evaluator.completedAt" class="mt-2 text-xs text-slate-500">
            Completado: {{ formatDate(evaluator.completedAt) }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";

const props = defineProps<{
  evaluators: any[];
  canEdit?: boolean;
  users: any[];
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "remove", id: string): void;
}>();

const $q = useQuasar();

const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    supervisor: "primary",
    evaluator: "info",
    observer: "grey",
  };
  return colors[role] || "grey";
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    supervisor: "Supervisor",
    evaluator: "Evaluador",
    observer: "Observador",
  };
  return labels[role] || role;
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "positive";
  if (progress >= 50) return "warning";
  return "grey";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const getUserDisplayName = (userId: string) => {
  const user = props.users.find((user) => user.user_id === userId);
  return user?.display_name || "Usuario";
};
const confirmRemove = (id: string) => {
  $q.dialog({
    title: "Remover Evaluador",
    message: "¿Estás seguro de remover este evaluador de la evaluación?",
    ok: { label: "Remover", color: "negative" },
    cancel: "Cancelar",
  }).onOk(() => {
    emit("remove", id);
  });
};
</script>
