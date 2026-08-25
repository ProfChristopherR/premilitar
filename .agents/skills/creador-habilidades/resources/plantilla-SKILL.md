# Plantilla Estándar para SKILL.md

Copia este bloque como base para tu nuevo archivo `SKILL.md`:

```markdown
---
name: nombre-de-la-habilidad
description: >-
  Describe claramente qué hace esta habilidad y cuándo debe ser utilizada por el agente. Redacta en tercera persona. Ejemplo: "Utiliza esta habilidad cuando el usuario pida desplegar, auditar o depurar el servicio X."
---

# Nombre de la Habilidad

Descripción general del objetivo y valor de esta habilidad.

---

## Prerrequisitos

- Lista de dependencias o herramientas requeridas (ej. Node.js >= 18, Docker, Python 3.10+).
- Variables de entorno o credenciales necesarias.

---

## Procedimiento Paso a Paso

### Paso 1: Preparación / Diagnóstico
Instrucciones detalladas del primer paso.
- Comando de ejemplo: `npm run check`
- Script de apoyo si aplica: [script_preparacion.sh](./scripts/script_preparacion.sh)

### Paso 2: Ejecución Principal
Instrucciones del procedimiento clave.
- Comando de ejemplo: `npm run build`

### Paso 3: Verificación y Validación
Cómo comprobar que todo finalizó correctamente.
- Comprobar logs o estado: `cat output.log`
- Pruebas automáticas: `npm test`

---

## Recursos Adicionales

- [Documentación Técnica Detallada](./references/documentacion-tecnica.md)
- [Ejemplos de Entrada/Salida](./examples/ejemplos.md)
```
