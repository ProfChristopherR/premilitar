# Ejemplo Práctico: Habilidad de Despliegue de Aplicación

Este archivo muestra cómo luce una habilidad real y bien estructurada siguiendo las normas de Antigravity.

---

```markdown
---
name: despliegue-staging
description: >-
  Guía y ejecuta el proceso de construcción, empaquetado y despliegue del proyecto en el entorno de staging. Utiliza esta habilidad cuando el usuario pida desplegar, publicar o verificar una versión en staging.
---

# Despliegue en Entorno de Staging

Este procedimiento automatiza las verificaciones previas, compilación de artefactos y subida al servidor de pruebas (staging).

---

## Prerrequisitos

- Node.js versión 18 o superior instalado.
- Acceso a las credenciales configuradas en `.env.staging`.
- Cliente SSH o CLI de la nube configurado.

---

## Flujo de Trabajo

### Paso 1: Verificación de Pruebas y Linters
Antes de compilar, valida la integridad del código:
```bash
npm run lint
npm run test:ci
```
*Si alguno de estos comandos falla, detén el despliegue e informa los errores al usuario.*

### Paso 2: Compilación de Producción
Genera el paquete optimizado:
```bash
npm run build:staging
```
Verifica que se haya generado el directorio `dist/` con los archivos estáticos.

### Paso 3: Despliegue a Staging
Ejecuta el script de sincronización con el servidor:
- [Script de Sincronización](./scripts/sync-staging.sh)
O mediante el comando CLI:
```bash
rsync -avz --delete ./dist/ deploy@staging.ejemplo.com:/var/www/html/
```

### Paso 4: Comprobación de Salud (Healthcheck)
Consulta el endpoint de salud del entorno de staging:
```bash
curl -f -s https://staging.ejemplo.com/api/health
```
Verifica que la respuesta sea `{"status": "ok"}`.

---

## Solución de Problemas Comunes

- **Error 502 Bad Gateway**: Revisa el servicio con `ssh deploy@staging.ejemplo.com "pm2 status"`.
- **Fallo de CORS**: Verifica las variables en `.env.staging`.
```
