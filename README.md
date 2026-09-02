# EduPlatform Frontend

Frontend Vue 3 + TypeScript para el sistema de autenticación multi-rol.

## Stack

- **Vue 3** + Composition API + `<script setup>`
- **TypeScript** — tipado estricto en toda la app
- **Vue Router 4** — con guards de autenticación y control por rol
- **Pinia** — stores para auth, users y roles
- **Axios** — cliente HTTP con interceptors JWT (auto-refresh)
- **Tailwind CSS** — utilidades + capa de componentes personalizada

## Estructura

```
src/
├── api/          # Servicios HTTP por recurso
├── assets/       # CSS global (Tailwind)
├── components/
│   ├── common/   # Componentes reutilizables (StatCard, UserModal)
│   └── layout/   # AppLayout, AppSidebar, AppTopbar
├── composables/  # usePermissions, useToast
├── router/       # Rutas con meta roles y guards
├── stores/       # Pinia: auth, users, roles
├── types/        # Interfaces TypeScript
└── views/
    ├── auth/     # Login, Profile
    ├── dashboard/ # Hub de bienvenida por rol
    └── roles/    # Vista específica para cada rol
```

## Roles soportados

| Rol              | Ruta          |
|------------------|---------------|
| administrador    | /admin        |
| coordinador      | /coordinador  |
| docente          | /docente      |
| estudiante       | /estudiante   |
| experto UX       | /ux           |
| moderador        | /moderador    |
| observador       | /observador   |
| especialista IA  | /ia           |
| responsable ético| /etico        |

## Configuración

```bash
cp .env.example .env
# Edita VITE_API_URL si el backend no corre en localhost:3000
```

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
