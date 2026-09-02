-- =====================================================
-- EXTENSIONES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ESQUEMA
-- =====================================================

CREATE SCHEMA IF NOT EXISTS usability;

-- =====================================================
-- TABLA: usability_sessions
-- =====================================================

CREATE TABLE usability.usability_sessions (
	session_id uuid DEFAULT gen_random_uuid() NOT NULL,
	project_id uuid NOT NULL,
	user_id uuid NULL,
	task_id uuid NULL,
	file_key varchar(255) NOT NULL,
	node_id_inicial varchar(255) NULL,
	task_description text NOT NULL,
	started_at timestamp NOT NULL,
	ended_at timestamp NULL,
	duration_seconds int4 DEFAULT 0 NULL,
	status varchar(20) NOT NULL,
	device_type varchar(20) NULL,
	browser varchar(600) NULL,
	face_video_key varchar(500) NULL,
	screen_video_key varchar(500) NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	evaluation_type varchar(50) DEFAULT 'formal'::character varying NOT NULL,
	CONSTRAINT usability_sessions_device_type_check CHECK (((device_type)::text = ANY ((ARRAY['desktop'::character varying, 'mobile'::character varying, 'tablet'::character varying])::text[]))),
	CONSTRAINT usability_sessions_pkey PRIMARY KEY (session_id),
	CONSTRAINT usability_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying])::text[])))
);
-- =====================================================
-- TABLA: usability_events
-- =====================================================

CREATE TABLE usability.usability_events
(
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL,

    event_type VARCHAR(100) NOT NULL,

    event_type_normalizado VARCHAR(50) NOT NULL,

    node_id VARCHAR(255),

    screen_name VARCHAR(255),

    elapsed_minute INTEGER NOT NULL DEFAULT 0,

    elapsed_second INTEGER NOT NULL DEFAULT 0,

    elapsed_ms_total BIGINT NOT NULL DEFAULT 0,

    timestamp_real TIMESTAMP NOT NULL DEFAULT NOW(),

    raw_payload JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_event_session
        FOREIGN KEY (session_id)
        REFERENCES usability.usability_sessions(session_id)
        ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_session_user
ON usability.usability_sessions(user_id);

CREATE INDEX idx_session_status
ON usability.usability_sessions(status);

CREATE INDEX idx_session_started
ON usability.usability_sessions(started_at);

CREATE INDEX idx_event_session
ON usability.usability_events(session_id);

CREATE INDEX idx_event_type
ON usability.usability_events(event_type);

CREATE INDEX idx_event_normalizado
ON usability.usability_events(event_type_normalizado);

CREATE INDEX idx_event_elapsed
ON usability.usability_events(elapsed_ms_total);

CREATE INDEX idx_event_timestamp
ON usability.usability_events(timestamp_real);






-- ===========================================================================
-- TABLA: usability.emotion_readings
-- Descripción: Almacena las lecturas de emociones procesadas por el pipeline 
--              de Visión Artificial vinculadas a una sesión de usuario.
-- ===========================================================================

CREATE TABLE usability.emotion_readings
(
    reading_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    elapsed_ms_total BIGINT NOT NULL DEFAULT 0,
    timestamp_real TIMESTAMP NOT NULL DEFAULT NOW(),
    dominant_emotion VARCHAR(50) NOT NULL,
    scores_json JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Restricciones de integridad (Llave Foránea)
    CONSTRAINT fk_emotion_session
        FOREIGN KEY (session_id)
        REFERENCES usability.usability_sessions(session_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Comentarios del Diccionario de Datos (PostgreSQL Metadata)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE usability.emotion_readings 
    IS 'Tabla que almacena los análisis de emociones en tiempo real capturados durante las sesiones de usabilidad.';

COMMENT ON COLUMN usability.emotion_readings.reading_id 
    IS 'Identificador único y llave primaria de la lectura de emoción.';

COMMENT ON COLUMN usability.emotion_readings.session_id 
    IS 'Llave foránea que vincula la lectura con la sesión de usabilidad correspondiente (usability_sessions).';

COMMENT ON COLUMN usability.emotion_readings.elapsed_ms_total 
    IS 'Tiempo transcurrido en milisegundos desde el inicio de la sesión. Utiliza el mismo reloj síncrono que los eventos de clicks.';

COMMENT ON COLUMN usability.emotion_readings.timestamp_real 
    IS 'Fecha y hora absoluta en la que el backend procesó el frame.';

COMMENT ON COLUMN usability.emotion_readings.dominant_emotion 
    IS 'La emoción detectada con el mayor porcentaje o puntuación de confianza (ej. Alegre, Neutro, Frustrado).';

COMMENT ON COLUMN usability.emotion_readings.scores_json 
    IS 'Objeto JSONB que guarda el desglose detallado con los porcentajes de las 6 emociones evaluadas.';

COMMENT ON COLUMN usability.emotion_readings.created_at 
    IS 'Fecha y hora de inserción del registro en la base de datos.';


-- ---------------------------------------------------------------------------
-- Índices para Optimización de Consultas
-- ---------------------------------------------------------------------------

-- Indexación de la FK para acelerar JOINs y borrados en cascada
CREATE INDEX idx_emotion_session
ON usability.emotion_readings(session_id);

-- Índice para ordenamiento y filtrado por línea de tiempo de la sesión (Análisis Secuencial)
CREATE INDEX idx_emotion_elapsed
ON usability.emotion_readings(elapsed_ms_total);

-- Índice para búsquedas analíticas por rangos de fechas reales
CREATE INDEX idx_emotion_timestamp
ON usability.emotion_readings(timestamp_real);



-- 1. Crear el esquema si no existe
CREATE SCHEMA IF NOT EXISTS usability;


-- ==========================================
-- 1. TABLA: figma_projects
-- ==========================================

CREATE TABLE usability.figma_projects (
	project_id uuid DEFAULT gen_random_uuid() NOT NULL,
	created_by uuid null,
	file_key varchar(255) NOT NULL,
	project_name varchar(255) NOT NULL,
	last_modified timestamptz NOT NULL,
	"version" varchar(100) NOT NULL,
	thumbnail_url text NULL,
	fetched_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	raw_json_path varchar(255) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	semester_id uuid NULL,
	CONSTRAINT figma_projects_pkey PRIMARY KEY (project_id)
);

COMMENT ON TABLE usability.figma_projects IS 'Almacena la metadata de los proyectos importados desde la API de Figma';
COMMENT ON COLUMN usability.figma_projects.project_id IS 'Identificador interno del proyecto en nuestra DB';
COMMENT ON COLUMN usability.figma_projects.file_key IS 'El file_key real del archivo en Figma';
COMMENT ON COLUMN usability.figma_projects.project_name IS 'Nombre del archivo o proyecto en Figma';
COMMENT ON COLUMN usability.figma_projects.last_modified IS 'lastModified devuelto por la API de Figma';
COMMENT ON COLUMN usability.figma_projects.version IS 'Versión del documento según la API';
COMMENT ON COLUMN usability.figma_projects.thumbnail_url IS 'URL de la miniatura de previsualización del proyecto';
COMMENT ON COLUMN usability.figma_projects.fetched_at IS 'Fecha y hora en la que se descargó o sincronizó este JSON';
COMMENT ON COLUMN usability.figma_projects.raw_json_path IS 'JSON completo devuelto por la API de Figma, guardado para consultas futuras sin re-sincronizar';



CREATE TABLE usability.project_reviewers (

    project_reviewer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,

    user_id UUID NOT NULL,

    role_id INTEGER NOT NULL,

    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    assigned_by UUID,

    CONSTRAINT fk_project_reviewers_project
        FOREIGN KEY (project_id)
        REFERENCES usability.figma_projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_reviewers_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(user_id),

    CONSTRAINT fk_project_reviewers_role
        FOREIGN KEY (role_id)
        REFERENCES auth.roles(role_id),

    CONSTRAINT uq_project_user
        UNIQUE(project_id, user_id)
);
-- ==========================================
-- 2. TABLA: figma_nodes (El árbol aplanado)
-- ==========================================
CREATE TABLE usability.figma_nodes (
    node_id VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL,
    parent_node_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    is_screen BOOLEAN NOT NULL DEFAULT FALSE,
    component_id VARCHAR(255),
    position_x NUMERIC(12, 4) NOT NULL,
    position_y NUMERIC(12, 4) NOT NULL,
    width NUMERIC(12, 4) NOT NULL,
    height NUMERIC(12, 4) NOT NULL,
    raw_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (node_id),
    CONSTRAINT fk_figma_node_project FOREIGN KEY (project_id) 
        REFERENCES usability.figma_projects (project_id) ON DELETE CASCADE,
    CONSTRAINT fk_figma_node_parent FOREIGN KEY (parent_node_id) 
        REFERENCES usability.figma_nodes (node_id) ON DELETE SET NULL
);

COMMENT ON TABLE usability.figma_nodes IS 'Árbol aplanado de nodos de Figma para búsquedas directas y eficientes sin recursión constante';
COMMENT ON COLUMN usability.figma_nodes.node_id IS 'El ID real del nodo en Figma (ej. "1:759", "I1:760;1:507")';
COMMENT ON COLUMN usability.figma_nodes.project_id IS 'Proyecto al que pertenece este nodo';
COMMENT ON COLUMN usability.figma_nodes.parent_node_id IS 'ID del nodo padre para reconstruir el árbol jerárquico';
COMMENT ON COLUMN usability.figma_nodes.name IS 'Nombre del nodo en Figma (ej. "Inicio", "Logo")';
COMMENT ON COLUMN usability.figma_nodes.type IS 'Tipo del nodo (ej. FRAME, INSTANCE, RECTANGLE, TEXT, COMPONENT)';
COMMENT ON COLUMN usability.figma_nodes.depth IS 'Nivel de anidamiento dentro del lienzo de Figma (0 = raíz)';
COMMENT ON COLUMN usability.figma_nodes.is_screen IS 'Indica si es un FRAME de nivel superior (pantalla principal del prototipo)';
COMMENT ON COLUMN usability.figma_nodes.component_id IS 'ID del componente del cual este nodo es instancia (si aplica)';
COMMENT ON COLUMN usability.figma_nodes.position_x IS 'Coordenada X absoluta del nodo';
COMMENT ON COLUMN usability.figma_nodes.position_y IS 'Coordenada Y absoluta del nodo';
COMMENT ON COLUMN usability.figma_nodes.width IS 'Ancho del nodo en píxeles';
COMMENT ON COLUMN usability.figma_nodes.height IS 'Alto del nodo en píxeles';
COMMENT ON COLUMN usability.figma_nodes.raw_json IS 'Copia del sub-objeto JSON de este nodo de la API de Figma';


-- ==========================================
-- 3. TABLA: tasks
-- ==========================================
CREATE TABLE usability.tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirement_id UUID not null,
    order_index INT4  not null,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) 
        REFERENCES usability.figma_projects (project_id) ON DELETE CASCADE
);



CREATE INDEX idx_tasks_requirement_order
  ON usability.tasks(requirement_id, order_index);

COMMENT ON TABLE usability.tasks IS 'Tareas de pruebas de usabilidad asignadas a un proyecto de Figma';
COMMENT ON COLUMN usability.tasks.task_id IS 'Identificador interno de la tarea';
COMMENT ON COLUMN usability.tasks.project_id IS 'Proyecto de Figma con el cual se realiza esta tarea';
COMMENT ON COLUMN usability.tasks.title IS 'Título descriptivo corto de la tarea';
COMMENT ON COLUMN usability.tasks.description IS 'Texto de instrucciones que se le muestra al usuario antes de iniciar la prueba';
COMMENT ON COLUMN usability.tasks.created_at IS 'Fecha y hora de creación del registro';


-- ==========================================
-- 4. TABLA: flow (Camino ideal esperado)
-- ==========================================
CREATE TABLE usability.flow (
	flow_id uuid DEFAULT gen_random_uuid() NOT NULL,
	task_id uuid NOT NULL,
	project_id uuid NOT NULL,
	name varchar(255) NOT NULL,
	status varchar(20) DEFAULT 'in_progress' NOT NULL, -- 'in_progress' | 'finished'
	started_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	finished_at timestamptz NULL,
	CONSTRAINT flow_pkey PRIMARY KEY (flow_id),
	CONSTRAINT flow_task_fk FOREIGN KEY (task_id) REFERENCES usability.tasks(task_id),
	CONSTRAINT flow_project_fk FOREIGN KEY (project_id) REFERENCES usability.figma_projects(project_id)
);

COMMENT ON TABLE usability.flow IS 'Camino ideal que se espera que siga el usuario para completar una tarea';
COMMENT ON COLUMN usability.flow.flow_id IS 'Identificador único del flujo';
COMMENT ON COLUMN usability.flow.task_id IS 'Tarea a la que pertenece este flujo';
COMMENT ON COLUMN usability.flow.project_id IS 'Proyecto de Figma asociado';
COMMENT ON COLUMN usability.flow.name IS 'Nombre descriptivo del flujo (ej. "Iniciar Sesión - Camino Feliz")';


-- ==========================================
-- 5. TABLA: flujo_pasos (Pasos del flujo ideal)
-- ==========================================
CREATE TABLE usability.flow_clicks (
	click_id uuid DEFAULT gen_random_uuid() NOT NULL,
	flow_id uuid NOT NULL,
	order_index int4 NOT NULL,
	node_id varchar(255) NOT NULL,
	presented_node_id varchar(255) NULL,
	clicked_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT flow_clicks_pkey PRIMARY KEY (click_id),
	CONSTRAINT flow_clicks_flow_fk FOREIGN KEY (flow_id) REFERENCES usability.flow(flow_id) ON DELETE CASCADE
);





-- ==========================================
-- 8. TABLA: flow_evaluations (Resultados finales)
-- ==========================================
CREATE TABLE usability.flow_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL, -- Reemplazar con FK a usability_sessions si corresponde
    flow_id UUID NOT NULL,
    pasos_totales INTEGER NOT NULL,
    pasos_completados INTEGER NOT NULL DEFAULT 0,
    fallos INTEGER NOT NULL DEFAULT 0,
    completado BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_total_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_eval_session FOREIGN KEY (session_id) 
        REFERENCES usability.usability_sessions (session_id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_flujo FOREIGN KEY (flow_id) 
        REFERENCES usability.flow (flow_id) ON DELETE CASCADE
);

COMMENT ON TABLE usability.flow_evaluations IS 'Resumen estadístico y de resultados de la evaluación de una sesión contra un flujo ideal';
COMMENT ON COLUMN usability.flow_evaluations.evaluation_id IS 'Identificador único de la evaluación';
COMMENT ON COLUMN usability.flow_evaluations.session_id IS 'FK de la sesión de usabilidad evaluada';
COMMENT ON COLUMN usability.flow_evaluations.flow_id IS 'FK del flujo ideal de referencia';
COMMENT ON COLUMN usability.flow_evaluations.pasos_totales IS 'Número total de pasos que componen el flujo de éxito ideal';
COMMENT ON COLUMN usability.flow_evaluations.pasos_completados IS 'Número de pasos secuenciales obligatorios completados por el usuario';
COMMENT ON COLUMN usability.flow_evaluations.fallos IS 'Número de clics o eventos erróneos que no pertenecían al flujo ideal esperado';
COMMENT ON COLUMN usability.flow_evaluations.completado IS 'Indica si el usuario logró llegar con éxito al success_node_id';
COMMENT ON COLUMN usability.flow_evaluations.tiempo_total_ms IS 'Tiempo total transcurrido durante la evaluación del flujo expresado en milisegundos';
COMMENT ON COLUMN usability.flow_evaluations.created_at IS 'Fecha y hora de cálculo del registro';




-- ==========================================
-- TABLA: figma_connections
-- ==========================================
CREATE TABLE usability.figma_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Asumiendo que tu tabla de usuarios usa UUID
    name VARCHAR(255) NOT NULL,
    personal_access_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
 
    CONSTRAINT fk_figma_connection_user FOREIGN KEY (user_id) REFERENCES auth.users (user_id) ON DELETE cascade,
    
    CONSTRAINT uq_user_connection_name UNIQUE (user_id, name)
);

COMMENT ON TABLE usability.figma_connections IS 'Almacena las credenciales y tokens de acceso personales (PAT) de Figma integrados por los usuarios';
COMMENT ON COLUMN usability.figma_connections.connection_id IS 'Identificador único interno de la conexión';
COMMENT ON COLUMN usability.figma_connections.user_id IS 'Identificador del usuario propietario de esta conexión';
COMMENT ON COLUMN usability.figma_connections.name IS 'Nombre descriptivo de la conexión (ej. "Mi Cuenta Personal", "Figma de la Empresa")';
COMMENT ON COLUMN usability.figma_connections.personal_access_token IS 'El Personal Access Token (PAT) encriptado u oculto para autenticarse contra la API de Figma';
COMMENT ON COLUMN usability.figma_connections.created_at IS 'Fecha y hora en la que el usuario vinculó esta cuenta';








-- ==========================================
-- 1. CUESTIONARIOS (contenedor: pretest o posttest de un proyecto)
-- ==========================================
CREATE TABLE usability.questionnaires (
    questionnaire_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES usability.figma_projects(project_id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('pretest', 'posttest')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. PREGUNTAS (configurables, orden y tipo definidos por el docente)
-- ==========================================
CREATE TABLE usability.questionnaire_questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES usability.questionnaires(questionnaire_id) ON DELETE CASCADE,
    order_index INT4 NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (
        question_type IN ('short_text', 'long_text', 'single_choice', 'multi_choice', 'scale', 'boolean')
    ),
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    scale_min INT2,               -- solo aplica si question_type = 'scale' (ej. 1)
    scale_max INT2,               -- ej. 7
    allow_not_applicable BOOLEAN DEFAULT FALSE, -- para el "N/A" del post-test
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. OPCIONES (solo para preguntas de tipo single_choice / multi_choice)
-- ==========================================
CREATE TABLE usability.question_options (
    option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES usability.questionnaire_questions(question_id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    order_index INT4 NOT NULL
);

-- ==========================================
-- 4. RESPUESTAS: una "sesión de respuesta" por participante y cuestionario
-- ==========================================
CREATE TABLE usability.questionnaire_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES usability.questionnaires(questionnaire_id),
    participant_id UUID NOT NULL REFERENCES auth.users (user_id),
    session_id UUID REFERENCES usability.usability_sessions(session_id), -- útil para ligar el posttest a la sesión concreta
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (questionnaire_id, participant_id, session_id)
);

-- ==========================================
-- 5. RESPUESTA A CADA PREGUNTA (genérica según el tipo)
-- ==========================================
CREATE TABLE usability.question_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES usability.questionnaire_responses(response_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES usability.questionnaire_questions(question_id),
    answer_text TEXT,             -- short_text / long_text
    selected_option_id UUID REFERENCES usability.question_options(option_id), -- single_choice
    scale_value INT2,             -- scale (ej. 1-7)
    boolean_value BOOLEAN,        -- boolean (Sí/No)
    is_not_applicable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (response_id, question_id)
);

-- ==========================================
-- 6. RESPUESTAS MÚLTIPLES (solo si question_type = 'multi_choice')
-- ==========================================
CREATE TABLE usability.question_answer_options (
    answer_id UUID NOT NULL REFERENCES usability.question_answers(answer_id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES usability.question_options(option_id),
    PRIMARY KEY (answer_id, option_id)
);




/* ============================================================================
 * TABLA: project_requirements
 * Almacena los requerimientos asociados a un proyecto.
 * Un proyecto puede tener múltiples requerimientos.
 * ============================================================================
 */
CREATE TABLE usability.project_requirements (

    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID  NULL,
    semester_id UUID NULL
    created_by UUID,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    acceptance_criteria TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_requirement_project
        FOREIGN KEY (project_id)
        REFERENCES usability.figma_projects(project_id)
        ON DELETE CASCADE

);



/* ============================================================================
 * COMENTARIOS DE LA TABLA
 * ============================================================================
 */

COMMENT ON TABLE usability.project_requirements is 'Almacena los requerimientos funcionales, no funcionales, técnicos y de negocio de cada proyecto.';

/* ============================================================================
 * COMENTARIOS DE LAS COLUMNAS
 * ============================================================================
 */

COMMENT ON COLUMN usability.project_requirements.requirement_id is 'Identificador único del requerimiento.';

COMMENT ON COLUMN usability.project_requirements.project_id is 'Proyecto al que pertenece el requerimiento.';

COMMENT ON COLUMN usability.project_requirements.created_by is 'Usuario responsable del registro del requerimiento.';

COMMENT ON COLUMN usability.project_requirements.code is 'Código único del requerimiento (RF-001, RNF-001, etc.).';

COMMENT ON COLUMN usability.project_requirements.title is 'Título o nombre corto del requerimiento.';

COMMENT ON COLUMN usability.project_requirements.description is 'Descripción detallada del requerimiento.';

COMMENT ON COLUMN usability.project_requirements.acceptance_criteria is 'Criterios de aceptación que deben cumplirse para validar el requerimiento.';

COMMENT ON COLUMN usability.project_requirements.created_at is 'Fecha y hora de creación del registro.';

COMMENT ON COLUMN usability.project_requirements.updated_at is 'Fecha y hora de la última actualización del registro.';




-- ============================================================
-- TABLA: usability.text_sentiments
-- Registra los análisis de sentimiento en texto de los comentarios
-- de los evaluadores (heurísticos o de usabilidad)
-- ============================================================

CREATE TABLE usability.text_sentiments (
    sentiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NULL REFERENCES usability.usability_sessions(session_id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    original_label VARCHAR(50) NOT NULL,
    ux_label VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL, -- 0.0000 a 1.0000
    scores_json JSONB NOT NULL, -- {"Confusión": 0.85, "Frustración": 0.05, ...}
    elapsed_ms_total INTEGER DEFAULT 0 NOT NULL,
    timestamp_real TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    author_id UUID NULL,
    CONSTRAINT fk_text_sentiments_session
        FOREIGN KEY (session_id)
        REFERENCES usability.usability_sessions(session_id)
        ON DELETE SET NULL
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice para filtrar por sesión
CREATE INDEX idx_text_sentiments_session_id ON usability.text_sentiments(session_id);
-- Índice para filtrar por etiqueta UX
CREATE INDEX idx_text_sentiments_ux_label ON usability.text_sentiments(ux_label);
-- Índice para filtrar por etiqueta original
CREATE INDEX idx_text_sentiments_original_label ON usability.text_sentiments(original_label);
-- Índice compuesto para análisis rápido
CREATE INDEX idx_text_sentiments_session_ux ON usability.text_sentiments(session_id, ux_label);

-- ============================================================
-- COMENTARIOS DE LA TABLA
-- ============================================================

COMMENT ON TABLE usability.text_sentiments IS 'Registro de análisis de sentimiento en texto (comentarios de evaluadores)';
COMMENT ON COLUMN usability.text_sentiments.sentiment_id IS 'Identificador único del análisis de sentimiento';
COMMENT ON COLUMN usability.text_sentiments.session_id IS 'ID de la sesión de usabilidad (si aplica)';
COMMENT ON COLUMN usability.text_sentiments.text IS 'Texto analizado';
COMMENT ON COLUMN usability.text_sentiments.original_label IS 'Etiqueta original del modelo BETO';
COMMENT ON COLUMN usability.text_sentiments.ux_label IS 'Categoría UX mapeada (Confusión, Frustración, etc.)';
COMMENT ON COLUMN usability.text_sentiments.confidence IS 'Confianza de la predicción (0-1)';
COMMENT ON COLUMN usability.text_sentiments.scores_json IS 'Scores de todas las categorías UX en formato JSON';
COMMENT ON COLUMN usability.text_sentiments.elapsed_ms_total IS 'Tiempo en milisegundos desde el inicio de la sesión';
COMMENT ON COLUMN usability.text_sentiments.timestamp_real IS 'Timestamp real cuando se analizó';
COMMENT ON COLUMN usability.text_sentiments.author_id IS 'ID del usuario que escribió el comentario';







-- MAPAS DE CALOR
-- ============================================================
-- TABLA: usability.heatmap_events
-- Registra todos los eventos de interacción para generar mapas de calor
-- ============================================================

CREATE TABLE usability.heatmap_events (
    -- Identificador único del evento
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con la sesión de usabilidad
    session_id UUID NOT NULL REFERENCES usability.usability_sessions(session_id) ON DELETE CASCADE,
    
    -- Relación con el proyecto (para filtrar fácilmente)
    project_id UUID NOT NULL,
    
    -- Usuario que realizó la interacción
    user_id UUID NULL,
    
    -- Tipo de evento (click, move, scroll, etc.)
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('click', 'move', 'scroll', 'dwell', 'resize')),
    
    -- Identificador de la pantalla/nodo de Figma
    node_id VARCHAR(50) NULL,
    
    -- URL o identificador de la pantalla (para proyectos sin Figma)
    screen_identifier VARCHAR(255) NULL,
    
    -- Coordenadas normalizadas (0-100)
    x_pct DECIMAL(6, 3) NOT NULL CHECK (x_pct >= 0 AND x_pct <= 100),
    y_pct DECIMAL(6, 3) NOT NULL CHECK (y_pct >= 0 AND y_pct <= 100),
    
    -- Tamaño del viewport en el momento del evento
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    
    -- Para eventos de scroll: profundidad alcanzada (0-100)
    scroll_depth INTEGER NULL CHECK (scroll_depth >= 0 AND scroll_depth <= 100),
    
    -- Selector CSS del elemento (si se puede identificar)
    element_selector TEXT NULL,
    
    -- Tiempo de permanencia en milisegundos (para dwell)
    dwell_ms INTEGER NULL,
    
    -- Timestamps
    elapsed_ms_total INTEGER NOT NULL,  -- Tiempo desde inicio de sesión
    event_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Metadatos adicionales
    user_agent TEXT NULL,
    device_type VARCHAR(20) NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser VARCHAR(50) NULL,
    
    -- Índices para consultas rápidas
    CONSTRAINT fk_heatmap_session
        FOREIGN KEY (session_id)
        REFERENCES usability.usability_sessions(session_id)
        ON DELETE CASCADE
);

-- ============================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================

-- Índice para filtrar por proyecto y nodo
CREATE INDEX idx_heatmap_project_node ON usability.heatmap_events(project_id, node_id);

-- Índice para filtrar por sesión
CREATE INDEX idx_heatmap_session ON usability.heatmap_events(session_id);

-- Índice para filtrar por tipo de evento y tiempo
CREATE INDEX idx_heatmap_type_time ON usability.heatmap_events(event_type, event_time);

-- Índice para consultas de mapa de calor (coordenadas)
CREATE INDEX idx_heatmap_coords ON usability.heatmap_events(project_id, node_id, x_pct, y_pct);

-- Índice para filtrar por dispositivo
CREATE INDEX idx_heatmap_device ON usability.heatmap_events(device_type);

-- ============================================================
-- COMENTARIOS DE LA TABLA
-- ============================================================

COMMENT ON TABLE usability.heatmap_events IS 'Eventos de interacción para generar mapas de calor de usabilidad';
COMMENT ON COLUMN usability.heatmap_events.event_id IS 'Identificador único del evento';
COMMENT ON COLUMN usability.heatmap_events.session_id IS 'ID de la sesión de usabilidad';
COMMENT ON COLUMN usability.heatmap_events.project_id IS 'ID del proyecto (para filtros rápidos)';
COMMENT ON COLUMN usability.heatmap_events.user_id IS 'ID del usuario que realizó la interacción';
COMMENT ON COLUMN usability.heatmap_events.event_type IS 'Tipo de evento: click, move, scroll, dwell, resize';
COMMENT ON COLUMN usability.heatmap_events.node_id IS 'ID del nodo de Figma (1:65, etc.)';
COMMENT ON COLUMN usability.heatmap_events.screen_identifier IS 'Identificador de la pantalla (para proyectos sin Figma)';
COMMENT ON COLUMN usability.heatmap_events.x_pct IS 'Coordenada X normalizada (0-100%)';
COMMENT ON COLUMN usability.heatmap_events.y_pct IS 'Coordenada Y normalizada (0-100%)';
COMMENT ON COLUMN usability.heatmap_events.viewport_width IS 'Ancho del viewport en el momento del evento';
COMMENT ON COLUMN usability.heatmap_events.viewport_height IS 'Alto del viewport en el momento del evento';
COMMENT ON COLUMN usability.heatmap_events.scroll_depth IS 'Profundidad de scroll alcanzada (0-100%)';
COMMENT ON COLUMN usability.heatmap_events.element_selector IS 'Selector CSS del elemento interactuado';
COMMENT ON COLUMN usability.heatmap_events.dwell_ms IS 'Tiempo de permanencia (para dwell)';
COMMENT ON COLUMN usability.heatmap_events.elapsed_ms_total IS 'Tiempo transcurrido desde inicio de sesión';
COMMENT ON COLUMN usability.heatmap_events.device_type IS 'Tipo de dispositivo: desktop, mobile, tablet';
COMMENT ON COLUMN usability.heatmap_events.browser IS 'Navegador utilizado';

-- ============================================================
-- TABLA PARA ALMACENAR IMÁGENES DE MAPAS DE CALOR GENERADOS
-- ============================================================

CREATE TABLE usability.heatmap_images (
    heatmap_image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    
    -- Configuración usada para generar el mapa
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE,
    device_type VARCHAR(20) NULL,
    min_sessions INTEGER DEFAULT 1,
    
    -- La imagen en formato base64 o URL
    image_data BYTEA,  -- Para almacenar como binario
    image_url TEXT,    -- O para almacenar una URL a un CDN
    
    -- Metadatos
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    generated_by UUID NULL,
    
    CONSTRAINT fk_heatmap_images_project
        FOREIGN KEY (project_id)
        REFERENCES usability.figma_projects(project_id)
        ON DELETE CASCADE,
    
    CONSTRAINT uq_heatmap_image UNIQUE (project_id, node_id, event_type, date_range_start, date_range_end, device_type)
);

COMMENT ON TABLE usability.heatmap_images IS 'Imágenes de mapas de calor generadas previamente';
COMMENT ON COLUMN usability.heatmap_images.image_data IS 'Imagen del mapa de calor en formato binario (PNG)';
COMMENT ON COLUMN usability.heatmap_images.image_url IS 'URL de la imagen si se almacena en CDN';



CREATE TYPE usability.expert_comment_type AS ENUM (
    'observation',
    'problem',
    'recommendation',
    'positive',
    'question'
);

CREATE TABLE usability.comment_experts (
    comment_id UUID DEFAULT gen_random_uuid() NOT NULL,
    project_id UUID NOT NULL,
    session_id UUID NULL,
    task_id UUID NULL,
    author_id UUID NULL,

    comment_type usability.expert_comment_type NOT NULL,
    comment TEXT NOT NULL,

    node_id VARCHAR(100) NULL,
    screen_identifier VARCHAR(255) NULL,

    severity SMALLINT NULL,
    elapsed_ms_total INTEGER DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT comment_experts_pkey
        PRIMARY KEY (comment_id),

    CONSTRAINT comment_experts_project_fk
        FOREIGN KEY (project_id)
        REFERENCES usability.figma_projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT comment_experts_author_fk
        FOREIGN KEY (author_id)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT comment_experts_severity_check
        CHECK (
            severity IS NULL
            OR severity BETWEEN 1 AND 4
        )
);












-- ============================================================
-- 1. CONFIGURACIÓN DE EVALUACIÓN COGNITIVA
-- ============================================================
CREATE TABLE usability.cognitive_evaluations (
    cognitive_evaluations_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES usability.figma_projects(project_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Evaluación Cognitiva - App Turismo Sucre"
    description TEXT,
    supervisor_id UUID NOT NULL REFERENCES auth.users(user_id), -- Evaluador Supervisor
    status VARCHAR(50) DEFAULT 'draft', -- draft, planning, in_progress, completed, archived
    -- Configuración general
    max_duration_minutes INTEGER DEFAULT 20, -- Tiempo máximo para todas las tareas
    target_user_description TEXT, -- "Turistas nacionales y extranjeros"
    system_description TEXT, -- "Aplicación de sistema turístico"
    -- Fechas
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. TAREAS DE LA EVALUACIÓN (vinculadas a tareas del proyecto)
-- ============================================================
CREATE TABLE usability.cognitive_evaluation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    project_task_id UUID REFERENCES usability.tasks(task_id) ON DELETE SET NULL, -- Tarea del proyecto original
    -- Datos de la tarea
    title VARCHAR(255) NOT NULL, -- "Registro con correo electrónico"
    description TEXT, -- Descripción detallada
    user_goal TEXT, -- "Contar con un registro de usuarios y perfiles"
    order_index INTEGER NOT NULL, -- Orden de realización (1-7 en el ejemplo)
    -- Estado
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. SECUENCIA DE ACCIONES PARA CADA TAREA
-- ============================================================
CREATE TABLE usability.cognitive_task_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES usability.cognitive_evaluation_tasks(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL, -- Orden del paso (1, 2, 3...)
    action_description TEXT NOT NULL, -- "Hacer clic en 'Registrarse'"
    expected_outcome TEXT, -- "Se abre el formulario de registro"
    ui_element VARCHAR(255), -- Botón, enlace, campo, etc.
    selector_path TEXT, -- Selector CSS (para integración con prototipo)
    -- Resultado esperado
    success_criteria TEXT, -- Cómo saber si la acción fue exitosa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. REGLAS DE EVALUACIÓN
-- ============================================================
CREATE TABLE usability.cognitive_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    rule_order INTEGER,
    description TEXT NOT NULL, -- "El tiempo máximo es de 20 minutos"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. ASIGNACIÓN DE EVALUADORES A LA EVALUACIÓN
-- ============================================================
CREATE TABLE usability.cognitive_evaluators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(user_id),
    evaluator_role VARCHAR(50) DEFAULT 'evaluator', -- supervisor, evaluator, observer
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    UNIQUE(evaluation_id, user_id)
);

-- ============================================================
-- 6. RESPUESTAS DEL RECORRIDO COGNITIVO (por evaluador y tarea)
-- ============================================================
CREATE TABLE usability.cognitive_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES auth.users(user_id),
    task_id UUID NOT NULL REFERENCES usability.cognitive_evaluation_tasks(id) ON DELETE CASCADE,
    action_id UUID REFERENCES usability.cognitive_task_actions(id) ON DELETE SET NULL,
    -- Respuestas del evaluador
    response_description TEXT, -- "Sencillo y directo al punto"
    system_response TEXT, -- "Funciona correctamente"
    -- Las 4 preguntas del recorrido cognitivo
    q1_will_user_try_correct_outcome VARCHAR(20), -- yes, no, uncertain
    q1_reasoning TEXT,
    q2_will_user_notice_action VARCHAR(20), -- yes, no, uncertain
    q2_reasoning TEXT,
    q3_will_user_associate_action VARCHAR(20), -- yes, no, uncertain
    q3_reasoning TEXT,
    q4_will_user_see_progress VARCHAR(20), -- yes, no, uncertain
    q4_reasoning TEXT,
    -- Problemas identificados
    problem_identified TEXT,
    design_suggestion TEXT,
    other_comments TEXT,
    -- Métricas
    time_spent_seconds INTEGER,
    success BOOLEAN, -- Si pudo completar la acción
    -- Estado
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, skipped
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. PROBLEMAS DE USABILIDAD IDENTIFICADOS (UNIFICADOS)
-- ============================================================
CREATE TABLE usability.cognitive_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- "Falta de acabado en el diseño"
    description TEXT NOT NULL, -- Descripción detallada del problema
    severity VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
    category VARCHAR(50), -- design, functionality, navigation, content, etc.
    -- Origen del problema
    reported_by UUID REFERENCES auth.users(user_id), -- Quién lo reportó originalmente
    affected_tasks TEXT[], -- IDs de tareas afectadas
    -- Estado
    status VARCHAR(50) DEFAULT 'identified', -- identified, analyzing, resolved, rejected
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. CONTRIBUCIONES Y RECOMENDACIONES (UNIFICADAS)
-- ============================================================
CREATE TABLE usability.cognitive_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    problem_id UUID REFERENCES usability.cognitive_problems(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- Tipo de solución
    recommendation_type VARCHAR(50), -- design_change, feature_addition, content_update, connectivity_improvement
    -- Prioridad
    priority VARCHAR(50) DEFAULT 'medium', -- high, medium, low
    -- Implementación
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP,
    implemented_by UUID REFERENCES auth.users(user_id),
    implementation_notes TEXT,
    -- Metadatos
    created_by UUID REFERENCES auth.users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





-- ============================================================
-- TABLA: cognitive_dashboard_summary
-- Almacena el resumen de la evaluación para el dashboard
-- ============================================================
CREATE TABLE usability.cognitive_dashboard_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    
    -- Estadísticas generales
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    in_progress_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    pending_tasks INTEGER DEFAULT 0,
    
    -- Estadísticas de evaluadores
    total_evaluators INTEGER DEFAULT 0,
    completed_evaluators INTEGER DEFAULT 0,
    pending_evaluators INTEGER DEFAULT 0,
    
    -- Estadísticas de respuestas
    total_responses INTEGER DEFAULT 0,
    completed_responses INTEGER DEFAULT 0,
    pending_responses INTEGER DEFAULT 0,
    responses_with_issues INTEGER DEFAULT 0,
    average_time_seconds INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Resumen de preguntas (4 preguntas)
    q1_yes INTEGER DEFAULT 0,
    q1_no INTEGER DEFAULT 0,
    q1_uncertain INTEGER DEFAULT 0,
    q2_yes INTEGER DEFAULT 0,
    q2_no INTEGER DEFAULT 0,
    q2_uncertain INTEGER DEFAULT 0,
    q3_yes INTEGER DEFAULT 0,
    q3_no INTEGER DEFAULT 0,
    q3_uncertain INTEGER DEFAULT 0,
    q4_yes INTEGER DEFAULT 0,
    q4_no INTEGER DEFAULT 0,
    q4_uncertain INTEGER DEFAULT 0,
    
    -- Progreso general
    progress_percentage INTEGER DEFAULT 0,
    
    -- Fechas
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_dashboard_evaluation FOREIGN KEY (evaluation_id) 
        REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    
    CONSTRAINT uq_dashboard_evaluation UNIQUE (evaluation_id)
);

COMMENT ON TABLE usability.cognitive_dashboard_summary IS 'Resumen de la evaluación cognitiva para el dashboard';

-- Índices
CREATE INDEX idx_dashboard_evaluation ON usability.cognitive_dashboard_summary(evaluation_id);
CREATE INDEX idx_dashboard_calculated ON usability.cognitive_dashboard_summary(calculated_at);









-- ============================================================
-- TABLA: cognitive_export_data
-- Almacena los datos para exportación (optimizada)
-- ============================================================
CREATE TABLE usability.cognitive_export_data (
    export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE,
    
    -- Datos de la evaluación
    evaluation_name VARCHAR(255),
    evaluation_description TEXT,
    evaluation_status VARCHAR(50),
    evaluation_started_at TIMESTAMP,
    evaluation_completed_at TIMESTAMP,
    supervisor_name VARCHAR(255),
    project_name VARCHAR(255),
    file_key VARCHAR(255),
    
    -- Datos del evaluador
    evaluator_id UUID,
    evaluator_name VARCHAR(255),
    evaluator_email VARCHAR(255),
    
    -- Datos de la tarea
    task_id UUID,
    task_title VARCHAR(255),
    task_description TEXT,
    task_order_index INTEGER,
    task_status VARCHAR(50),
    
    -- Datos de la respuesta
    response_id UUID,
    response_description TEXT,
    system_response TEXT,
    q1_answer VARCHAR(20),
    q1_reasoning TEXT,
    q2_answer VARCHAR(20),
    q2_reasoning TEXT,
    q3_answer VARCHAR(20),
    q3_reasoning TEXT,
    q4_answer VARCHAR(20),
    q4_reasoning TEXT,
    problem_identified TEXT,
    design_suggestion TEXT,
    other_comments TEXT,
    time_spent_seconds INTEGER,
    success BOOLEAN,
    response_status VARCHAR(50),
    response_created_at TIMESTAMP,
    
    -- Datos de emociones (si están disponibles)
    emotion_count INTEGER DEFAULT 0,
    dominant_emotions JSONB,
    
    -- Datos de sentimientos (si están disponibles)
    sentiment_count INTEGER DEFAULT 0,
    dominant_sentiments JSONB,
    
    -- Metadatos de exportación
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exported_by UUID REFERENCES auth.users(user_id),
    export_format VARCHAR(20) DEFAULT 'excel',
    
    CONSTRAINT fk_export_evaluation FOREIGN KEY (evaluation_id) 
        REFERENCES usability.cognitive_evaluations(cognitive_evaluations_id) ON DELETE CASCADE
);

COMMENT ON TABLE usability.cognitive_export_data IS 'Datos preparados para exportación de evaluación cognitiva';

-- Índices
CREATE INDEX idx_export_evaluation ON usability.cognitive_export_data(evaluation_id);
CREATE INDEX idx_export_evaluator ON usability.cognitive_export_data(evaluator_id);
CREATE INDEX idx_export_task ON usability.cognitive_export_data(task_id);
CREATE INDEX idx_export_exported_at ON usability.cognitive_export_data(exported_at);


-- HALLAZGOS 

CREATE TABLE usability.findings (
    finding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL,
    session_id UUID,
    task_id UUID,
    requirement_id UUID,
    flow_id UUID,
    node_id VARCHAR(255),
    version VARCHAR(50),
    
    type VARCHAR(50),
    description TEXT,
    severity VARCHAR(20),
    frequency INTEGER DEFAULT 1,
    impact VARCHAR(20),
    priority VARCHAR(20),
    recommendation TEXT,
    status VARCHAR(20),
    
    emotion_inferred VARCHAR(50),
    textual_sentiment VARCHAR(50),
    user_comment TEXT,
    expert_comment TEXT,
    user_comment_id UUID,
    expert_comment_id UUID,
    
    aggregated_from TEXT[],
    occurrences INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE usability.report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    config JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



--- *********************************
--- configuación nivel semestral 
--- ******************************
-- tabla de semestre
CREATE TABLE public.semesters (
  semester_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,           -- "1/26", "2/26", etc.
  code VARCHAR(20) UNIQUE NOT NULL,    -- "2026-1", "2026-2"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- tabla de estudiantes 
CREATE TABLE public.semester_students (
  semester_student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES public.semesters(semester_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(semester_id, user_id)
);


--- tabla de asignacion de proyectos al semestre
CREATE TABLE public.semester_projects (
  semester_project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES public.semesters(semester_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES usability.figma_projects(project_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(semester_id, project_id)
);


ALTER TABLE usability.figma_projects 
ADD COLUMN created_by UUID  NULL;



