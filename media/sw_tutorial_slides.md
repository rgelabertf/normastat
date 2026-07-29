---
marp: true
theme: uncover
class:
  - lead
  - invert
paginate: true
backgroundColor: #0F1115
color: "#E2E8F0"
---

<!-- _class: lead invert -->

# Shapiro-Wilk
## El Guardián de la Normalidad

Entendiendo la prueba estadística más usada para evaluar distribuciones normales

---

# ¿Por qué importa la normalidad?

- **Datos normales** → Pruebas paramétricas (t de Student, ANOVA, Pearson)
- **Datos no normales** → Pruebas no paramétricas (Mann-Whitney, Wilcoxon, Spearman)

> Elegir mal la prueba = conclusiones incorrectas

---

# ¿Qué mide Shapiro-Wilk?

![bg right:50% 80%](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Linear_regression.svg/440px-Linear_regression.svg.png)

**Una idea simple: correlación**

Shapiro-Wilk mide qué tan **correlacionados** están tus datos ordenados con los valores que esperarías bajo una distribución normal perfecta.

**W** = correlación² entre observado y esperado

---

# El proceso paso a paso

1. **Ordenar** los datos de menor a mayor
2. **Generar** los cuantiles teóricos normales esperados
3. **Emparejar** cada dato con su cuantil
4. **Calcular** la correlación entre ambas listas → **W**
5. **Obtener** el p-valor para la decisión final

---

# Paso 1: Ordenar datos

| Datos originales | Datos ordenados |
|:---:|:---:|
| 173.1, 168.4, 169.5, 175.2 ... | 160.2, 161.4, 162.8, 163.1 ... |

> El ordenamiento es obligatorio porque cada posición se emparejará con un cuantil teórico específico

---

# Paso 2: Cuantiles teóricos

Para una muestra de tamaño _n_, el cuantil esperado para la observación _i-ésima_ es:

$$z_i = \Phi^{-1}\left(\frac{i - 0.375}{n + 0.25}\right)$$

Donde $\Phi^{-1}$ es la inversa de la normal estándar

> Estos son los valores que "deberían" tener si fueran normales perfectos

---

# Paso 3: QQ-plot

![bg right:45% 80%](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Normal_normal_qq.svg/440px-Normal_normal_qq.svg.png)

**Observado vs. Esperado**

- Eje X: Cuantiles teóricos normales
- Eje Y: Datos observados ordenados
- Si forman una línea recta → **normalidad**

> El coeficiente de correlación _r_ entre estos puntos = la base de W

---

# Paso 4: El estadístico W

$$W = \frac{(\sum a_i x_{(i)})^2}{\sum (x_i - \bar{x})^2}$$

Donde $a_i$ son los coeficientes derivados de los cuantiles teóricos

**Interpretación:**
- $W \approx 1$ → Datos normales
- $W \ll 1$ → Datos no normales

> W es simplemente la correlación al cuadrado entre tus datos y la normal teórica

---

# Paso 5: El p-valor

**p > 0.05** → No rechazamos normalidad ✅
**p ≤ 0.05** → Rechazamos normalidad ❌

| W | p-valor | Decisión |
|:---:|:---:|:---:|
| 0.987 | 0.423 | Normal ✓ |
| 0.832 | 0.002 | No normal ✗ |

---

# Fortalezas y limitaciones

| ✅ Fortalezas | ⚠ Limitaciones |
|---|---|
| Prueba más potente para n < 50 | Hípersensible con n > 5000 |
| Funciona bien hasta n ≈ 5000 | Asume datos continuos |
| Ampliamente aceptada en ciencia | Sensible a valores atípicos |

> Siempre combínala con gráficos: histograma + QQ-plot

---

# Recomendaciones prácticas

1. **Usa Shapiro-Wilk** como prueba principal para n entre 5 y 5000
2. **Complementa** con Kolmogorov-Smirnov y Jarque-Bera
3. **Visualiza** siempre con histograma y QQ-plot
4. **Si 2 de 3 pruebas coinciden**, esa es tu respuesta
5. **Nunca** tomes decisiones solo con el p-valor, mira los datos

---

# Demo interactiva

![bg right:50% 100%](https://placehold.co/600x400/1E293B/3B82F6?text=NormaStat+App)

**Abre la aplicación NormaStat:**

1. Ve a la pestaña **Tutorial SW**
2. Explora los pasos animados
3. Activa **Modo Interactivo**
4. Mueve los datos y observa cómo cambia W

> https://normastat.vercel.app

---

<!-- _class: lead invert -->

# La estadística no es magia. Es hacer preguntas precisas.

$W \approx 1 \rightarrow \text{Normal}$
$W \ll 1 \rightarrow \text{Investiga}$

**NormaStat** — Evaluador Avanzado de Normalidad
Rolando Gelabert Fernández © 2026
