# NormaStat

Entorno interactivo para el análisis y aprendizaje de pruebas de normalidad estadística. Diseñado para estudiantes y profesionales que necesitan evaluar rápidamente si un conjunto de datos sigue una distribución normal.

**→ https://normastat.vercel.app**

## Funcionalidades

- Tres pruebas de normalidad: Shapiro-Francia, Kolmogorov-Smirnov (Lilliefors) y Jarque-Bera
- Histograma interactivo con superposición de curva normal teórica y KDE empírica (activables por el usuario)
- Estadísticos descriptivos: media, desviación estándar, mediana, asimetría, curtosis
- Dos niveles de profundidad: Pri (principiante) y Pro (profesional)
- Asistente IA integrado (Gemini API) para resolver dudas estadísticas
- Exportación a CSV (reporte completo)
- Exportación a HTML autónomo (funciona sin internet)
- Temas claro y oscuro
- Carga de datos por copiar-pegar o archivo CSV/TXT
- Datasets de ejemplo precargados

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend (local):** Node.js + Express
- **Serverless (producción):** Vercel Functions
- **IA:** Google Gemini API (con fallback automático entre modelos)
- **Gráficos:** SVG nativo con Recharts

## Uso Online

Los estudiantes solo necesitan abrir el enlace en cualquier navegador moderno. El asistente IA funciona sin configuración adicional.

## Desarrollo Local

```bash
npm install
# Crear .env.local con GEMINI_API_KEY=tu_clave
npm run dev
```

## Despliegue

El proyecto está configurado para Vercel. Cualquier push a `master` en GitHub dispara un deploy automático:

```bash
git push origin master
```
