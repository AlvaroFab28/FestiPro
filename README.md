<div align="center">
  <img src="assets/banner.jpg" alt="FestiPro Banner" width="100%" style="border-radius: 8px;" />

  # FESTIPRO
  
  **Conexión directa entre talento local y eventos extraordinarios**

  [![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
  [![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](#)
</div>

---

## Visión General

FestiPro es una plataforma web móvil-first que redefine la búsqueda y contratación de talento local como músicos, DJs, animadores y artistas. 

Al erradicar la informalidad del boca a boca tradicional, FestiPro establece un canal de comunicación directo y eficiente. La plataforma actúa como un puente libre de comisiones intermedias, enrutando estratégicamente el acuerdo final hacia WhatsApp para garantizar un trato ágil, humano y personalizado.

---

## Características Clave

* **Roles Independientes** — Interfaces y flujos optimizados de forma diferenciada para **Anfitriones** (organizadores) y **Talentos** (artistas).
* **Catálogo Dinámico** — Búsqueda en tiempo real con filtros avanzados de ubicación, tarifas, categoría, disponibilidad y reputación.
* **Contacto Directo** — Integración fluida con WhatsApp para cerrar acuerdos en un solo toque, sin intermediarios.
* **Control de Acceso (Gatekeeper)** — Intercepción inteligente de interacciones anónimas que redirige al usuario exactamente donde estaba después de iniciar sesión.
* **Diseño Premium** — Interfaz minimalista inspirada en Airbnb, con soporte nativo de modo claro/oscuro y efectos visuales modernos.

---

## Estructura del Proyecto

El repositorio está organizado en dos componentes principales para separar la lógica de servidor de la interfaz de usuario:

* **`festipro-api/`** — Backend desarrollado con **Laravel v13** que funciona como API REST.
* **`festipro-web/`** — Frontend modular (MPA) construido con **Vite**, **Vanilla JS** y **Tailwind CSS**.

---

## Stack Tecnológico

### Frontend
* **Core** — HTML5 y JavaScript moderno (ES6+).
* **Estilos** — Tailwind CSS v4 para maquetación responsiva.
* **Diseño** — Tipografías Outfit e Inter junto con Phosphor Icons.
* **Build Tool** — Vite para desarrollo en tiempo real y optimización de producción.

### Backend
* **Core** — Laravel v13 (REST API).
* **Base de datos** — MySQL para persistencia de datos.
* **Estructura** — Controladores de recursos y almacenamiento local/nube para medios.

---

## Guía de Instalación Local

Siga estas instrucciones paso a paso para desplegar FestiPro en su entorno de desarrollo local.

### Prerrequisitos
* PHP >= 8.2 y Composer
* Node.js >= 18 y npm
* Servidor de base de datos MySQL (Laragon, XAMPP o Docker)

### 1. Configuración del Servidor API (Backend)

1. Entre al directorio de la API:
   ```bash
   cd festipro-api
   ```
2. Instale las dependencias de PHP:
   ```bash
   composer install
   ```
3. Configure el entorno local:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Configure la base de datos MySQL en el archivo `.env` y ejecute las migraciones con datos semilla:
   ```bash
   php artisan migrate --seed
   ```
5. Inicie el servidor de Laravel:
   ```bash
   php artisan serve
   ```

### 2. Configuración del Cliente (Frontend)

1. En una nueva terminal, entre al directorio web:
   ```bash
   cd festipro-web
   ```
2. Instale las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Conecte el frontend con el backend creando un archivo `.env` con la URL de la API:
   ```env
   VITE_API_BASE_URL="http://localhost:8000/api"
   ```
4. Inicie el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```

---

## Equipo de Desarrollo

* **Villena Mamani Alvaro Fabian**
* **Huallpa Franses Luis Hernan**
* **Lopez Yapu Marco**
* **Apaza Albarado Gustavo Gabriel**

---

## Flujo de Contribución

Alineado bajo la metodología **Feature Branch Workflow**:

1. Realice un **Fork** de este repositorio.
2. Cree una rama para su desarrollo: `git checkout -b feature/nombre-caracteristica`.
3. Confirme sus modificaciones: `git commit -m 'Añadir nueva característica'`.
4. Suba su rama al servidor: `git push origin feature/nombre-caracteristica`.
5. Abra un **Pull Request** dirigido a `master`.

---

<div align="center">
  Diseñado para redefinir y profesionalizar el mercado de entretenimiento local.
</div>
