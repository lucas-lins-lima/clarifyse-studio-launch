# Clarifyse Studio

A research management platform built with React, TypeScript, and Vite. Allows researchers to manage projects, build forms, collect responses, and analyze data.

## Architecture

- **Frontend only** — pure React SPA with no backend server
- **Router**: React Router v6 with routes for login, dashboard, projects, form builder, and respondent forms
- **State management**: Zustand stores + React Query for async state
- **UI**: Tailwind CSS + shadcn/ui components (Radix UI primitives)
- **Data**: All data managed client-side via Zustand stores

## Key Pages

- `/login` — Login page (entry point)
- `/dashboard` — Main dashboard
- `/projetos` — Projects list
- `/projetos/novo` — Create project
- `/projetos/:projectId` — Project details
- `/projetos/:projectId/formulario` — Form builder
- `/projetos/:projectId/respostas` — Project responses
- `/pesquisadores` — Researchers management
- `/r/:slug` — Public respondent form
- `/thank-you/:slug` — Thank you page after form submission

## Development

- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Replit Setup

- Workflow "Start application" runs `npm run dev` on port 5000 (webview)
- `vite.config.ts` configured with `host: "0.0.0.0"` and `allowedHosts: true` for Replit proxy compatibility
- Removed `lovable-tagger` plugin (Lovable-specific, not needed on Replit)
