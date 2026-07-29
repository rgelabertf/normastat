# Guion de Video: El Secreto de Shapiro-Wilk (6-9 min)

**Formato:** Dos columnas (Narración / Visual)
**Público:** Estudiantes universitarios con bases débiles en estadística
**Registro:** Hablado, conversacional — lee en voz alta para verificar fluidez
**Duración estimada:** ~8 minutos

---

## Escena 1: La Pregunta — ¿Son mis datos normales? (0:00–1:15)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "Imagina que acabas de recolectar datos para tu primer proyecto de estadística. Mediste algo — estaturas, tiempos de reacción, calificaciones. Y ahora viene la pregunta clave: ¿tus datos se comportan como una curva normal?" | Pantalla dividida: izquierda datos numéricos en una hoja, derecha una campana de Gauss animada |
| "Saber esto define TODO lo que viene después. Si tus datos son normales, puedes usar pruebas paramétricas — t de Student, ANOVA, correlación de Pearson. Si no, toca usar alternativas no paramétricas." | Animación: un camino se bifurca. Izquierda: "Paramétrico ✓", derecha: "No paramétrico ⚠" |
| "Hay varias pruebas para responder esto. Pero hay una que los estadísticos consideran la más poderosa, la más confiable especialmente con muestras pequeñas: la prueba de **Shapiro-Wilk**." | Aparece: "Shapiro-Wilk" con letras grandes. Pequeño texto: "Shapiro & Wilk, 1965" |
| "Pero, ¿cómo funciona realmente? No necesitas memorizar la fórmula. Necesitas entender la idea detrás. Y esa idea se llama **correlación**." | Animación: las letras S-W se transforman en el símbolo W |

---

## Escena 2: La Idea Central — Correlación con la Normalidad (1:15–2:30)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "Aquí está el truco: Shapiro-Wilk mide qué tan bien se alinean tus datos con una línea recta imaginaria. La línea que representa la normalidad perfecta." | Animación: eje X y Y. Aparece una línea diagonal punteada — la "línea normal" |
| "Primero, ordenamos tus datos del más pequeño al más grande. Paso obligatorio." | Números desordenados se reordenan en una columna ordenada |
| "Segundo, calculamos qué valores esperaríamos si tus datos fueran perfectamente normales. Esto no es magia — usamos los cuantiles teóricos de la normal estándar." | Al lado de cada dato ordenado aparece un "valor esperado". Barra lateral: "Cuantiles teóricos" |
| "Ahora tenemos dos listas emparejadas. Tus datos observados ordenados, y los valores que esperaríamos bajo una normal perfecta." | Dos columnas lado a lado con flechas conectando cada par |
| "Si tus datos son normales, estas dos listas serán casi iguales. Si no, se separarán. Shapiro-Wilk mide qué tanto se parecen usando... la correlación." | Aparece el coeficiente de correlación r entre ambas listas |

---

## Escena 3: El Estadístico W (2:30–4:30)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "El estadístico W es simplemente la correlación al cuadrado entre tus datos observados y los cuantiles teóricos normales." | Fórmula: W = r². Animación: las variables se explican una a una |
| "W siempre está entre 0 y 1. Si tus datos son perfectamente normales, W es exactamente 1. Entre más se aleje de 1, menos normales son." | Barra horizontal tipo termómetro: 0 ←———→ 1. El marcador se mueve según los datos |
| "Pongamos un ejemplo concreto. Aquí tenemos 20 estaturas de estudiantes universitarios." | Aparecen 20 puntos de datos. Animación: se ordenan |
| "Calculamos los cuantiles teóricos. Emparejamos. Y ahora... dibujamos." | Los puntos se grafican en un QQ-plot: eje X = cuantiles teóricos, eje Y = datos observados |
| "Mira cómo los puntos forman una línea recta casi perfecta. Eso es normalidad. La correlación es altísima." | Aparece línea de mejor ajuste. Valor de W = 0.987 |
| "¿Y datos no normales? Miremos estos tiempos de reacción. Típicamente tienen sesgo positivo — algunas personas tardan mucho más." | Cambia a datos sesgados. El QQ-plot se curva hacia arriba en los extremos |
| "Los puntos se curvan, se desvían de la línea. W es mucho más bajo. El p-valor nos dirá si es significativo." | W = 0.832. Aparece p-valor: p < 0.001 |

---

## Escena 4: El p-valor — ¿Cuánto es suficiente? (4:30–5:45)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "W nos dice la magnitud. Pero necesitamos una regla de decisión. Ahí entra el p-valor." | Aparece un cartel: "¿Qué es el p-valor?" |
| "El p-valor responde: si estos datos vinieran de una población normal, ¿qué probabilidad hay de obtener un W tan bajo como el que observamos?" | Animación: un ejército de muestras normales. Sólo unas pocas tienen W tan bajo |
| "Si esa probabilidad es menor a 0.05 (5 de cada 100), decimos que hay evidencia suficiente para rechazar la normalidad." | Destaca: "p < 0.05 → Rechazamos normalidad" en rojo |
| "Si es mayor a 0.05, no tenemos evidencia suficiente para decir que no son normales. Asumimos normalidad." | "p > 0.05 → Normalidad asumida" en verde |
| "Importante: no rechazar normalidad NO es lo mismo que probar normalidad. Solo significa que no vimos evidencia en contra." | Cartel de advertencia: "Ausencia de evidencia ≠ Evidencia de ausencia" |

---

## Escena 5: Limitaciones y Cuándo Usarlo (5:45–7:15)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "Shapiro-Wilk es poderoso, pero no perfecto. ¿Sabes cuándo funciona mejor?" | Aparecen iconos de virtudes |
| "Con muestras pequeñas y medianas (entre 3 y 5000 datos) es la prueba más potente. Pero con muestras enormes, detecta cualquier desviación minúscula que quizás no importa en la práctica." | Tabla: "n < 50 → Excelente. n 50-500 → Muy bueno. n > 5000 → Hípersensible" |
| "Otra limitación: asume que los datos son continuos y no tienen valores repetidos excesivos. Y es sensible a valores atípicos." | Advertencias visuales |
| "¿La recomendación? Úsalo siempre en combinación con un gráfico. El histograma y el QQ-plot te dan contexto. El p-valor te da el veredicto numérico. Los dos juntos te dan la historia completa." | Tres paneles: histograma + QQ-plot + tabla de p-valor |
| "Y aquí está la regla de oro: si al menos 2 de 3 pruebas de normalidad coinciden, toma esa decisión. No te cases con un solo resultado." | Aparece el veredicto final de NormaStat |

---

## Escena 6: Cierre Interactivo (7:15–8:00)

| 🎙 Narración | 🎬 Visual |
|---|---|
| "Ahora te toca a ti. En la aplicación NormaStat, abre el Tutorial Interactivo. Juega con los datos. Mueve los puntos. Mira cómo cambia W en tiempo real." | Captura del botón "Tutorial SW" en la interfaz |
| "Prueba con los datos normales, luego con los sesgados, los bimodales, los uniformes. Observa el patrón en el QQ-plot." | Secuencia rápida mostrando los 4 datasets de ejemplo |
| "La estadística no es magia. Es una forma de hacer preguntas precisas a tus datos. Shapiro-Wilk solo te da una respuesta. Tú eres quien le da sentido." | Fundido a negro con la frase: "W ≈ 1 → Normal. W ≪ 1 → Investiga." |
| "Si tienes dudas, el chat de IA está disponible para aclarar cualquier concepto. Buena suerte con tu análisis." | Logo de NormaStat + enlace |

---

## Notas de Producción

- **Ritmo:** Pausado entre escenas clave. Usa silencios de 1-2s después de mostrar W o p-valor.
- **[VERIFY]:** Todos los valores de W, p, y datasets de ejemplo corresponden a los simulados en la app. Verificar coherencia antes de grabar.
- **Accesibilidad:** En cada escena, la narración describe lo que se ve en pantalla. Nunca digas "esta gráfica" sin describirla.
- **Transcripción:** Este guion debe generar un archivo .srt para subtítulos incrustados.

---

## Resumen de Tiempos

| Escena | Duración | Acumulado |
|--------|----------|-----------|
| 1. La pregunta | 1:15 | 1:15 |
| 2. La idea central | 1:15 | 2:30 |
| 3. El estadístico W | 2:00 | 4:30 |
| 4. El p-valor | 1:15 | 5:45 |
| 5. Limitaciones | 1:30 | 7:15 |
| 6. Cierre interactivo | 0:45 | 8:00 |
