import { apiClient } from '/src/assets/js/api-client.js';
import { showToast } from '/src/assets/js/utils.js';

// Base API URL extraction for asset hosting
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

// Global state
let categorias = [];
let ciudades = [];
let debounceTimer;

// DOM Selectors
const filtrosForm = document.getElementById('filtros-form');
const inputBuscar = document.getElementById('filtro-buscar');
const selectCategoria = document.getElementById('filtro-categoria');
const selectCiudad = document.getElementById('filtro-ciudad');
const gridEventos = document.getElementById('eventos-grid');

const activeFiltersContainer = document.getElementById('active-filters-container');
const activeFiltersList = document.getElementById('active-filters-list');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
const heroActionContainer = document.getElementById('hero-action-container');

// User Authentication details
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('user_role');

const isHost = token && (userRole === 'anfitrion' || userRole === 'anfitrión');
const isTalent = token && (userRole === 'talento' || userRole === 'talent');



/**
 * Limpia y formatea un número para WhatsApp
 */
function formatWhatsAppLink(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 8) {
        finalPhone = '591' + cleanPhone; // Bolivia standard country code
    }
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Carga Skeletons en el grid
 */
function renderSkeletons() {
    gridEventos.innerHTML = Array.from({ length: 6 }).map(() => `
        <div class="bg-white dark:bg-fp-surface-dark rounded-2xl border border-slate-100 dark:border-fp-border-dark shadow-sm p-6 animate-pulse space-y-4">
            <div class="flex justify-between items-center">
                <div class="h-6 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-1/4"></div>
                <div class="h-4 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-1/4"></div>
            </div>
            <div class="h-6 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-3/4"></div>
            <div class="h-4 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-full"></div>
            <div class="h-4 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-5/6"></div>
            <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex justify-between items-center">
                <div class="h-6 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-1/3"></div>
                <div class="h-8 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-xl w-1/4"></div>
            </div>
        </div>
    `).join('');
}

/**
 * Carga las listas de categorías y ciudades
 */
async function cargarFiltrosEstaticos() {
    try {
        const [resCats, resCiu] = await Promise.all([
            apiClient.get('/categorias'),
            apiClient.get('/ciudades')
        ]);
        
        categorias = resCats?.data || [];
        ciudades = resCiu?.data || [];

        // Poblar categorias
        selectCategoria.innerHTML = '<option value="">Todas las categorías</option>' + 
            categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');

        // Poblar ciudades
        selectCiudad.innerHTML = '<option value="">Todas las ciudades</option>' + 
            ciudades.map(ciu => `<option value="${ciu.id}">${ciu.ciudad} (${ciu.departamento})</option>`).join('');

    } catch (error) {
        console.error('Error cargando filtros estáticos:', error);
        showToast('Error al conectar con los catálogos estáticos.', 'error');
    }
}

/**
 * Carga y renderiza los eventos de la API basándose en los filtros actuales.
 * @param {boolean} isFirstLoad - Si es true, usa esqueletos grises completos. Si es false, solo reduce opacidad para evitar parpadeos (Lag visual).
 * @param {string} initialQueryString - Si se proporciona, usa estos parámetros de URL directamente sin consultar el DOM (optimización para carga inicial paralela).
 */
async function cargarEventos(isFirstLoad = false, initialQueryString = null) {
    if (isFirstLoad) {
        renderSkeletons();
    } else {
        gridEventos.style.transition = 'opacity 0.2s';
        gridEventos.style.opacity = '0.6';
        gridEventos.style.pointerEvents = 'none';
    }

    let queryString = initialQueryString;

    if (queryString === null) {
        const params = new URLSearchParams();
        
        const buscarVal = inputBuscar.value.trim();
        const categoriaVal = selectCategoria.value;
        const ciudadVal = selectCiudad.value;

        if (buscarVal) params.append('q', buscarVal);
        if (categoriaVal) params.append('categoria', categoriaVal);
        if (ciudadVal) params.append('ciudad', ciudadVal);

        // Actualizar URL sin recargar para soportar filtros compartibles
        queryString = params.toString();
        const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
        window.history.replaceState({ path: newUrl }, '', newUrl);

        // Actualizar tags de filtros activos
        renderActiveFilters();
    }

    try {
        const response = await apiClient.get(`/eventos?${queryString}`);
        const eventos = response?.data?.data || [];

        if (eventos.length === 0) {
            gridEventos.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-sm">
                    <div class="text-5xl mb-4">📅</div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">No hay eventos publicados</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Intenta cambiar los filtros de búsqueda o restablecerlos.</p>
                </div>
            `;
            gridEventos.style.opacity = '1';
            gridEventos.style.pointerEvents = 'auto';
            return;
        }

        gridEventos.innerHTML = eventos.map(event => {
            const title = event.title;
            const categoryName = event.category?.name || 'Talento';
            const cityName = event.city?.name || 'Bolivia';
            const description = event.description || 'Sin detalles del show requeridos.';
            const budget = event.estimated_budget ? `${parseFloat(event.estimated_budget).toLocaleString('es-BO')} Bs` : 'A convenir';
            const formattedDate = event.event_date 
                ? new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) 
                : 'Fecha por definir';

            // Button Action Setup based on Roles
            let actionBtnHTML = '';
            if (isHost) {
                // Host user: Hide "Contact Host" and show alternative button redirecting to dashboard
                actionBtnHTML = `
                    <a href="/src/pages/anfitrion/dashboard.html" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-fp-surface-dark dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-1 shadow-sm">
                        ➕ Crear Evento
                    </a>
                `;
            } else {
                // Talent or Anonymous user: Show "Contact Host" button. Anonymous will redirect to Login
                const reqAuthClass = !token ? 'requires-auth' : '';
                const hostName = event.host?.name || 'Anfitrión';
                const waMessage = `Hola ${hostName}! Vi tu anuncio de evento "${title}" en FestiPro y me gustaría postularme como artista para cubrir tu show.`;
                const waLink = event.host?.whatsapp_number ? formatWhatsAppLink(event.host.whatsapp_number, waMessage) : '#';
                
                actionBtnHTML = `
                    <a href="${waLink}" target="_blank" class="px-4 py-2 bg-fp-accent-light hover:bg-fp-accent-light/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-300 flex items-center gap-1 cursor-pointer ${reqAuthClass}">
                        Contactar Anfitrión
                    </a>
                `;
            }

            return `
                <article class="group bg-white dark:bg-fp-surface-dark rounded-2xl border border-slate-100 dark:border-fp-border-dark shadow-sm hover:shadow-xl hover:border-fp-primary-light/30 dark:hover:border-fp-primary-dark/30 transition-all duration-300 transform hover:-translate-y-1.5 p-6 flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fp-primary-light/10 text-fp-primary-light dark:bg-fp-primary-dark/15 dark:text-fp-primary-dark shadow-sm">
                            ● ABIERTO
                        </span>
                        <span class="text-xs text-slate-400 dark:text-slate-500 font-semibold">${formattedDate}</span>
                    </div>
                    
                    <div class="flex-grow flex flex-col mb-6">
                        <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors duration-300">
                            ${title}
                        </h3>
                        <p class="text-xs text-slate-550 dark:text-slate-450 mb-4">
                            ${categoryName} · ${cityName}
                        </p>
                        <p class="text-sm text-slate-655 dark:text-slate-350 line-clamp-3 leading-relaxed flex-grow">
                            ${description}
                        </p>
                    </div>
                    
                    <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex items-end justify-between mt-auto">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Presupuesto</span>
                            <span class="text-base font-extrabold text-slate-900 dark:text-white">
                                ${budget}
                            </span>
                        </div>
                        
                        ${actionBtnHTML}
                    </div>
                </article>
            `;
        }).join('');

        gridEventos.style.opacity = '1';
        gridEventos.style.pointerEvents = 'auto';

    } catch (error) {
        console.error('Error al cargar eventos:', error);
        gridEventos.innerHTML = `
            <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl">
                <div class="text-4xl mb-3">⚠️</div>
                <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar los eventos</h3>
                <p class="text-sm text-red-650 dark:text-red-400">Por favor, intenta recargar la página.</p>
            </div>
        `;
        gridEventos.style.opacity = '1';
        gridEventos.style.pointerEvents = 'auto';
    }
}

/**
 * Pinta los tags de filtros activos en la barra de eventos
 */
function renderActiveFilters() {
    const list = [];
    
    if (inputBuscar.value) {
        list.push({ key: 'q', label: `Texto: "${inputBuscar.value}"`, el: inputBuscar });
    }
    if (selectCategoria.value) {
        const option = selectCategoria.options[selectCategoria.selectedIndex];
        list.push({ key: 'categoria', label: `Categoría: ${option.text}`, el: selectCategoria });
    }
    if (selectCiudad.value) {
        const option = selectCiudad.options[selectCiudad.selectedIndex];
        list.push({ key: 'ciudad', label: `Ciudad: ${option.text}`, el: selectCiudad });
    }

    if (list.length === 0) {
        activeFiltersContainer.classList.add('hidden');
        activeFiltersList.innerHTML = '';
        return;
    }

    activeFiltersContainer.classList.remove('hidden');
    activeFiltersList.innerHTML = list.map(item => `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-fp-primary-light/10 text-fp-primary-light dark:bg-fp-primary-dark/15 dark:text-fp-primary-dark border border-fp-primary-light/20 dark:border-fp-primary-dark/20 animate-fade-in">
            ${item.label}
            <button data-clear-filter="${item.key}" class="hover:text-rose-500 font-bold ml-0.5 cursor-pointer">✕</button>
        </span>
    `).join('');

    // Listener para eliminar filtro individual
    document.querySelectorAll('[data-clear-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-clear-filter');
            const item = list.find(x => x.key === key);
            if (item) {
                item.el.value = '';
                cargarEventos(false);
            }
        });
    });
}

/**
 * Inicialización de la Página (Punto de entrada)
 * Optimizado para ejecutar llamadas a la API en paralelo y reducir el tiempo de carga (TTFB).
 */
async function init() {
    // 1. Mostrar u ocultar el botón de publicar evento en el hero si es host
    if (isHost) {
        heroActionContainer.classList.remove('hidden');
    }

    const searchParams = new URLSearchParams(window.location.search);
    
    // Setear parámetro estático de texto inmediatamente
    if (searchParams.has('q')) inputBuscar.value = searchParams.get('q');

    // 2. Iniciar peticiones a la API en paralelo
    const pFiltros = cargarFiltrosEstaticos().then(() => {
        // Setear los selectores una vez sus opciones existen en el DOM
        if (searchParams.has('categoria')) selectCategoria.value = searchParams.get('categoria');
        if (searchParams.has('ciudad')) selectCiudad.value = searchParams.get('ciudad');
        // Actualizar chips de filtros iniciales
        renderActiveFilters();
    });

    const pEventos = cargarEventos(true, searchParams.toString());

    await Promise.all([pFiltros, pEventos]);

    // 3. Registrar Event Listeners de Filtros
    
    // Búsqueda de texto (Debounce 500ms)
    inputBuscar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            cargarEventos(false);
        }, 500);
    });

    // Selects con disparo inmediato
    selectCategoria.addEventListener('change', () => cargarEventos(false));
    selectCiudad.addEventListener('change', () => cargarEventos(false));

    // Botón Limpiar Todos
    btnLimpiarFiltros.addEventListener('click', () => {
        filtrosForm.reset();
        inputBuscar.value = '';
        selectCategoria.value = '';
        selectCiudad.value = '';
        cargarEventos(false);
    });
}

// Ejecutar init al estar listo
document.addEventListener('DOMContentLoaded', init);
