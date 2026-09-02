# 🚀 Guía Rápida: Desplegar el Microservicio en Cloudflare (Gratis)

Este microservicio permite que tu panel (`panel-prensa.html`) publique noticias y fotos directamente a GitHub usando únicamente una **Contraseña de Administrador**, sin tener que ingresar ningún token en tu navegador.

---

### Paso 1: Crear el Worker en Cloudflare
1. Entra a [https://dash.cloudflare.com](https://dash.cloudflare.com) (inicia sesión o crea una cuenta gratuita si no tienes una).
2. En el menú lateral izquierdo, haz clic en **Workers & Pages**.
3. Haz clic en el botón azul **Create application** (o **Crear aplicación**) ➔ **Create Worker** (o **Crear Worker**).
4. Asigna un nombre (ejemplo: `premilitar-prensa-api`) y presiona **Deploy** (o **Desplegar**).

---

### Paso 2: Pegar el Código del Worker
1. En la pantalla de tu nuevo Worker, haz clic en el botón **Edit code** (o **Editar código**).
2. Borra todo el código que viene por defecto y **pega exactamente todo el contenido del archivo:**
   👉 [`serverless/worker.js`](./worker.js)
3. Haz clic arriba a la derecha en **Deploy** (o **Desplegar**).

---

### Paso 3: Configurar las 2 Claves Secretas
1. Vuelve a la página principal de tu Worker (haz clic en el nombre del worker arriba a la izquierda).
2. Ve a la pestaña **Settings** (o **Configuración**) ➔ en el submenú haz clic en **Variables and Secrets** (o **Variables y secretos**).
3. En la sección **Variables y secretos**, haz clic en **Add** (o **Añadir**) para crear dos variables:

   * **Variable 1:**
     - **Variable name:** `ADMIN_PASSWORD`
     - **Value:** La contraseña que tú elijas para publicar tus noticias (ejemplo: `Liceo2026!Prensa`).
     - Haz clic en **Encrypt** (para que quede cifrada y oculta).

   * **Variable 2:**
     - **Variable name:** `GITHUB_TOKEN`
     - **Value:** Tu token de GitHub (`ghp_...`) que tiene permisos de `repo`.
     - Haz clic en **Encrypt**.

4. Presiona **Deploy** o **Save and Deploy**.

---

### Paso 4: Conectar tu Panel
1. En la página de tu Worker, copia la URL que Cloudflare te dio arriba (se ve como `https://premilitar-prensa-api.tu-usuario.workers.dev`).
2. Abre tu panel: `panel-prensa.html`.
3. Haz clic en el botón **🔐 Conexión Segura** (arriba a la derecha).
4. Pega la **URL de tu Worker** y escribe tu **Contraseña de Administrador**.
5. Haz clic en **Guardar Credenciales**.
6. Verás el punto verde 🟢 encendido. ¡Listo! Ya puedes redactar y subir tus noticias con un solo clic sin necesidad de volver a usar tokens.

