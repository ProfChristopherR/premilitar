# Guía de Buenas Prácticas para Habilidades en Antigravity

Esta guía recopila las mejores prácticas recomendadas para diseñar habilidades robustas, eficientes y modulares.

---

## 1. Divulgación Progresiva (Progressive Disclosure)

Antigravity inyecta únicamente el **nombre** y la **descripción** de las habilidades en el contexto inicial del modelo. El contenido completo de `SKILL.md` solo se carga cuando el modelo decide activar la habilidad.

Para optimizar el uso de tokens y la efectividad:
- Mantén el `SKILL.md` enfocado en el flujo de trabajo directo.
- Si hay especificaciones de API, manuales extensos o tablas gigantescas, colócalos en la carpeta `references/`.
- Enlaza estos documentos de referencia desde el `SKILL.md` mediante rutas relativas (`[Guía de API](./references/api-docs.md)`). El agente solo los leerá si necesita profundizar.

---

## 2. Redacción de Descripciones y Triggers

La descripción en el frontmatter YAML es el elemento más determinante para que el agente reconozca cuándo usar una habilidad:

- **Escribe en tercera persona:**
  - *Correcto:* `"Utiliza esta habilidad cuando el usuario solicite auditar dependencias de seguridad con npm audit..."`
  - *Incorrecto:* `"Esta habilidad es mía y la uso para auditar..."`
- **Incluye palabras clave relevantes:** Acciones (crear, probar, compilar, desplegar, auditar), nombres de frameworks o herramientas (Docker, Kubernetes, Vite, Next.js, Jest, etc.).
- **Sé explícito sobre el contexto:** Especifica condiciones bajo las cuales NO se debe usar si pudiera haber ambigüedad.

---

## 3. Modularización y Carpetas Opcionales

| Directorio | Propósito Recomendado |
| :--- | :--- |
| `scripts/` | Scripts automatizados en Bash, PowerShell o Python para tareas que requieren múltiples comandos complejos o repetitivos. |
| `references/` | Manuales de arquitectura, referencias de APIs, diagramas y listas de errores conocidos. |
| `resources/` | Plantillas de código, esqueletos de configuración (`.json`, `.yaml`), assets estáticos. |
| `examples/` | Casos de uso reales, entradas y salidas esperadas, respuestas de ejemplo. |

---

## 4. Validación y Robustez

- **Instrucciones unívocas:** Evita la ambigüedad en los comandos. Especifica parámetros recomendados y banderas de seguridad (ej. `--dry-run`, `--force=false`).
- **Verificación obligatoria:** Siempre indica cómo verificar el éxito de la operación (códigos de salida, salidas en consola esperadas, inspección de archivos generados).
- **Manejo de errores comunes:** Documenta qué hacer si un paso falla comúnmente (por ejemplo: falta de permisos, puertos ocupados o dependencias desactualizadas).
