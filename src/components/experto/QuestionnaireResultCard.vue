<template>
  <q-card style="border: 1px solid #e2e8f0">
    <q-card-section>
      <div class="row items-center">
        <q-icon :name="icon" style="color: #1e3a8a" size="24px" class="q-mr-sm" />
        <div class="text-subtitle1" style="color: #0f172a; font-weight: 600">{{ title }}</div>
        <q-badge
          v-if="completed"
          color="positive"
          text-color="white"
          class="q-ml-sm"
          label="Completado ✓"
        />
        <q-badge v-else color="warning" text-color="white" class="q-ml-sm" label="Pendiente" />
      </div>
      <div class="q-mt-sm" style="color: #334155; font-size: 0.9rem">
        <span v-if="loading">Cargando…</span>
        <span v-else-if="data">
          Respondido el: {{ formatFecha(data.completedAt || data.createdAt) }}
        </span>
        <span v-else>No se ha completado el {{ title.toLowerCase() }}</span>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section v-if="data && data.responses?.length">
      <div class="text-caption" style="color: #334155; font-weight: 500; margin-bottom: 8px">
        {{ data.responses.length }} preguntas respondidas
      </div>
      <q-btn flat dense no-caps style="color: #3b82f6" label="Ver respuestas" @click="verRespuestas = true" />
    </q-card-section>

    <q-card-section v-else-if="data && !loading">
      <div style="color: #334155; font-size: 0.9rem">No hay respuestas registradas</div>
    </q-card-section>

    <!-- Modal de respuestas -->
    <q-dialog v-model="verRespuestas">
      <q-card style="min-width: 480px; max-width: 650px; max-height: 80vh">
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between">
            <div class="text-h6" style="color: #1e3a8a">
              <q-icon :name="icon" class="q-mr-sm" /> {{ title }}
            </div>
            <q-badge color="primary" :label="`${data?.responses?.length || 0} respuestas`" />
          </div>
          <div class="text-caption q-mt-xs" style="color: #64748b">
            Completado: {{ formatFecha(data?.completedAt || data?.createdAt) }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 55vh; overflow-y: auto; padding: 8px 16px">
          <div v-if="data?.responses?.length">
            <div
              v-for="(response, index) in data.responses"
              :key="index"
              class="q-mb-md q-pa-sm"
              style="border-bottom: 1px solid #e2e8f0"
            >
              <div class="text-weight-bold" style="color: #0f172a; font-size: 0.95rem">
                {{ index + 1 }}. {{ response.questionText }}
              </div>
              <div class="q-mt-xs" style="color: #334155; font-size: 0.85rem">
                <template v-if="response.questionType === 'short_text' || response.questionType === 'long_text'">
                  <div class="q-mt-xs">
                    <span class="text-grey-7">Respuesta:</span>
                    <span style="color: #1e3a8a; font-weight: 500"> {{ response.answerText || 'No respondida' }}</span>
                  </div>
                </template>

                <template v-else-if="response.questionType === 'single_choice'">
                  <div class="q-mt-xs">
                    <q-icon name="check_circle" color="positive" size="18px" />
                    <span style="color: #1e3a8a; font-weight: 500"> {{ response.selectedOptionLabel || 'No seleccionada' }}</span>
                  </div>
                </template>

                <template v-else-if="response.questionType === 'multi_choice'">
                  <div class="q-mt-xs">
                    <div v-if="response.selectedOptionLabels && response.selectedOptionLabels.length > 0">
                      <div v-for="(label, idx) in response.selectedOptionLabels" :key="idx" class="q-py-xs">
                        <q-icon name="check_box" color="positive" size="18px" />
                        <span style="color: #1e3a8a; font-weight: 500"> {{ label }}</span>
                      </div>
                    </div>
                    <span v-else class="text-grey-6">Ninguna opción seleccionada</span>
                  </div>
                </template>

                <template v-else-if="response.questionType === 'scale'">
                  <div class="q-mt-xs">
                    <span class="text-grey-7">Valor:</span>
                    <span style="color: #1e3a8a; font-weight: 600; font-size: 1.1rem">
                      {{ response.scaleValue !== null && response.scaleValue !== undefined ? response.scaleValue : 'No respondido' }}
                    </span>
                  </div>
                </template>

                <template v-else-if="response.questionType === 'boolean'">
                  <div class="q-mt-xs">
                    <q-icon
                      :name="response.booleanValue ? 'check_circle' : 'cancel'"
                      :color="response.booleanValue ? 'positive' : 'negative'"
                      size="20px"
                    />
                    <span style="color: #1e3a8a; font-weight: 500">
                      {{ response.booleanValue === true ? 'Sí' : response.booleanValue === false ? 'No' : 'No respondido' }}
                    </span>
                  </div>
                </template>

                <template v-else>
                  <div class="q-mt-xs text-grey-6">
                    <em>Respuesta no disponible para este tipo de pregunta</em>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div v-else class="text-center q-py-lg text-grey-6">
            <q-icon name="info" size="32px" class="q-mb-sm" />
            <div>No hay respuestas disponibles</div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="text-right q-py-sm">
          <q-btn flat label="Cerrar" style="color: #1e3a8a" @click="verRespuestas = false" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

interface Props {
  type: "pretest" | "posttest";
  userId: string | null | undefined;
  projectId: string | null | undefined;
  apiBaseUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  apiBaseUrl: "http://localhost:3000",
});

const emit = defineEmits<{
  (e: "loaded", payload: { completed: boolean; data: any }): void;
}>();

const loading = ref(false);
const completed = ref(false);
const data = ref<any>(null);
const verRespuestas = ref(false);

const icon = computed(() => (props.type === "pretest" ? "assignment" : "assignment_turned_in"));
const title = computed(() => (props.type === "pretest" ? "Pre-test" : "Post-test"));

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function cargar() {
  data.value = null;
  completed.value = false;

  if (!props.userId || !props.projectId) return;

  loading.value = true;
  try {
    const questionnaires = await fetchJson(
      `${props.apiBaseUrl}/api/questionnaires/project/${props.projectId}`,
    );
    if (!questionnaires) return;

    const questionnaire = questionnaires.find((q: any) => q.type === props.type);
    if (!questionnaire) return;

    const questionnaireId = questionnaire.questionnaireId || questionnaire.questionnaire_id;

    const allResponses = await fetchJson(
      `${props.apiBaseUrl}/api/questionnaire-responses/participant/${props.userId}`,
    );
    if (!allResponses) return;

    const matchingResponses = allResponses.filter((r: any) => {
      const rId = r.questionnaireId || r.questionnaire_id;
      return rId === questionnaireId;
    });

    if (matchingResponses.length === 0) return;

    completed.value = true;
    const response = matchingResponses[0];
    const responseId = response.responseId || response.response_id;

    const [questions, answers] = await Promise.all([
      fetchJson(`${props.apiBaseUrl}/api/questions/questionnaire/${questionnaireId}`),
      fetchJson(`${props.apiBaseUrl}/api/question-answers/response/${responseId}`),
    ]);

    const questionsMap: Record<string, any> = {};
    for (const q of questions || []) {
      const qId = q.questionId || q.id || q.question_id;
      questionsMap[qId] = q;
    }

    const responsesWithDetails = await Promise.all(
      (answers || []).map((answer: any) => procesarRespuesta(answer, questionsMap)),
    );

    data.value = {
      responseId,
      questionnaireId,
      participantId: props.userId,
      sessionId: response.sessionId || response.session_id || null,
      completedAt: response.submittedAt || response.submitted_at || response.createdAt,
      createdAt: response.createdAt || response.created_at,
      responses: responsesWithDetails,
    };

    emit("loaded", { completed: completed.value, data: data.value });
  } catch (error) {
    console.error(`❌ Error cargando ${props.type}:`, error);
  } finally {
    loading.value = false;
  }
}

async function procesarRespuesta(answer: any, questionsMap: Record<string, any>) {
  const questionId = answer.question_id || answer.questionId;
  const question = questionsMap[questionId] || {};
  const questionType = question.question_type || question.questionType || "short_text";

  let selectedOptionLabel = null;
  let selectedOptionLabels: string[] = [];

  if (questionType === "single_choice") {
    const optId = answer.selected_option_id || answer.selectedOptionId;
    if (optId) {
      const opt = await fetchJson(`${props.apiBaseUrl}/api/question-options/${optId}`);
      if (opt) selectedOptionLabel = opt.label || opt.option_label || opt.optionLabel;
    }
  }

  if (questionType === "multi_choice") {
    const answerId = answer.answer_id || answer.answerId;
    const options = await fetchJson(
      `${props.apiBaseUrl}/api/question-answer-options/answer/${answerId}`,
    );
    for (const opt of options || []) {
      const optId = opt.option_id || opt.optionId;
      const optData = await fetchJson(`${props.apiBaseUrl}/api/question-options/${optId}`);
      const label = optData?.label || optData?.option_label || optData?.optionLabel;
      if (label) selectedOptionLabels.push(label);
    }
  }

  const scaleValue = questionType === "scale" ? (answer.scale_value ?? answer.scaleValue ?? null) : null;

  const booleanValue =
    questionType === "boolean"
      ? answer.boolean_value !== undefined
        ? answer.boolean_value
        : answer.booleanValue !== undefined
          ? answer.booleanValue
          : null
      : null;

  const answerText =
    questionType === "short_text" || questionType === "long_text"
      ? answer.answer_text || answer.answerText
      : null;

  return {
    questionText: question.question_text || question.questionText || "Pregunta sin texto",
    questionType,
    answerText,
    selectedOptionLabel,
    selectedOptionLabels,
    selectedOptionLabelsText: selectedOptionLabels.length > 0 ? selectedOptionLabels.join(", ") : null,
    scaleValue,
    booleanValue,
    isNotApplicable: answer.is_not_applicable || answer.isNotApplicable || false,
  };
}

watch(
  () => [props.userId, props.projectId, props.type],
  () => cargar(),
);

onMounted(cargar);

defineExpose({ reload: cargar, completed, data });
</script>