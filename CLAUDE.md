# CLAUDE.md

Memoria de proyecto para Claude Code. Leé esto antes de tocar nada y respetalo en todas las fases.

> **Reemplazá `NUEVO_DOMINIO`** por el dominio real en todos los archivos antes del deploy.

---

## 1. Qué es este proyecto

Clon **pixel-perfect** del sitio one-page `https://luzasesoramientocl.com.ar/` (WordPress + Elementor, consultora contable/legal de La Plata) convertido en un **sitio estático** servido en `https://NUEVO_DOMINIO/cont-leg-test/`.

No es un rediseño ni una reconstrucción: se **espeja** el HTML/CSS/JS ya renderizado (incluidos assets de Elementor, fuentes e imágenes) y se reescriben las rutas. La única parte dinámica es el formulario de contacto, resuelto con un único endpoint PHP.

---

## 2. Stack (definido — no proponer alternativas)

- **Sin framework ni SSG** (nada de Astro, Eleventy, Next, etc.). Es un one-page; un build pelearía contra el espejado y contra el deploy (que no ejecuta build).
- Contenido: **HTML/CSS/JS estático**.
- Formulario: **un solo `api/contact.php`** con **PHPMailer** vía SMTP.
- Dependencias PHP: **PHPMailer por Composer**, con **`vendor/` commiteado** (deploy sin build).
- Servidor de producción: **Donweb hosting tradicional (cPanel), PHP 8.3 FPM**.
- Local: **Docker** (`php:8.3-apache` + **Mailpit**) orquestado con **mise**. No instalar nada global.

---

## 3. Reglas duras (NO violar)

1. **La raíz del repo == la carpeta servida en `/cont-leg-test/`.** No crear otra carpeta `cont-leg-test/` anidada dentro del repo.
2. **Todas las rutas son RELATIVAS** (`assets/...`, `./api/contact.php`). Nunca rutas desde raíz (`/assets/...`) ni URLs absolutas al dominio viejo.
3. **No rediseñar.** Mantener fidelidad visual y responsive EXACTOS. Conservar los breakpoints de Elementor: escritorio, tablet (≤1024px) y móvil (≤767px). Conservar el CSS/JS de Elementor (sliders, animaciones, separadores).
4. **Deploy sin build:** push a `main` → webhook → `git pull` en el server. Lo que está commiteado se sirve tal cual. Por eso `vendor/` SÍ se commitea.
5. **`api/config.php` nunca se commitea** (lleva credenciales SMTP). Se crea por entorno: Mailpit en local, SMTP real en el server. El repo solo trae `api/config.example.php`.
6. **Entorno de prueba:** mantener `<meta name="robots" content="noindex,nofollow">` y `robots.txt` con `Disallow: /` hasta que el sitio sea definitivo.
7. **`canonical` y `og:url`** apuntan al dominio NUEVO: `https://NUEVO_DOMINIO/cont-leg-test/` (no al de origen).
8. No tocar `api/contact.php` ni `assets/js/contact.js` salvo pedido explícito: ya están provistos y acordados.

---

## 4. Estructura del repositorio 

```
cont-leg-test/                  ← raíz del repo == carpeta servida en /cont-leg-test/
├── index.html                  ← one-page espejado y limpiado
├── assets/
│   ├── css/                    ← estilos (Elementor + globales + contact-form.css)
│   ├── js/                     ← JS (Elementor + contact.js)
│   ├── img/                    ← imágenes (wp-content/uploads, separadores, íconos)
│   └── fonts/                  ← fuentes locales (Google Fonts descargadas)
├── api/
│   ├── contact.php             ← handler del formulario (PHPMailer/SMTP)
│   ├── config.example.php      ← plantilla (SÍ se commitea)
│   └── config.php              ← credenciales reales (NO se commitea)
├── vendor/                     ← PHPMailer (SÍ se commitea)
├── composer.json
├── composer.lock
├── .htaccess                   ← seguridad + performance
├── robots.txt                  ← Disallow: / (modo prueba)
├── sitemap.xml
├── favicon.ico
├── .gitignore
├── README.md
├── CLAUDE.md                   ← este archivo
│   ── solo desarrollo local (bloqueado por .htaccess) ──
├── docker-compose.yml
├── docker/Dockerfile
└── .mise.toml
```

Flujo del formulario:
`index.html` → `assets/js/contact.js` (fetch POST) → `api/contact.php` → PHPMailer → SMTP → casilla.

---

## 5. Entorno local

- URL local: **`http://localhost:8080/cont-leg-test/`** (mismo subpath que prod).
- Mailpit (bandeja de prueba): **`http://localhost:8025`**, SMTP interno en `mailpit:1025` sin auth/cifrado.
- `api/config.php` local apunta a Mailpit (`host: mailpit`, `port: 1025`, `smtp_secure: ''`, sin user/pass).

### Tareas mise
| Comando | Hace |
|---|---|
| `mise run setup` | `composer install` dentro del contenedor → genera `vendor/` |
| `mise run dev`   | levanta el sitio en `localhost:8080/cont-leg-test/` |
| `mise run stop`  | baja el entorno |
| `mise run logs`  | logs de Apache/PHP |
| `mise run mail`  | abre Mailpit |

---

## 6. Formulario de contacto — contrato

- Campos `name`: **`nombre`, `email`, `telefono`, `mensaje`**.
- Honeypot oculto: `<input name="website" class="hp-field">` (debe llegar vacío).
- `contact.php` valida en servidor: `nombre` y `mensaje` no vacíos, `email` válido. Responde JSON `{ok:true}` o error con `http_response_code` (`422` con `campos[]` para errores de validación, `405` método, `500` envío/config).
- `contact.js` intercepta el submit, hace `fetch` a `./api/contact.php`, muestra estados *enviando / éxito / error*, marca errores por campo y resetea al éxito.
- `contact-form.css` define los estados (`.form-status--info|success|error`, `.field-error`, `.has-error`, `.hp-field`).

Markup mínimo que el `<form>` debe tener:
```html
<form data-contact-form action="./api/contact.php" method="post" novalidate>
  <!-- inputs name="nombre|email|telefono|mensaje" -->
  <span class="field-error" data-error-for="nombre"></span>
  <span class="field-error" data-error-for="email"></span>
  <span class="field-error" data-error-for="mensaje"></span>
  <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="form-status" role="status" aria-live="polite" hidden></div>
  <button type="submit" data-submit>Enviar</button>
</form>
```

---

## 7. Limpieza del espejado (qué quitar / qué conservar)

**Quitar** del HTML espejado (sobra o rompe en estático): scripts de emojis de WP (`wp-emoji`), oEmbed, enlaces a `wp-json` / RSD / `generator`, prefetch a `admin-ajax`, integración del form con Elementor/`admin-ajax`, y toda referencia a `/wp-admin` o `/wp-login`.

**Conservar:** CSS y JS de Elementor (layout, sliders, animaciones, separadores) para no perder diseño ni breakpoints; el enlace de WhatsApp (`wa.me`); el footer (teléfonos y enlace a la casa matriz `luzconsulting.com.ar`).

---

## 8. Checklist post-deploy (lo ejecuta el humano en Donweb, no Claude Code)

1. Verificar que el webhook hizo `git pull` en `public_html/cont-leg-test/`.
2. Crear casilla `contacto@NUEVO_DOMINIO` en cPanel y obtener host/puerto SMTP.
3. Crear `api/config.php` **en el server** con esas credenciales (basado en `config.example.php`).
4. Probar el formulario en `https://NUEVO_DOMINIO/cont-leg-test/` y confirmar que llega el mail.
5. Confirmar que `/.git/`, `/vendor/` y `/api/config.php` devuelven 403/404 por web.
6. Al pasar a definitivo: quitar `noindex` y ajustar `robots.txt` / `sitemap.xml`.

---

## 9. Datos de referencia del sitio (para verificar fidelidad)

- One-page con navegación por anclas internas (ej. `#formu`).
- Secciones: portada/logo, constitución e inscripción de sociedades, registro de marca, formulario "Hablemos de tu necesidad", gestión integral, servicio contable y jurídico, "Qué hacemos", grilla de "Servicios que ofrecemos", "Quiénes somos", footer.
- Teléfonos: Asesor Comercial (221) 680 1914 · Oficina Técnica (221) 445 1767.
- Casa matriz enlazada: `luzconsulting.com.ar`.
