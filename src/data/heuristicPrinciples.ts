// data/heuristicPrinciples.ts

export interface HeuristicPrinciple {
  id: string
  code: string
  name: string
  description: string
}

export interface HeuristicObservation {
  id: string
  principleId: string
  taskId: string
  description: string
  severity: 1 | 2 | 3 | 4 | 5  // 1=Leve, 5=Crítico
  frequency: 'Siempre' | 'Frecuentemente' | 'Ocasionalmente' | 'Raramente' | 'Nunca'
  timestampMs: number
  createdAt: string
}

export const HEURISTIC_PRINCIPLES: HeuristicPrinciple[] = [
  {
    id: 'h1',
    code: 'H1',
    name: 'Visibilidad del estado del sistema',
    description: 'El sistema debe mantener informados a los usuarios sobre lo que está sucediendo, proporcionando retroalimentación adecuada y en tiempo razonable.'
  },
  {
    id: 'h2',
    code: 'H2',
    name: 'Relación entre el sistema y el mundo real',
    description: 'El sistema debe hablar el lenguaje del usuario, con palabras, frases y conceptos familiares, siguiendo convenciones del mundo real.'
  },
  {
    id: 'h3',
    code: 'H3',
    name: 'Control y libertad del usuario',
    description: 'Los usuarios deben tener control sobre el sistema y poder deshacer o salir de acciones no deseadas fácilmente.'
  },
  {
    id: 'h4',
    code: 'H4',
    name: 'Consistencia y estándares',
    description: 'El sistema debe ser coherente en su diseño y seguir las convenciones estándar de la plataforma.'
  },
  {
    id: 'h5',
    code: 'H5',
    name: 'Prevención de errores',
    description: 'Un buen diseño debe prevenir que ocurran errores, eliminando condiciones propensas a ellos.'
  },
  {
    id: 'h6',
    code: 'H6',
    name: 'Reconocer antes que recordar',
    description: 'Se debe minimizar la carga de memoria del usuario, haciendo visibles los elementos y opciones.'
  },
  {
    id: 'h7',
    code: 'H7',
    name: 'Flexibilidad y eficiencia de uso',
    description: 'El sistema debe permitir tanto a usuarios novatos como expertos trabajar de manera eficiente.'
  },
  {
    id: 'h8',
    code: 'H8',
    name: 'Diseño estético y minimalista',
    description: 'La interfaz no debe contener información irrelevante o que distraiga al usuario.'
  },
  {
    id: 'h9',
    code: 'H9',
    name: 'Ayuda para reconocer y recuperarse de errores',
    description: 'Los mensajes de error deben ser claros, indicar el problema y sugerir una solución.'
  },
  {
    id: 'h10',
    code: 'H10',
    name: 'Ayuda y documentación',
    description: 'La ayuda debe ser fácil de encontrar, enfocada en tareas y concisa.'
  }
]

export const SEVERITY_OPTIONS = [
  { value: 1, label: '1 - Leve', color: 'green' },
  { value: 2, label: '2 - Menor', color: 'blue' },
  { value: 3, label: '3 - Moderado', color: 'yellow' },
  { value: 4, label: '4 - Grave', color: 'orange' },
  { value: 5, label: '5 - Crítico', color: 'red' }
]

export const FREQUENCY_OPTIONS = [
  'Siempre',
  'Frecuentemente',
  'Ocasionalmente',
  'Raramente',
  'Nunca'
]