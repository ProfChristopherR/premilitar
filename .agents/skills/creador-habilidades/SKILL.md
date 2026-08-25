---
name: creador-habilidades
description: >-
  Guía y asiste en la creación, diseño, estructuración y validación de nuevas habilidades (skills) para Antigravity en español. Utiliza esta habilidad cuando el usuario solicite crear, generar, estructurar o documentar una nueva skill.
---

# Creador de Habilidades (Skill Creator)

Esta habilidad guía al agente y al usuario en el proceso completo para concebir, redactar, organizar y validar nuevas habilidades personalizadas en Antigravity.

---

## Estructura Estándar de una Habilidad

Cada habilidad debe residir en su propio directorio dentro de la raíz de personalizaciones:
- **A nivel de proyecto (recomendado):** `.agents/skills/<nombre-habilidad>/`
- **A nivel global:** `~/.gemini/config/skills/<nombre-habilidad>/`

```text
.agents/skills/<nombre-habilidad>/
├── SKILL.md                 # Obligatorio: Archivo principal de instrucciones con frontmatter YAML
├── scripts/                 # Opcional: Scripts ejecutables y utilidades de soporte (bash, python, powershell)
├── examples/                # Opcional: Ejemplos de referencia y casos de uso
├── resources/               # Opcional: Plantillas, esquemas o assets adicionales
└── references/              # Opcional: Documentación extensa y manuales técnicos
```

---

## Flujo de Trabajo para Crear una Habilidad

Sigue estos 5 pasos ordenados:

### Paso 1: Definir el Alcance y Nombre
- **Nombre (`name`)**: Debe ser único, en minúsculas y separado por guiones (kebab-case), por ejemplo: `despliegue-produccion`, `analisis-seguridad`.
- **Propósito**: Define claramente qué problema resuelve y qué procedimiento automatiza.

### Paso 2: Redactar el Frontmatter YAML
El frontmatter al inicio del `SKILL.md` es **crítico**, ya que el agente lo lee para decidir si activa o no la habilidad:

```markdown
---
name: <nombre-de-la-habilidad>
description: >-
  Describe con precisión qué hace la habilidad y en qué situaciones el agente debe activarla. Redactar siempre en tercera persona. Ejemplo: "Utiliza esta habilidad cuando el usuario solicite ejecutar pruebas de regresión en el módulo de pagos."
---
```

### Paso 3: Redactar las Instrucciones en `SKILL.md`
- **Resumen conciso**: Explicación breve del objetivo.
- **Prerrequisitos**: Herramientas, variables de entorno o dependencias necesarias.
- **Instrucciones paso a paso**: Pasos claros, secuenciales y accionables.
- **Pasos de Verificación**: Cómo comprobar que cada paso se ejecutó con éxito.

> [!TIP]
> Aplica el principio de **Divulgación Progresiva**: Mantén el archivo `SKILL.md` ligero y conciso. Mueve la documentación extensa o manuales a `references/` y enlaza los archivos usando rutas relativas.

### Paso 4: Agregar Recursos y Scripts (Opcional)
- Si la habilidad requiere automatizar comandos complejos, colócalos en `scripts/`.
- Si requiere plantillas reutilizables, colócalas en `resources/`.
- Si requiere ejemplos prácticos, colócalos en `examples/`.

### Paso 5: Validar la Habilidad
Revisa la lista de verificación:
- [ ] El nombre en el frontmatter coincide con el nombre del directorio (o es representativo).
- [ ] La descripción está redactada en tercera persona y especifica los desencadenantes (triggers) exactos.
- [ ] Todos los enlaces relativos a `scripts/`, `references/` o `resources/` son válidos.
- [ ] Incluye pasos explícitos de verificación de resultados.

---

## Enlaces y Recursos de Referencia

- [Plantilla Base para SKILL.md](./resources/plantilla-SKILL.md)
- [Guía de Buenas Prácticas y Consejos](./references/guia-buenas-practicas.md)
- [Ejemplo de Habilidad Completa](./examples/ejemplo-habilidad-workflow.md)
