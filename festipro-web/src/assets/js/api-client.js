/**
 * api-client.js
 * Puente centralizado para manejar todas las peticiones HTTP hacia el backend de Laravel.
 */

// Extraemos la URL base desde las variables de entorno de Vite
// Ej: http://festipro-api.test/api (usamos un fallback local por seguridad)
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';

/**
 * Función base asíncrona para procesar todas las llamadas fetch.
 * Se encarga de inyectar los encabezados obligatorios y el token de sesión.
 * 
 * @param {string} endpoint - La ruta específica (ej. '/talentos')
 * @param {object} options - Opciones nativas de fetch (method, body, etc.)
 */
async function apiFetch(endpoint, options = {}) {
    // 1. Configuramos los encabezados por defecto
    const headers = new Headers(options.headers || {});
    
    // Siempre exigimos un JSON como respuesta del backend (Laravel)
    headers.set('Accept', 'application/json');

    // 2. Si el cuerpo de la petición no es un FormData (el cual Vite/Navegador maneja solo), 
    // forzamos explícitamente el tipo de contenido a JSON.
    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // 3. Extraemos el token de autenticación (Sanctum) del navegador
    const token = localStorage.getItem('token');
    if (token) {
        // Inyectamos el token en la cabecera de Autorización
        headers.set('Authorization', `Bearer ${token}`);
    }

    // 4. Consolidamos el objeto de configuración final
    const config = {
        ...options,
        headers
    };

    try {
        // 5. Ejecutamos la petición uniendo el host base y el endpoint
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Convertimos la respuesta cruda a un objeto JSON usable
        const data = await response.json();

        if (!response.ok) {
            // Manejamos errores HTTP (ej. 422 Errores de Validación de FormRequest, 401 No Autorizado)
            // Lanzamos el error con la estructura estandarizada de nuestro ApiResponseTrait
            throw { status: response.status, data };
        }

        return data;
    } catch (error) {
        // Log interno para depurar problemas de red
        console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
        throw error;
    }
}

/**
 * MÉTODOS EXPORTADOS (CRUD)
 * En lugar de escribir 'fetch' repetitivamente en las vistas, importaremos 'apiClient'
 * y usaremos estos métodos semánticos.
 */
export const apiClient = {
    /**
     * Realiza una petición GET (Lectura de datos de catálogos, perfiles, etc.)
     */
    get: (endpoint, options = {}) => 
        apiFetch(endpoint, { ...options, method: 'GET' }),

    /**
     * Realiza una petición POST (Creación de registros, Login, Registro)
     */
    post: (endpoint, body, options = {}) => {
        // El cuerpo se convierte a string automáticamente si es un objeto normal
        const finalBody = body instanceof FormData ? body : JSON.stringify(body);
        return apiFetch(endpoint, { ...options, method: 'POST', body: finalBody });
    },

    /**
     * Realiza una petición PUT (Actualización completa de datos)
     */
    put: (endpoint, body, options = {}) => {
        const finalBody = body instanceof FormData ? body : JSON.stringify(body);
        return apiFetch(endpoint, { ...options, method: 'PUT', body: finalBody });
    },

    /**
     * Realiza una petición PATCH (Actualización parcial de datos)
     */
    patch: (endpoint, body, options = {}) => {
        const finalBody = body instanceof FormData ? body : JSON.stringify(body);
        return apiFetch(endpoint, { ...options, method: 'PATCH', body: finalBody });
    },

    /**
     * Realiza una petición DELETE (Eliminación de datos o Cierre de sesión)
     */
    delete: (endpoint, options = {}) => 
        apiFetch(endpoint, { ...options, method: 'DELETE' })
};
