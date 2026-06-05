<div align="center">

  # 🎸 FestiPro

  **Conectando talento local con eventos inolvidables.**

  [![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
  [![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](#)
</div>

---

## 🌟 Visión General

**FestiPro** es una aplicación web (webapp) estilo marketplace "mobile-first" diseñada para centralizar y digitalizar la búsqueda y contratación de talento local (músicos, DJs, payasos, animadores). 

Reemplazando el tradicional y desestructurado "boca a boca" por una plataforma premium, rápida e intuitiva. Su enfoque está en la **conexión directa**: sin comisiones internas ni pasarelas de pago. La negociación y el trato final se derivan estratégicamente de forma nativa a **WhatsApp**.

---

## ✨ Características Principales

*   🎭 **Gestión Multi-Rol:** Experiencias separadas y optimizadas para **Anfitriones** (buscan talento y publican eventos) y **Talento** (ofrecen sus servicios y aplican a eventos).
*   🔍 **Catálogo Dinámico y Filtrado Inteligente:** Búsqueda en tiempo real con filtros avanzados (ubicación, precio, categoría, disponibilidad y reputación).
*   📱 **Integración Nativa con WhatsApp:** Contacto directo y sin fricciones a un solo clic de distancia.
*   🔒 **Gatekeeper (Redirección Fuerte):** Sistema inteligente que intercepta interacciones anónimas obligando al registro/login, para luego retornar al usuario exactamente a donde estaba.
*   🎨 **UI/UX Premium:** Interfaz minimalista inspirada en Airbnb. Soporte para **Modo Claro / Oscuro**, uso de micro-interacciones, efectos glassmorphism y la regla de color `60/30/10` para una jerarquía visual perfecta.
*   ⚡ **Mobile-First:** Diseño 100% responsivo para ofrecer la mejor experiencia en dispositivos móviles.

---

## 🏗️ Arquitectura y Tecnologías

FestiPro utiliza una arquitectura desacoplada estructurada en dos repositorios principales en un flujo "Feature Branch Workflow":

### Frontend (`festipro-web`)
Construido como una *Multiple Page Application (MPA)* enfocada en rendimiento bruto.
*   **Lenguajes:** HTML5, Vanilla JavaScript (ES6+).
*   **Estilos:** Tailwind CSS v4 para diseño atómico y responsivo.
*   **Tipografía e Iconos:** Google Fonts (Outfit e Inter) y Phosphor Icons.
*   **Build Tool:** Vite (Servidor de desarrollo ultrarrápido, HMR y empaquetador para producción).

### Backend (`festipro-api`)
Patrón de Monolito Modular expuesto exclusivamente como una API REST.
*   **Framework:** Laravel v13.
*   **Base de Datos:** MySQL.
*   **Arquitectura:** Controladores API orientados a recursos, respuestas estándar en formato JSON y gestión segura de almacenamiento para medios (avatares, banners).

---

## 📂 Estructura del Proyecto

```text
/
├── festipro-api/          # Backend (Laravel REST API)
│   ├── app/Modules/       # Lógica modular separada por dominio (Publico, Auth, Talento, etc)
│   ├── routes/            # Rutas de la API (api.php)
│   └── ...
├── festipro-web/          # Frontend (Vite + Vanilla JS + Tailwind)
│   ├── src/
│   │   ├── components/    # Componentes inyectables (Header, Footer, Modales)
│   │   ├── pages/         # Vistas HTML organizadas por dominios (auth, talento, publico)
│   │   ├── css/           # Archivos de estilos (Tailwind directives)
│   │   └── main.js        # Entry point de Vite
│   └── index.html         # Landing page (Escaparate)
└── docs/                  # Documentación extendida (Arquitectura, Requisitos, Contexto)
```

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para levantar el entorno completo de desarrollo de FestiPro localmente.

### Prerrequisitos
*   [PHP >= 8.2](https://www.php.net/) y [Composer](https://getcomposer.org/) (Para el Backend).
*   [Node.js >= 18](https://nodejs.org/) y npm (Para el Frontend).
*   Servidor web y base de datos MySQL (Recomendado: [Laragon](https://laragon.org/) o XAMPP).

### Paso 1: Configurar la API (Backend)

1. Entra a la carpeta del backend:
   ```bash
   cd festipro-api
   ```
2. Instala las dependencias de PHP:
   ```bash
   composer install
   ```
3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Configura tu conexión a MySQL en el archivo `.env` y ejecuta las migraciones (con datos semilla):
   ```bash
   php artisan migrate --seed
   ```
5. Levanta el servidor local de Laravel:
   ```bash
   php artisan serve
   ```
   *El backend estará corriendo típicamente en `http://localhost:8000` o en el virtual host configurado (ej: `http://festipro-api.test`).*

### Paso 2: Configurar la WebApp (Frontend)

1. En otra terminal, entra a la carpeta del frontend:
   ```bash
   cd festipro-web
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Configura el `.env` del frontend (si aplica) para apuntar a la URL de la API:
   ```env
   VITE_API_BASE_URL="http://localhost:8000/api"
   ```
4. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   *El frontend estará corriendo en `http://localhost:5173`. Abre este enlace en tu navegador.*

---

## 📸 Capturas de Pantalla

*(Próximamente... Añade aquí capturas de la Landing Page, Catálogo de Talentos y Dashboard)*

---

## 👨‍💻 Equipo de Desarrollo

*   **Villena Mamani Alvaro Fabian**
*   **Huallpa Franses Luis Hernan**
*   **Lopez Yapu Marco**
*   **Apaza Albarado Gustavo Gabriel**

---

## 🤝 Contribuciones

Este proyecto sigue el modelo de **Feature Branch Workflow**.
1. Haz un Fork del repositorio.
2. Crea tu rama para la nueva característica (`git checkout -b feature/NuevaCaracteristica`).
3. Haz tus commits (`git commit -m 'Añadir nueva característica'`).
4. Sube la rama (`git push origin feature/NuevaCaracteristica`).
5. Abre un Pull Request dirigido a `master`.

---

<div align="center">
  Hecho con ❤️ para revolucionar el entretenimiento local.
</div>
