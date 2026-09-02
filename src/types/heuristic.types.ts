// types/heuristic.types.ts

export interface HeuristicPrinciple {
  id: string
  name: string
  description: string
  code: string
  questions: HeuristicQuestion[]
}

export interface HeuristicQuestion {
  id: string
  principleId: string
  text: string
  type: 'scale' | 'yes_no' | 'text'
  helpText?: string
}

export interface HeuristicEvaluation {
  evaluationId: string
  projectId: string
  userId: string
  sessionId: string | null
  status: 'pending' | 'in_progress' | 'completed'
  answers: HeuristicAnswer[]
  startedAt: string
  completedAt: string | null
  durationSeconds: number | null
}

export interface HeuristicAnswer {
  questionId: string
  value: number | boolean | string
  comment?: string
  timestampMs: number
}

export interface HeuristicSession {
  sessionId: string
  projectId: string
  userId: string
  fileKey: string
  status: 'in_progress' | 'completed' | 'abandoned'
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
}

// Principios Heurísticos de Nielsen
export const HEURISTIC_PRINCIPLES: HeuristicPrinciple[] = [
  {
    id: '1',
    code: 'H1',
    name: 'Visibilidad del estado del sistema',
    description: 'El sistema debe mantener informados a los usuarios sobre lo que está sucediendo, proporcionando retroalimentación adecuada y en tiempo razonable.',
    questions: [
      {
          id: 'q1_1', text: '¿El sistema muestra claramente el estado actual de la tarea?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q1_2', text: '¿Hay retroalimentación visual inmediata ante las acciones del usuario?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q1_3', text: '¿El usuario sabe en todo momento en qué parte del proceso se encuentra?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q1_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '2',
    code: 'H2',
    name: 'Relación entre el sistema y el mundo real',
    description: 'El sistema debe hablar el lenguaje del usuario, con palabras, frases y conceptos familiares, siguiendo convenciones del mundo real.',
    questions: [
      {
          id: 'q2_1', text: '¿El lenguaje usado es familiar y comprensible para el usuario?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q2_2', text: '¿Los íconos y símbolos son intuitivos y reconocibles?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q2_3', text: '¿La información se presenta en un orden lógico y natural?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q2_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '3',
    code: 'H3',
    name: 'Control y libertad del usuario',
    description: 'Los usuarios deben tener control sobre el sistema y poder deshacer o salir de acciones no deseadas fácilmente.',
    questions: [
      {
          id: 'q3_1', text: '¿Es fácil deshacer o revertir acciones?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q3_2', text: '¿Hay una forma clara de salir de estados no deseados?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q3_3', text: '¿El usuario puede navegar libremente sin sentirse atrapado?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q3_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '4',
    code: 'H4',
    name: 'Consistencia y estándares',
    description: 'El sistema debe ser coherente en su diseño y seguir las convenciones estándar de la plataforma.',
    questions: [
      {
          id: 'q4_1', text: '¿La terminología es consistente en toda la interfaz?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q4_2', text: '¿Las acciones similares producen resultados similares?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q4_3', text: '¿Se siguen las convenciones estándar de la plataforma?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q4_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '5',
    code: 'H5',
    name: 'Prevención de errores',
    description: 'Un buen diseño debe prevenir que ocurran errores, eliminando condiciones propensas a ellos.',
    questions: [
      {
          id: 'q5_1', text: '¿Se confirman acciones críticas antes de ejecutarlas?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q5_2', text: '¿Se previenen errores comunes con validaciones o restricciones?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q5_3', text: '¿Hay mensajes de confirmación claros para acciones destructivas?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q5_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '6',
    code: 'H6',
    name: 'Reconocer antes que recordar',
    description: 'Se debe minimizar la carga de memoria del usuario, haciendo visibles los elementos y opciones.',
    questions: [
      {
          id: 'q6_1', text: '¿Las opciones son claramente visibles y no requieren recordar?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q6_2', text: '¿La información importante está disponible sin navegar a otras pantallas?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q6_3', text: '¿Se usan elementos de ayuda para facilitar el reconocimiento?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q6_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '7',
    code: 'H7',
    name: 'Flexibilidad y eficiencia de uso',
    description: 'El sistema debe permitir tanto a usuarios novatos como expertos trabajar de manera eficiente.',
    questions: [
      {
          id: 'q7_1', text: '¿Hay atajos o aceleradores para usuarios avanzados?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q7_2', text: '¿Se pueden personalizar aspectos de la interfaz?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q7_3', text: '¿La interfaz se adapta a diferentes niveles de experiencia?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q7_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '8',
    code: 'H8',
    name: 'Diseño estético y minimalista',
    description: 'La interfaz no debe contener información irrelevante o que distraiga al usuario.',
    questions: [
      {
          id: 'q8_1', text: '¿La interfaz es limpia y sin elementos innecesarios?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q8_2', text: '¿La información importante destaca visualmente?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q8_3', text: '¿El diseño es atractivo y agradable a la vista?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q8_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '9',
    code: 'H9',
    name: 'Ayuda para reconocer y recuperarse de errores',
    description: 'Los mensajes de error deben ser claros, indicar el problema y sugerir una solución.',
    questions: [
      {
          id: 'q9_1', text: '¿Los mensajes de error son claros y en lenguaje natural?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q9_2', text: '¿Se indica la causa del error y cómo solucionarlo?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q9_3', text: '¿Se ofrecen sugerencias constructivas para resolver el error?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q9_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  },
  {
    id: '10',
    code: 'H10',
    name: 'Ayuda y documentación',
    description: 'La ayuda debe ser fácil de encontrar, enfocada en tareas y concisa.',
    questions: [
      {
          id: 'q10_1', text: '¿La ayuda es fácil de encontrar y acceder?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q10_2', text: '¿La documentación es clara y útil para resolver dudas?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q10_3', text: '¿La ayuda está contextualizada a la tarea actual?', type: 'scale',
          principleId: ""
      },
      {
          id: 'q10_4', text: 'Observaciones adicionales', type: 'text',
          principleId: ""
      },
    ]
  }
]