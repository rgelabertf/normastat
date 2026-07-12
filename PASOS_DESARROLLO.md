# NormaStat: Guía Metodológica de Desarrollo e Implementación

Esta guía técnica detalla los fundamentos matemáticos, las decisiones de diseño y los pasos de desarrollo de ingeniería que se utilizaron para concebir y construir **NormaStat**, un entorno interactivo para el análisis y aprendizaje de pruebas de normalidad.

---

## 1. Arquitectura General de la Herramienta

NormaStat está diseñada bajo una arquitectura full-stack moderna y liviana, optimizada para ofrecer interactividad fluida, reactividad y asistencia inteligente segura:

*   **Frontend (React 18 + Vite + Tailwind CSS):** Interfaz ágil de pantalla única con soporte responsivo y dos modos visuales (Claro y Oscuro). Utiliza **Recharts** para representar histogramas con campanas de Gauss superpuestas de manera dinámica y animaciones con **motion**.
*   **Servidor Backend (Node.js + Express):** Actúa como servidor web en producción y provee un proxy seguro para el servicio **Google Gemini API**, evitando la exposición de claves secretas del lado del cliente.
*   **Motor Estadístico Local (`/src/utils/stats.ts`):** Motor escrito en TypeScript puro que calcula estadísticas descriptivas básicas y ejecuta tres pruebas estadísticas avanzadas sin depender de servidores externos, asegurando rapidez absoluta.

---

## 2. Modelos Estadísticos y Fórmulas de Decisión

La herramienta evalúa la normalidad de las muestras a través de tres pilares estadísticos complementarios:

### A. Prueba de Shapiro-Francia (Potencia)
Especialmente recomendada para muestras de tamaño mediano ($5 \le n \le 5000$). Evalúa la normalidad analizando la fuerza de la correlación lineal entre los datos ordenados de la muestra y sus cuantiles normales teóricos esperados.
$$\text{Estadístico } W' = \frac{\left( \sum a_i x_{(i)} \right)^2}{\sum (x_i - \bar{x})^2}$$
*Donde $x_{(i)}$ son los datos ordenados, y $a_i$ son ponderadores aproximados derivados de los cuantiles de una distribución normal estándar.*
*   **p-valor > 0.05:** Indica fuerte correlación lineal teórica. Se acepta la normalidad.

### B. Prueba de Kolmogorov-Smirnov con Corrección de Lilliefors (Distancia)
Compara la función de distribución acumulada empírica $F_n(x)$ de la muestra con la función de distribución acumulada teórica normal esperada $F_0(x)$.
$$\text{Estadístico } D = \sup_x |F_n(x) - F_0(x)|$$
*   **p-valor > 0.05:** La distancia máxima vertical entre las curvas es lo suficientemente pequeña para atribuirse al azar. Se acepta la normalidad.

### C. Prueba de Jarque-Bera (Momentos)
Evalúa simultáneamente si la asimetría ($S$) y la curtosis ($K$) de los datos coinciden con las de una distribución normal teórica ($S=0, K=3$).
$$\text{Estadístico } JB = \frac{n}{6} \left( S^2 + \frac{(K - 3)^2}{4} \right)$$
*   **p-valor > 0.05:** La distribución es adecuadamente simétrica y mesocúrtica. Se acepta la normalidad.

---

## 3. Desglose del Desarrollo Paso a Paso

La construcción de la herramienta se estructuró en las siguientes fases metodológicas:

### Fase 1: Estructura de Datos y Motor Estadístico
1.  Se definieron los tipos de datos principales (`/src/types.ts`) para garantizar tipado estricto en estadísticas descriptivas y resultados de tests.
2.  Se escribió el módulo autónomo de cálculo estadístico (`/src/utils/stats.ts`) que procesa la muestra para extraer la media, desviación estándar, mediana, asimetría, curtosis de momentos y estimaciones de p-valor altamente fiables para los tres tests.

### Fase 2: Interfaz Reactiva y Entrada Dinámica
1.  Se creó el componente principal (`/src/App.tsx`) con un área de texto inteligente que autodetecta formatos (datos separados por comas, espacios, tabulaciones o saltos de línea).
2.  Se incorporó un cargador de archivos locales que admite formatos `.csv` y `.txt`, junto con un selector de columnas automático si el archivo contiene múltiples variables.
3.  Se prediseñaron tres datasets de ejemplo (Estatura, Tiempo de Reacción, Notas de Exámenes) para que los usuarios puedan experimentar sin cargar archivos propios.

### Fase 3: Visualización Dinámica de Resultados
1.  Se implementó el componente gráfico (`/src/components/Chart.tsx`) que divide automáticamente el rango de datos en intervalos ajustables para graficar un histograma de frecuencias reales.
2.  Se superpuso una curva de densidad teórica que se redibuja en tiempo real al cambiar los parámetros de la muestra (media y desviación estándar), ofreciendo una validación visual intuitiva.

### Fase 4: Soporte Académico y Asistente IA
1.  Se estructuró el componente del Manual (`/src/components/Manual.tsx`) que recopila toda la fundamentación teórica de los tests y una guía detallada sobre qué camino metodológico seguir según los resultados.
2.  Se desarrolló un chatbot inteligente integrado (`/src/components/AiChat.tsx`) que consume la API de Gemini a través del proxy del backend.
3.  Se implementó en el backend (`/server.ts`) un sistema con **estrategia de fallback y retroceso exponencial (exponential backoff)**: si el modelo primario `gemini-3.5-flash` experimenta alta demanda temporal, el sistema intenta reintentar automáticamente y si es necesario utiliza un modelo secundario (`gemini-3.1-flash-lite`), asegurando alta disponibilidad frente a errores 503.

### Fase 5: Niveles de Aprendizaje (Pri / Pro)
Para balancear la profundidad teórica y la usabilidad directa, se implementó el selector de niveles en el panel superior:
*   **Nivel Pro:** Ofrece la experiencia avanzada completa. Incluye manual metodológico detallado, glosario interactivo, tooltips técnicos en los tests, el chat interactivo guiado por IA y la opción de exportar el reporte a CSV.
*   **Nivel Pri (Principiante):** Oculta la complejidad teórica innecesaria. Muestra los estadísticos descriptivos esenciales de manera directa y expone de forma clara la **Regla de Decisión de Normalidad** y recomendaciones directas de uso (pruebas paramétricas frente a no paramétricas) para facilitar la toma rápida de decisiones.

### Fase 6: Sistema de Exportación de Resultados
1.  **Exportar a CSV (Nivel Pro):** Genera un archivo estructurado y ordenado que se descarga localmente, conteniendo metadatos del análisis, estadísticos descriptivos detallados, veredictos de normalidad, recomendaciones del camino metodológico a seguir y la lista de datos ordenados.
2.  **Exportar Reporte HTML Independiente (Disponible en ambos niveles):** Genera y descarga un documento `.html` de código autocontenido con Tailwind embebido, que permite guardar de forma permanente y visualizar el informe interactivo de normalidad en cualquier navegador, incluso sin conexión a internet.

---

## 4. Estructura de Archivos del Proyecto

El código fuente de NormaStat se organiza de la siguiente manera:

```text
├── package.json               # Configuración de dependencias, scripts de dev y compilación
├── server.ts                  # Servidor Express, proxy seguro para Gemini con fallback de modelos
├── PASOS_DESARROLLO.md        # Esta guía metodológica y documentación del sistema
├── src/
│   ├── main.tsx               # Punto de entrada de la aplicación React
│   ├── App.tsx                # Layout principal, control de estados de niveles y flujo de trabajo
│   ├── types.ts               # Definición de tipos de TypeScript compartidos
│   ├── index.css              # Estilos globales y temas (Oscuro/Claro) mediante Tailwind CSS
│   ├── utils/
│   │   └── stats.ts           # Algoritmos de cálculo descriptivo y p-valores de normalidad
│   └── components/
│       ├── AiChat.tsx         # Componente de chat asistido para preguntas estadísticas
│       ├── Chart.tsx          # Gráfico dinámico de histograma y curva normal con Recharts
│       ├── Tooltip.tsx        # Notas explicativas emergentes de conceptos estadísticos
│       ├── Manual.tsx         # Manual metodológico de aprendizaje de normalidad
│       └── ExportHTML.ts      # Generador de reportes interactivos offline en formato HTML
```
