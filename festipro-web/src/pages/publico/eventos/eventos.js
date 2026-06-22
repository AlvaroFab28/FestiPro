import { apiClient } from '/src/assets/js/api-client.js';
import { showToast, setupSpotlights } from '/src/assets/js/utils.js';

// Base API URL extraction for asset hosting
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

// Global state
let categorias = [];
let ciudades = [];
let debounceTimer;
let eventosAbortController = null;
let scrollObserver = null;
const eventosDataMap = new Map();
let currentPage = 1;
let lastPage = 1;
let isLoadingMore = false;

// DOM Selectors - Main filters sticky
const filtrosForm = document.getElementById('filtros-form');
const inputBuscar = document.getElementById('filtro-buscar');
const selectCategoria = document.getElementById('filtro-categoria');
const selectCiudad = document.getElementById('filtro-ciudad');
const gridEventos = document.getElementById('eventos-grid');
const resultadosConteo = document.getElementById('resultados-conteo');

const activeFiltersContainer = document.getElementById('active-filters-container');
const activeFiltersList = document.getElementById('active-filters-list');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
const heroActionContainer = document.getElementById('hero-action-container');

// DOM Selectors - Modal Filtros Avanzados
const btnAbrirFiltros = document.getElementById('btn-abrir-filtros');
const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
const modalOverlay = document.getElementById('modal-filtros-overlay');
const modalPanel = document.getElementById('modal-filtros-panel');
const btnModalLimpiar = document.getElementById('btn-modal-limpiar');
const btnModalAplicar = document.getElementById('btn-modal-aplicar');
const inputPrecioMin = document.getElementById('filtro-precio-min');
const inputPrecioMax = document.getElementById('filtro-precio-max');
const inputSoloAbiertos = document.getElementById('filtro-solo-abiertos');
const inputSoloFuturos = document.getElementById('filtro-solo-futuros');
const filtroCountBadge = document.getElementById('filtro-count-badge');

// DOM Selectors - Modal Detalle de Evento (Premium)
const modalEventoOverlay = document.getElementById('modal-evento-overlay');
const modalEventoPanel = document.getElementById('modal-evento-panel');

// DOM Selectors - Top Eventos (Mejor Pagados)
const seccionTopEventos = document.getElementById('seccion-top-eventos');
const topEventosContainer = document.getElementById('top-eventos-container');

// User Authentication details
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('user_role');

const isHost = token && (userRole === 'anfitrion' || userRole === 'anfitrión');

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
 * Calcula el tiempo transcurrido desde una fecha dada
 */
function timeAgo(dateString) {
    if (!dateString) return 'Recientemente';
    
    // Asegurar que se interprete como UTC si no tiene zona horaria
    const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(safeDateString);
    const now = new Date();
    
    // Si la fecha es en el futuro por desincronización, devolvemos 0 para caer en "Hace un momento"
    let seconds = Math.floor((now - date) / 1000);
    if (seconds < 0) seconds = 0;
    
    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    const months = Math.floor(days / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

/**
 * Carga Skeletons en el grid (diseño horizontal de 2 columnas)
 */
function renderSkeletons() {
    gridEventos.innerHTML = Array.from({ length: 6 }).map(() => `
        <div class="flex flex-col sm:flex-row bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-fp-border-dark/65 shadow-sm w-full max-w-3xl animate-pulse overflow-hidden">
            <!-- SECCIÓN IZQUIERDA -->
            <div class="sm:w-36 p-5 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-fp-border-dark/60 shrink-0 select-none">
                <div class="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-16 mb-4"></div>
                <div class="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
                <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded w-10 mb-2"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16 mb-4"></div>
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-16"></div>
            </div>
            <!-- SECCIÓN DERECHA -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div class="flex items-center justify-between gap-4">
                    <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                </div>
                <div class="bg-slate-50/70 dark:bg-[#0d1220]/65 p-3 rounded-xl border border-slate-200/50 dark:border-fp-border-dark/40">
                    <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-2"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full mb-1.5"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-fp-border-dark/40">
                    <div>
                        <div class="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-8 mb-1"></div>
                        <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </div>
                    <div class="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Carga las listas de categorías y ciudades, y estadísticas globales
 * @param {boolean} cargarGlobalTotal - Si es true, calcula el total de eventos para el banner.
 */
async function cargarFiltrosEstaticos(cargarGlobalTotal = true) {
    try {
        // Intentar recuperar desde sessionStorage
        try {
            const cachedCats = sessionStorage.getItem('fp_cat');
            const cachedCius = sessionStorage.getItem('fp_ciu');
            if (cachedCats) categorias = JSON.parse(cachedCats);
            if (cachedCius) ciudades = JSON.parse(cachedCius);
        } catch (e) {
            console.warn('Error al leer de sessionStorage:', e);
        }

        const promesas = [];
        let catIndex = -1;
        let ciuIndex = -1;
        let totalIndex = -1;

        if (categorias.length === 0) {
            promesas.push(apiClient.get('/categorias'));
            catIndex = promesas.length - 1;
        }
        if (ciudades.length === 0) {
            promesas.push(apiClient.get('/ciudades'));
            ciuIndex = promesas.length - 1;
        }
        if (cargarGlobalTotal) {
            promesas.push(apiClient.get('/eventos?limit=1'));
            totalIndex = promesas.length - 1;
        }
        
        if (promesas.length > 0) {
            const resultados = await Promise.all(promesas);
            
            if (catIndex !== -1 && resultados[catIndex]) {
                categorias = resultados[catIndex]?.data || [];
                try {
                    sessionStorage.setItem('fp_cat', JSON.stringify(categorias));
                } catch (e) {
                    console.warn('Error al guardar categorías en sessionStorage:', e);
                }
            }
            if (ciuIndex !== -1 && resultados[ciuIndex]) {
                ciudades = resultados[ciuIndex]?.data || [];
                try {
                    sessionStorage.setItem('fp_ciu', JSON.stringify(ciudades));
                } catch (e) {
                    console.warn('Error al guardar ciudades en sessionStorage:', e);
                }
            }
            if (totalIndex !== -1 && resultados[totalIndex]) {
                const resEve = resultados[totalIndex];
                const totalEventos = resEve?.data?.total || resEve?.data?.data?.length || 0;
                const elEventos = document.getElementById('stat-eventos');
                if (elEventos) {
                    elEventos.setAttribute('data-target', totalEventos);
                }
            }
        }

        // Set targets for stats
        const elCiudades = document.getElementById('stat-ciudades');
        const elCategorias = document.getElementById('stat-categorias');

        if (elCiudades) elCiudades.setAttribute('data-target', ciudades.length);
        if (elCategorias) elCategorias.setAttribute('data-target', categorias.length);

        // Poblar categorias
        selectCategoria.innerHTML = '<option value="">Todas las Categorías</option>' + 
            categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');

        // Poblar ciudades
        selectCiudad.innerHTML = '<option value="">Todas las Ciudades</option>' + 
            ciudades.map(ciu => `<option value="${ciu.id}">${ciu.ciudad} (${ciu.departamento})</option>`).join('');

    } catch (error) {
        console.error('Error cargando filtros estáticos:', error);
        showToast('Error al conectar con los catálogos estáticos.', 'error');
    }
}

/**
 * Carga y renderiza los eventos de la API basándose en los filtros actuales.
 * @param {boolean} isFirstLoad - Si es true, usa esqueletos grises completos. Si es false, solo reduce opacidad para evitar parpadeos.
 * @param {string} initialQueryString - Si se proporciona, usa estos parámetros de URL directamente sin consultar el DOM.
 */
async function cargarEventos(isFirstLoad = false, initialQueryString = null, isLoadMore = false) {
    if (eventosAbortController && !isLoadMore) {
        eventosAbortController.abort();
    }
    
    if (!isLoadMore) {
        eventosAbortController = new AbortController();
        currentPage = 1;
        lastPage = 1;
    }

    if (isLoadingMore && isLoadMore) return;
    if (isLoadMore) {
        isLoadingMore = true;
    }

    let queryString = initialQueryString;

    if (queryString === null) {
        const params = new URLSearchParams();
        
        const buscarVal = inputBuscar.value.trim();
        const categoriaVal = selectCategoria.value;
        const cityVal = selectCiudad.value;
        const minBudgetVal = inputPrecioMin.value;
        const maxBudgetVal = inputPrecioMax.value;
        const soloAbiertosVal = inputSoloAbiertos.checked;
        const soloFuturosVal = inputSoloFuturos.checked;

        if (buscarVal) params.append('q', buscarVal);
        if (categoriaVal) params.append('categoria', categoriaVal);
        if (cityVal) params.append('ciudad', cityVal);
        if (minBudgetVal) params.append('min_budget', minBudgetVal);
        if (maxBudgetVal) params.append('max_budget', maxBudgetVal);
        if (soloAbiertosVal) params.append('status', 'abierto');
        if (soloFuturosVal) params.append('solo_futuros', 'true');

        params.append('page', currentPage);

        queryString = params.toString();
        
        if (!isLoadMore) {
            const newUrl = window.location.pathname + (queryString ? `?${queryString.replace(/&?page=\d+/, '')}` : '');
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }

        renderActiveFilters();
        actualizarBadgeFiltrosAvanzados();
    } else {
        const params = new URLSearchParams(queryString);
        params.set('page', currentPage);
        queryString = params.toString();
    }

    const sentinel = document.getElementById('sentinel-eventos');

    if (isFirstLoad) {
        renderSkeletons();
        if (sentinel) sentinel.innerHTML = '';
    } else if (isLoadMore) {
        if (sentinel) {
            sentinel.innerHTML = `
                <div class="flex flex-col items-center gap-2 animate-fade-in py-4 relative z-20 w-full">
                    <div class="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-indigo-400 animate-spin"></div>
                    <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Cargando más oportunidades...</span>
                </div>
            `;
        }
    } else {
        gridEventos.style.transition = 'opacity 0.2s';
        gridEventos.style.opacity = '0.6';
        gridEventos.style.pointerEvents = 'none';
        if (sentinel) sentinel.innerHTML = '';
    }

    try {
        if (!isLoadMore) {
            resultadosConteo.textContent = 'Buscando oportunidades de eventos...';
        }
        const response = await apiClient.get(`/eventos?${queryString}`, { signal: eventosAbortController.signal });
        const paginator = response?.data;
        const eventos = paginator?.data || [];
        currentPage = paginator?.current_page || 1;
        lastPage = paginator?.last_page || 1;
        const total = paginator?.total || eventos.length;

        if (!isLoadMore) {
            resultadosConteo.innerHTML = `Hemos encontrado <span class="text-blue-600 dark:text-indigo-400 font-extrabold text-sm mx-1">${total}</span> oportunidades activas`;
        }

        const searchParams = new URLSearchParams(queryString || window.location.search);
        const filterKeys = ['q', 'categoria', 'ciudad', 'min_budget', 'max_budget', 'status', 'solo_futuros'];
        const hasFilters = Array.from(searchParams.keys()).some(key => filterKeys.includes(key));
        if (!isLoadMore && !hasFilters) {
            const elEventos = document.getElementById('stat-eventos');
            if (elEventos) {
                elEventos.setAttribute('data-target', total);
                animateCounter(elEventos);
            }
        }

        const elPresupuesto = document.getElementById('stat-presupuesto');
        if (!isLoadMore && elPresupuesto) {
            let totalPresp = 0;
            let countPresp = 0;
            eventos.forEach(e => {
                if (e.estimated_budget) {
                    totalPresp += parseFloat(e.estimated_budget);
                    countPresp++;
                }
            });
            const avgPresp = countPresp > 0 ? Math.round(totalPresp / countPresp) : 0;
            elPresupuesto.setAttribute('data-target', avgPresp);
            animateCounter(elPresupuesto);
        }

        if (eventos.length === 0 && !isLoadMore) {
            gridEventos.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-[#131b2e] border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-sm flex flex-col items-center animate-fade-in relative z-20 animate-card-fade">
                    <div class="text-5xl mb-4 text-slate-350 dark:text-slate-600"><i class="ph ph-smiley-sad"></i></div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">No se encontraron eventos</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Intenta relajar los filtros de búsqueda o restablecerlos.</p>
                </div>
            `;
            if (sentinel) sentinel.innerHTML = '';
            gridEventos.style.opacity = '1';
            gridEventos.style.pointerEvents = 'auto';
            return;
        }

        const cardsHTML = eventos.map(event => {
            const title = event.title;
            const categoryName = event.category?.name || 'Show';
            const cityName = event.city?.name || 'Bolivia';
            const description = event.description || 'Sin detalles adicionales del evento.';
            
            const isEstimated = !event.estimated_budget;
            const formattedBudget = event.estimated_budget ? parseFloat(event.estimated_budget).toLocaleString('es-BO') : 'A convenir';
            
            const timeAgoStr = timeAgo(event.created_at);
            
            const dateObj = event.event_date ? new Date(event.event_date) : new Date();
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
            const year = dateObj.getFullYear();

            const status = (event.status || 'abierto').toLowerCase();
            let actionBtnHTML = '';
            const reqAuthClass = !token ? 'requires-auth' : '';

            if (status === 'cerrado') {
                actionBtnHTML = `
                    <span class="text-slate-400 dark:text-slate-500 text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/35 select-none flex items-center gap-1.5 no-card-click">
                        <i class="ph ph-lock-key text-sm"></i> Evento Finalizado
                    </span>
                `;
            } else if (status === 'cancelado') {
                actionBtnHTML = '';
            } else {
                if (isHost) {
                    actionBtnHTML = `
                        <a href="/src/pages/anfitrion/dashboard.html" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl shadow-md hover:shadow-[0_8px_16px_rgba(37,99,235,0.25)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group/btn no-card-click select-none">
                            <span>Crear Evento</span>
                            <i class="ph ph-plus-circle text-sm transform group-hover/btn:scale-110 transition-transform duration-200"></i>
                        </a>
                    `;
                } else {
                    const hostName = event.host?.name || 'Anfitrión';
                    const waMessage = `Hola ${hostName}! Vi tu anuncio de evento "${title}" en FestiPro y me gustaría postularme como artista para cubrir tu show.`;
                    const waLink = event.host?.whatsapp_number ? formatWhatsAppLink(event.host.whatsapp_number, waMessage) : '#';
                    
                    actionBtnHTML = `
                        <a href="${waLink}" target="_blank" class="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-zinc-800 dark:hover:border-indigo-400 text-[11px] font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group/btn no-card-click select-none ${reqAuthClass}">
                            <span>Contactar</span>
                            <i class="ph ph-paper-plane-tilt text-sm transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200"></i>
                        </a>
                    `;
                }
            }

            let ribbonHTML = '';
            if (status === 'abierto') {
                ribbonHTML = `
                  <div class="absolute top-0 right-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                    <div class="absolute top-[14px] -right-[22px] w-[95px] py-0.5 bg-gradient-to-r from-[#6c5ce7] to-[#9350FF] text-white text-[9px] font-black text-center uppercase tracking-widest rotate-45 shadow-xs ribbon-shimmer-diagonal">
                      ABIERTO
                    </div>
                  </div>
                `;
            } else if (status === 'cerrado') {
                ribbonHTML = `
                  <div class="absolute top-0 right-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                    <div class="absolute top-[14px] -right-[22px] w-[95px] py-0.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white text-[9px] font-black text-center uppercase tracking-widest rotate-45 shadow-xs">
                      CERRADO
                    </div>
                  </div>
                `;
            } else if (status === 'cancelado') {
                ribbonHTML = `
                  <div class="absolute top-0 right-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                    <div class="absolute top-[14px] -right-[22px] w-[95px] py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[9px] font-black text-center uppercase tracking-widest rotate-45 shadow-xs">
                      CANCELADO
                    </div>
                  </div>
                `;
            }

            eventosDataMap.set(event.id.toString(), event);

            return `
                <article data-event-id="${event.id}" class="event-card cursor-pointer spotlight-card flex flex-col sm:flex-row bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-fp-border-dark/65 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08),0_10px_30px_-10px_rgba(37,99,235,0.15)] dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.5),0_10px_30px_-10px_rgba(108,92,231,0.1)] hover:shadow-[0_30px_60px_-10px_rgba(37,99,235,0.25),0_12px_25px_-8px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_30px_60px_-10px_rgba(108,92,231,0.3),0_12px_25px_-8px_rgba(147,80,255,0.2)] hover:border-blue-500 dark:hover:border-indigo-500/70 transition-all duration-500 w-full max-w-3xl group relative overflow-hidden">
                  
                  ${ribbonHTML}

                  <div class="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 dark:from-blue-600/10 dark:via-blue-500/5 dark:to-sky-400/5 rounded-full blur-2xl opacity-25 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-45 group-hover:scale-110 group-hover:-translate-x-4 transition-all duration-700 pointer-events-none z-0"></div>
                  <div class="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500 dark:from-blue-500/10 dark:via-sky-500/5 dark:to-indigo-500/5 rounded-full blur-2xl opacity-20 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-35 group-hover:scale-110 group-hover:translate-x-4 transition-all duration-700 pointer-events-none z-0"></div>

                  <div class="bg-gradient-to-b from-slate-50 via-white to-blue-50/10 dark:from-[#0d1220] dark:via-[#131b2e] dark:to-[#0f172a] sm:w-44 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-fp-border-dark/60 shrink-0 text-center select-none relative z-10">
                    <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Fecha del Evento</span>
                    
                    <div class="calendar-premium-container mb-4 transform scale-125 my-2">
                      <div class="calendar-premium-rings">
                        <span class="ring-loop"></span>
                        <span class="ring-loop"></span>
                      </div>
                      <div class="calendar-premium-card">
                        <div class="calendar-premium-header"></div>
                        <div class="calendar-premium-content">
                          <span class="calendar-premium-day">${day}</span>
                        </div>
                      </div>
                    </div>
                    
                    <span class="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2 mb-2">${month} ${year}</span>
                  </div>

                  <div class="p-6 flex-1 flex flex-col justify-between relative z-10 min-w-0">
                    <div class="flex items-center justify-between gap-4 mb-3">
                      <h3 class="text-base sm:text-lg font-extrabold text-slate-850 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">${title}</h3>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-[#0d1220] border border-slate-200/60 dark:border-fp-border-dark/60 px-2 py-0.5 rounded-md shadow-3xs shrink-0 select-none">
                        ${timeAgoStr}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-4 text-xs font-semibold mb-3">
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">Necesito:</span>
                        <span class="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-blue-500/20 dark:border-indigo-500/20 rounded font-bold shadow-3xs flex items-center gap-1 hover-tag-anim">
                          <i class="ph ph-tag text-xs"></i> ${categoryName}
                        </span>
                      </div>
                      
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wider">En:</span>
                        <span class="px-2.5 py-0.5 bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border border-slate-500/20 rounded font-bold shadow-3xs flex items-center gap-1 hover-map-anim">
                          <i class="ph ph-map-pin text-xs"></i> ${cityName}
                        </span>
                      </div>
                    </div>

                    <div class="mb-4">
                      <span class="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide block mb-1">Detalles:</span>
                      <div class="bg-slate-50/70 dark:bg-[#0d1220]/65 p-3 rounded-xl border border-slate-200/50 dark:border-fp-border-dark/40 backdrop-blur-xs">
                        <p class="text-xs text-slate-650 dark:text-slate-400 leading-relaxed line-clamp-2 event-card-details">
                          ${description}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-fp-border-dark/40">
                      <div>
                        <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ofrezco</span>
                        <span class="text-lg sm:text-2xl font-black catalog-card-price whitespace-nowrap">
                          ${formattedBudget} ${!isEstimated ? 'Bs.' : ''}
                        </span>
                      </div>
                      
                      ${actionBtnHTML}
                    </div>

                  </div>
                </article>
            `;
        }).join('');

        if (isLoadMore) {
            gridEventos.insertAdjacentHTML('beforeend', cardsHTML);
        } else {
            gridEventos.innerHTML = cardsHTML;
        }

        setupSpotlights();
        setupScrollReveal();

        if (sentinel) {
            if (currentPage >= lastPage) {
                sentinel.innerHTML = `
                    <div class="text-center py-6 animate-fade-in relative z-20 w-full">
                        <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            ✦ Fin del catálogo · Has visto todas las oportunidades ✦
                        </span>
                    </div>
                `;
            } else {
                sentinel.innerHTML = '';
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }
        console.error('Error al cargar eventos:', error);
        if (isLoadMore) {
            if (sentinel) {
                sentinel.innerHTML = `
                    <div class="text-center py-4 animate-fade-in relative z-20 w-full">
                        <button id="btn-reintentar-eventos" class="text-xs font-extrabold text-rose-500 hover:underline">
                            Error al cargar más. Haz clic aquí para reintentar.
                        </button>
                    </div>
                `;
                document.getElementById('btn-reintentar-eventos')?.addEventListener('click', () => {
                    cargarEventos(false, null, true);
                });
            }
        } else {
            resultadosConteo.textContent = 'Error al cargar eventos';
            gridEventos.innerHTML = `
                <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 rounded-3xl flex flex-col items-center animate-fade-in relative z-20">
                    <div class="text-4xl mb-3 text-red-500"><i class="ph-fill ph-warning"></i></div>
                    <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar los eventos</h3>
                    <p class="text-sm text-red-650 dark:text-red-400">Por favor, comprueba tu conexión e intenta recargar la página.</p>
                </div>
            `;
            if (sentinel) sentinel.innerHTML = '';
        }
    } finally {
        isLoadingMore = false;
        gridEventos.style.opacity = '1';
        gridEventos.style.pointerEvents = 'auto';
    }
}

/**
 * Carga los 3 eventos con mayor presupuesto (Top Eventos)
 */
async function cargarTopEventos() {
    try {
        // Obtenemos los eventos públicos ordenados por presupuesto de mayor a menor y limitamos a 3 (solo abiertos)
        const response = await apiClient.get('/eventos?status=abierto&order_by=estimated_budget&order=desc&limit=3');
        const topEventos = response?.data?.data || [];

        if (topEventos.length === 0) {
            seccionTopEventos.classList.add('hidden');
            return;
        }

        seccionTopEventos.classList.remove('hidden');

        // Oro, Plata y Bronce todos con medallas
        const medallas = [
            { icon: '<i class="ph-fill ph-medal"></i>', class: 'oro' },
            { icon: '<i class="ph-fill ph-medal"></i>', class: 'plata' },
            { icon: '<i class="ph-fill ph-medal"></i>', class: 'bronce' }
        ];

        topEventosContainer.innerHTML = topEventos.map((event, idx) => {
            const title = event.title;
            const categoryName = event.category?.name || 'Show';
            const cityName = event.city?.name || 'Bolivia';
            const budget = event.estimated_budget ? `${parseFloat(event.estimated_budget).toLocaleString('es-BO')} Bs.` : 'A convenir';
            const formattedDate = event.event_date 
                ? new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) 
                : 'Fecha por definir';

            const medal = medallas[idx] || medallas[2];
            
            // Colores glassmorphic diferenciados para las categorías del podio (Dorado/Amber, Azul, Verde/Emerald)
            const tagColors = [
                'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20',
                'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20',
                'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20'
            ];
            const tagColorClass = tagColors[idx] || tagColors[2];

            // Action button logic
            let actionBtnHTML = '';
            if (isHost) {
                actionBtnHTML = `
                    <a href="/src/pages/anfitrion/dashboard.html" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#0b0f19] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-255 font-bold text-[10px] rounded-xl transition-all duration-300 flex items-center gap-1 shadow-sm no-card-click">
                        ➕ Crear
                    </a>
                `;
            } else {
                const reqAuthClass = !token ? 'requires-auth' : '';
                const hostName = event.host?.name || 'Anfitrión';
                const waMessage = `Hola ${hostName}! Vi tu anuncio estrella de evento "${title}" en FestiPro y me gustaría postularme como artista para cubrir tu show.`;
                const waLink = event.host?.whatsapp_number ? formatWhatsAppLink(event.host.whatsapp_number, waMessage) : '#';
                
                actionBtnHTML = `
                    <a href="${waLink}" target="_blank" class="btn-wa-${medal.class} no-card-click py-1.5 px-3 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 relative z-20 ${reqAuthClass}">
                        <span>Contactar</span>
                        <i class="ph-fill ph-star star-item star-1"></i>
                        <i class="ph-fill ph-star star-item star-2"></i>
                        <i class="ph-fill ph-star star-item star-3"></i>
                        <i class="ph-fill ph-star star-item star-4"></i>
                        <i class="ph-fill ph-star star-item star-5"></i>
                        <i class="ph-fill ph-star star-item star-6"></i>
                    </a>
                `;
            }

            // Guardar datos en el mapa de eventos
            eventosDataMap.set(event.id.toString(), event);

            return `
                <article data-event-id="${event.id}" data-modal-variant="${medal.class}" class="top-event-card cursor-pointer group relative rounded-3xl p-5 flex gap-4 items-center glow-${medal.class} transition-all duration-300 animate-fade-in"
                         style="animation-delay: ${idx * 150}ms">
                    
                    <!-- Shimmer premium -->
                    <div class="card-shimmer"></div>

                    <!-- Medalla en contenedor flotante 3D -->
                    <div class="medal-container">
                        <div class="medal-badge medal-${medal.class}">
                            <span class="medal-icon">${medal.icon}</span>
                        </div>
                    </div>

                    <!-- Icono de Maletín de Trabajo de la tarjeta del podio (Fondo glassmorphic según medalla) -->
                    <div class="briefcase-container briefcase-${medal.class} relative z-20 w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 transition-all duration-300">
                        <i class="ph ph-briefcase text-[34px] transition-transform duration-300"></i>
                    </div>

                    <!-- Datos del evento -->
                    <div class="relative z-20 flex-grow min-w-0">
                        <h3 class="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate tracking-tight mb-1">
                            ${title}
                        </h3>
                        
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-3xs uppercase tracking-wider select-none ${tagColorClass}">
                                ${categoryName}
                            </span>
                            <span class="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                                <i class="ph ph-map-pin text-[11px] text-slate-400"></i> ${cityName} · <i class="ph ph-calendar text-[11px] text-slate-400"></i> ${formattedDate}
                            </span>
                        </div>
                        
                        <div class="flex items-center justify-between border-t border-slate-200 dark:border-fp-border-dark/60 pt-2 flex-wrap gap-2">
                            <div class="flex flex-col">
                                <span class="text-[8px] text-slate-455 uppercase font-bold tracking-wider">Ofrece</span>
                                <span class="text-sm sm:text-lg font-black catalog-card-price whitespace-nowrap">
                                    ${budget}
                                </span>
                            </div>
                            
                            ${actionBtnHTML}
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        setupSpotlights();

    } catch (error) {
        console.error('Error al cargar top eventos:', error);
        seccionTopEventos.classList.add('hidden'); // Ocultar si hay error
    }
}

/**
 * Pinta los chips de filtros activos en la barra de eventos
 */
function renderActiveFilters() {
    const list = [];
    
    if (inputBuscar.value.trim()) {
        list.push({ key: 'q', label: `Búsqueda: "${inputBuscar.value}"`, el: inputBuscar });
    }
    if (selectCategoria.value) {
        const option = selectCategoria.options[selectCategoria.selectedIndex];
        list.push({ key: 'categoria', label: `Categoría: ${option.text}`, el: selectCategoria });
    }
    if (selectCiudad.value) {
        const option = selectCiudad.options[selectCiudad.selectedIndex];
        list.push({ key: 'ciudad', label: `Ciudad: ${option.text}`, el: selectCiudad });
    }
    if (inputPrecioMin.value) {
        list.push({ key: 'min_budget', label: `Mín: ${inputPrecioMin.value} Bs.`, el: inputPrecioMin });
    }
    if (inputPrecioMax.value) {
        list.push({ key: 'max_budget', label: `Máx: ${inputPrecioMax.value} Bs.`, el: inputPrecioMax });
    }
    if (inputSoloAbiertos && inputSoloAbiertos.checked) {
        list.push({ key: 'status', label: `Solo abiertos`, el: inputSoloAbiertos });
    }
    if (inputSoloFuturos && inputSoloFuturos.checked) {
        list.push({ key: 'solo_futuros', label: `Solo futuros`, el: inputSoloFuturos });
    }

    if (list.length === 0) {
        activeFiltersContainer.classList.add('hidden');
        activeFiltersList.innerHTML = '';
        return;
    }

    activeFiltersContainer.classList.remove('hidden');
    activeFiltersList.innerHTML = list.map(item => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-blue-500/20 dark:border-indigo-500/20 animate-fade-in">
            ${item.label}
            <button data-clear-filter="${item.key}" class="hover:text-rose-500 font-extrabold ml-0.5 cursor-pointer flex items-center justify-center">
                <i class="ph-fill ph-x-circle text-[13px]"></i>
            </button>
        </span>
    `).join('');

    // Listener para eliminar filtro individual
    document.querySelectorAll('[data-clear-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-clear-filter');
            const item = list.find(x => x.key === key);
            if (item) {
                if (item.el) {
                    if (item.el.type === 'checkbox') {
                        item.el.checked = false;
                    } else {
                        item.el.value = '';
                    }
                }
                cargarEventos(false);
            }
        });
    });
}

/**
 * Actualiza el contador badge en el botón Filtros
 */
function actualizarBadgeFiltrosAvanzados() {
    let count = 0;
    if (inputPrecioMin.value) count++;
    if (inputPrecioMax.value) count++;
    // Cuenta si "Solo abiertos" está activado (ya que por defecto es false)
    if (inputSoloAbiertos && inputSoloAbiertos.checked) count++;
    if (inputSoloFuturos && inputSoloFuturos.checked) count++;

    if (count > 0) {
        filtroCountBadge.textContent = count;
        filtroCountBadge.classList.remove('hidden');
    } else {
        filtroCountBadge.textContent = '0';
        filtroCountBadge.classList.add('hidden');
    }
}

/**
 * Configura la animación scroll reveal para las tarjetas de eventos
 */
function setupScrollReveal() {
    if (scrollObserver) {
        scrollObserver.disconnect();
    }
    const cards = document.querySelectorAll('.event-card');
    if (cards.length === 0) return;
    
    const observerOptions = {
        root: null,
        threshold: 0.05,
        rootMargin: '50px 0px 50px 0px'
    };

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                // Efecto de stagger escalonado
                setTimeout(() => {
                    entry.target.classList.add('event-card-visible');
                }, idx * 70);
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => scrollObserver.observe(card));
}

/**
 * Configura el count-up en los stats del Banner
 */
function setupBannerStatsAnimations() {
    const statsElements = [
        document.getElementById('stat-eventos'),
        document.getElementById('stat-ciudades'),
        document.getElementById('stat-presupuesto')
    ];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    statsElements.forEach(el => {
        if (el) observer.observe(el);
    });
}

/**
 * Función que realiza el incremento dinámico numérico
 */
function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target') || '0', 10);
    const duration = 1200; // 1.2 segundos
    const startTime = performance.now();
    
    const suffix = (el.id === 'stat-eventos' || el.id === 'stat-ciudades') ? '+' : ' Bs.';
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing cuadrático de salida
        const ease = progress * (2 - progress);
        const currentVal = Math.floor(ease * target);
        
        el.textContent = currentVal.toLocaleString('es-BO') + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString('es-BO') + suffix;
        }
    }
    requestAnimationFrame(update);
}

/**
 * Inicialización de la Página (Punto de entrada)
 */
async function init() {
    // 1. Mostrar u ocultar el botón de publicar evento en el hero si es host
    if (isHost) {
        heroActionContainer.classList.remove('hidden');
    }

    const searchParams = new URLSearchParams(window.location.search);
    
    // Budget Preset helpers
    const btnPresetPrices = document.querySelectorAll('.btn-preset-price');
    const selectPreset = (presetKey) => {
        btnPresetPrices.forEach(btn => {
            if (btn.getAttribute('data-preset') === presetKey) {
                btn.classList.add('chip-active');
            } else {
                btn.classList.remove('chip-active');
            }
        });
    };
    const clearPresets = () => {
        btnPresetPrices.forEach(btn => btn.classList.remove('chip-active'));
    };

    // Setear parámetros en los inputs inmediatamente
    if (searchParams.has('q')) inputBuscar.value = searchParams.get('q');
    if (searchParams.has('min_budget')) inputPrecioMin.value = searchParams.get('min_budget');
    if (searchParams.has('max_budget')) inputPrecioMax.value = searchParams.get('max_budget');
    if (searchParams.has('status')) {
        const val = searchParams.get('status') === 'abierto';
        if (inputSoloAbiertos) inputSoloAbiertos.checked = val;
    }
    if (searchParams.has('solo_futuros')) {
        const val = searchParams.get('solo_futuros') === 'true';
        if (inputSoloFuturos) inputSoloFuturos.checked = val;
    }

    // Check if initial prices match presets
    const initialMin = inputPrecioMin.value;
    const initialMax = inputPrecioMax.value;
    if (initialMin === '0' && initialMax === '500') {
        selectPreset('eco');
    } else if (initialMin === '500' && initialMax === '2000') {
        selectPreset('std');
    } else if (initialMin === '2000' && initialMax === '') {
        selectPreset('premium');
    }

    // Cargar filtros maestros estáticos
    const filterKeys = ['q', 'categoria', 'ciudad', 'min_budget', 'max_budget', 'status', 'solo_futuros'];
    const hasFilters = Array.from(searchParams.keys()).some(key => filterKeys.includes(key));

    const pFiltros = cargarFiltrosEstaticos(hasFilters).then(() => {
        // Setear los selectores una vez sus opciones existen en el DOM
        if (searchParams.has('categoria')) selectCategoria.value = searchParams.get('categoria');
        if (searchParams.has('ciudad')) selectCiudad.value = searchParams.get('ciudad');
        renderActiveFilters();
    });

    const pTopEventos = cargarTopEventos();
    const pEventos = cargarEventos(true, searchParams.toString());

    await Promise.all([pFiltros, pTopEventos, pEventos]);

    // Activar animaciones de contadores del Banner
    setupBannerStatsAnimations();

    // 2. Registrar Event Listeners de Filtros Principales (Sticky Bar)
    
    // Búsqueda de texto (Debounce 450ms)
    inputBuscar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            cargarEventos(false);
        }, 450);
    });

    // Selects con disparo inmediato
    selectCategoria.addEventListener('change', () => cargarEventos(false));
    selectCiudad.addEventListener('change', () => cargarEventos(false));

    // 3. Modal Filtros Avanzados - Abrir/Cerrar
    const cerrarModal = () => {
        modalOverlay.classList.remove('active');
        modalPanel.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
    };

    btnAbrirFiltros.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        modalPanel.classList.add('active');
        document.body.classList.add('overflow-hidden');
    });

    btnCerrarFiltros.addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', cerrarModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalPanel.classList.contains('active')) {
            cerrarModal();
        }
    });

    // 4. Modal Filtros Avanzados - Budget Preset Buttons
    btnPresetPrices.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            const isActive = btn.classList.contains('chip-active');

            if (isActive) {
                inputPrecioMin.value = '';
                inputPrecioMax.value = '';
                clearPresets();
            } else {
                selectPreset(preset);
                if (preset === 'eco') {
                    inputPrecioMin.value = '0';
                    inputPrecioMax.value = '500';
                } else if (preset === 'std') {
                    inputPrecioMin.value = '500';
                    inputPrecioMax.value = '2000';
                } else if (preset === 'premium') {
                    inputPrecioMin.value = '2000';
                    inputPrecioMax.value = '';
                }
            }
        });
    });

    // Desactivar preset chips si el usuario edita los inputs manualmente
    [inputPrecioMin, inputPrecioMax].forEach(input => {
        input.addEventListener('input', clearPresets);
    });

    // 5. Modal Filtros Avanzados - Aplicar y Restablecer
    btnModalAplicar.addEventListener('click', () => {
        cerrarModal();
        cargarEventos(false);
    });

    btnModalLimpiar.addEventListener('click', () => {
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        inputSoloAbiertos.checked = false;
        inputSoloFuturos.checked = false;
        clearPresets();
        actualizarBadgeFiltrosAvanzados();
        showToast('Filtros avanzados restablecidos.');
    });

    // Botón Limpiar Todos (Chips activos)
    btnLimpiarFiltros.addEventListener('click', () => {
        filtrosForm.reset();
        inputBuscar.value = '';
        selectCategoria.value = '';
        selectCiudad.value = '';
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        inputSoloAbiertos.checked = false;
        inputSoloFuturos.checked = false;
        clearPresets();
        actualizarBadgeFiltrosAvanzados();
        
        cargarEventos(false);
        showToast('Todos los filtros se han limpiado.');
    });

    // 6. Modal Detalle de Evento - Abrir y Cerrar
    const handleCardClick = (e) => {
        const article = e.target.closest('article');
        if (!article) return;
        
        // Evitar abrir modal si se hace clic en elementos con .no-card-click
        if (e.target.closest('.no-card-click') || e.target.classList.contains('no-card-click')) {
            return;
        }
        
        const eventId = article.getAttribute('data-event-id');
        const variant = article.getAttribute('data-modal-variant');
        
        if (eventId) {
            openEventModal(eventId, variant);
        }
    };

    if (gridEventos) {
        gridEventos.addEventListener('click', handleCardClick);
    }
    if (topEventosContainer) {
        topEventosContainer.addEventListener('click', handleCardClick);
    }

    if (modalEventoOverlay) {
        modalEventoOverlay.addEventListener('click', closeEventModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalEventoPanel.classList.contains('active')) {
            closeEventModal();
        }
    });

    // Activar Scroll Infinito
    setupInfiniteScroll();
}

/**
 * Configura el Scroll Infinito usando IntersectionObserver en el sentinel
 */
function setupInfiniteScroll() {
    const sentinel = document.getElementById('sentinel-eventos');
    if (!sentinel) return;

    const observerOptions = {
        root: null,
        rootMargin: '250px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && currentPage < lastPage && !isLoadingMore) {
                currentPage++;
                cargarEventos(false, null, true);
            }
        });
    }, observerOptions);

    observer.observe(sentinel);
}

/**
 * Abre el modal premium con el detalle completo del evento
 */
function openEventModal(eventId, variant = null) {
    const event = eventosDataMap.get(eventId.toString());
    if (!event) {
        console.error(`Evento con ID ${eventId} no encontrado en memoria.`);
        return;
    }

    // Formatear presupuesto
    const isEstimated = !event.estimated_budget;
    const formattedBudget = event.estimated_budget ? parseFloat(event.estimated_budget).toLocaleString('es-BO') : 'A convenir';

    // Formatear fecha del evento en formato completo (sábado, 30 de mayo de 2026)
    const dateObj = event.event_date ? new Date(event.event_date) : new Date();
    let capitalizedDateStr = dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    if (capitalizedDateStr) {
        capitalizedDateStr = capitalizedDateStr.charAt(0).toUpperCase() + capitalizedDateStr.slice(1);
    }

    // Obtener iniciales
    const hostName = event.host?.name || 'Anfitrión';
    const initials = hostName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Obtener avatar del anfitrión (con fallback de iniciales)
    const hostAvatarHTML = event.host?.avatar_url
        ? `<img src="${BASE_URL}${event.host.avatar_url}" alt="${hostName}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm shrink-0">`
        : `<div class="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-black shrink-0 uppercase ring-2 ring-white dark:ring-zinc-800 shadow-sm">${initials}</div>`;

    // Construir el botón de acción según el estado
    const status = (event.status || 'abierto').toLowerCase();
    let actionBtnHTML = '';
    const reqAuthClass = !token ? 'requires-auth' : '';

    if (status === 'cerrado') {
        actionBtnHTML = `
            <span class="text-white/80 bg-white/10 px-4 py-2.5 sm:py-3 sm:px-5 rounded-[1.25rem] border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 select-none no-card-click">
                <i class="ph ph-lock-key text-sm"></i> Evento Finalizado
            </span>
        `;
    } else if (status === 'cancelado') {
        actionBtnHTML = ''; // Cancelado: Oculta el botón
    } else {
        // Abierto
        if (isHost) {
            actionBtnHTML = `
                <a href="/src/pages/anfitrion/dashboard.html" class="bg-white hover:bg-slate-50 text-slate-950 font-bold py-2.5 px-5 sm:py-3 sm:px-6 rounded-[1.25rem] transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer no-card-click select-none shadow-sm">
                    <span>Mi Dashboard</span>
                    <i class="ph ph-arrow-right text-xs sm:text-sm"></i>
                </a>
            `;
        } else {
            const waMessage = `Hola ${hostName}! Vi tu anuncio de evento "${event.title}" en FestiPro y me gustaría postularme como artista para cubrir tu show.`;
            const waLink = event.host?.whatsapp_number ? formatWhatsAppLink(event.host.whatsapp_number, waMessage) : '#';
            const waBtnClass = variant ? `btn-wa-${variant}` : 'btn-wa-premium';
            
            actionBtnHTML = `
                <a href="${waLink}" target="_blank" class="${waBtnClass} py-2.5 px-5 sm:py-3 sm:px-6 rounded-[1.25rem] transition-all active:scale-95 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none no-card-click ${reqAuthClass}">
                    <span>Contactar</span>
                    <!-- Estrellas para el efecto premium -->
                    <i class="ph-fill ph-star star-item star-1"></i>
                    <i class="ph-fill ph-star star-item star-2"></i>
                    <i class="ph-fill ph-star star-item star-3"></i>
                    <i class="ph-fill ph-star star-item star-4"></i>
                    <i class="ph-fill ph-star star-item star-5"></i>
                    <i class="ph-fill ph-star star-item star-6"></i>
                </a>
            `;
        }
    }

    // Determinar degradado de la Giant Pill inferior según la variante
    let pillBgClass = 'bg-gradient-to-r from-[#6c5ce7] to-[#9350FF] shadow-lg shadow-[#6c5ce7]/25 dark:from-[#5b4cb8] dark:to-[#7c3fdb]';
    if (variant === 'oro') {
        pillBgClass = 'bg-gradient-to-r from-amber-500 via-yellow-500 to-yellow-400 shadow-lg shadow-amber-500/25 dark:from-[#d97706] dark:to-[#eab308]';
    } else if (variant === 'plata') {
        pillBgClass = 'bg-gradient-to-r from-slate-500 to-slate-400 shadow-lg shadow-slate-500/25 dark:from-slate-600 dark:to-slate-500';
    } else if (variant === 'bronce') {
        pillBgClass = 'bg-gradient-to-r from-orange-600 to-amber-700 shadow-lg shadow-orange-600/25 dark:from-orange-700 dark:to-amber-900';
    }

    // Determinar estilo del contenedor del ícono de cabecera según la variante (suave sin bordes oscuros)
    let iconContainerClass = 'bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-100 dark:ring-indigo-500/20 shadow-xs text-[#6c5ce7] dark:text-[#9350FF]';
    let iconHTML = `<i class="ph-fill ph-briefcase text-xl"></i>`;
    if (variant === 'oro') {
        iconContainerClass = 'bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200/50 dark:ring-amber-500/20 shadow-xs text-amber-500';
        iconHTML = `<i class="ph-fill ph-medal text-xl"></i>`;
    } else if (variant === 'plata') {
        iconContainerClass = 'bg-slate-50 dark:bg-slate-500/10 ring-1 ring-slate-200/50 dark:ring-slate-500/20 shadow-xs text-slate-400';
        iconHTML = `<i class="ph-fill ph-medal text-xl"></i>`;
    } else if (variant === 'bronce') {
        iconContainerClass = 'bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-200/50 dark:ring-orange-500/20 shadow-xs text-orange-500';
        iconHTML = `<i class="ph-fill ph-medal text-xl"></i>`;
    }

    // Ribbon config based on status for the modal
    let modalRibbonHTML = '';
    if (status === 'abierto') {
        modalRibbonHTML = `
            <div class="absolute top-0 left-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                <div class="absolute top-[14px] -left-[22px] w-[95px] py-0.5 bg-gradient-to-r from-[#6c5ce7] to-[#9350FF] text-white text-[8px] font-black text-center uppercase tracking-widest -rotate-45 shadow-xs ribbon-shimmer-diagonal">
                    ABIERTO
                </div>
            </div>
        `;
    } else if (status === 'cerrado') {
        modalRibbonHTML = `
            <div class="absolute top-0 left-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                <div class="absolute top-[14px] -left-[22px] w-[95px] py-0.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white text-[8px] font-black text-center uppercase tracking-widest -rotate-45 shadow-xs">
                    CERRADO
                </div>
            </div>
        `;
    } else if (status === 'cancelado') {
        modalRibbonHTML = `
            <div class="absolute top-0 left-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                <div class="absolute top-[14px] -left-[22px] w-[95px] py-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[8px] font-black text-center uppercase tracking-widest -rotate-45 shadow-xs">
                    CANCELADO
                </div>
            </div>
        `;
    }

    // Resetear clases de variante en el panel
    modalEventoPanel.className = 'event-detail-panel spotlight-card';
    if (variant) {
        modalEventoPanel.classList.add(`modal-variant-${variant}`);
    }

    // Inyectar HTML
    modalEventoPanel.innerHTML = `
        ${modalRibbonHTML}

        <div class="p-7 sm:p-9 flex flex-col gap-5 sm:gap-6 font-sans relative select-none">
            <!-- Cabecera: Título Principal Equilibrado con el Maletín/Medalla y Botón de Cerrar -->
            <div class="flex items-start justify-between gap-3 sm:gap-4 animate-pill-in" style="animation-delay: 0.05s;">
                <div class="min-w-0 flex-1">
                    <h2 id="modal-evento-title" class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2">
                        ${event.title}
                    </h2>
                    <p class="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 sm:mt-2">
                        ${variant 
                            ? `<i class="ph-fill ph-star text-[11px] text-amber-500"></i> Evento Premium · ${variant.toUpperCase()}` 
                            : `<i class="ph-fill ph-megaphone text-[11px] text-[#6c5ce7] dark:text-[#9350FF]"></i> Oportunidad de Show`
                        }
                    </p>
                </div>
                
                <div class="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start">
                    <!-- Ícono premium en cabecera -->
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:scale-110 hover:rotate-12 transition-all duration-300 ${iconContainerClass}">
                        ${iconHTML}
                    </div>

                    <!-- Botón cerrar (X) -->
                    <button type="button" id="btn-cerrar-evento" class="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all border border-transparent dark:border-zinc-700 hover:rotate-90 active:scale-95 shadow-xs cursor-pointer" aria-label="Cerrar modal">
                        <i class="ph ph-x text-lg"></i>
                    </button>
                </div>
            </div>

            <!-- Bloque del Organizador: Perfil limpio y elegante -->
            <div class="flex items-center gap-3.5 bg-slate-50/50 dark:bg-zinc-800/20 p-3 rounded-2xl border border-slate-100/50 dark:border-zinc-700/30 animate-pill-in" style="animation-delay: 0.12s;">
                ${hostAvatarHTML}
                <div class="min-w-0">
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Organizador del Evento</p>
                    <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        ${hostName} <span class="text-[10px] sm:text-xs font-normal text-slate-400 dark:text-slate-500">· Publicado ${timeAgo(event.created_at).toLowerCase()}</span>
                    </p>
                </div>
            </div>

            <!-- Separador Editorial Fino -->
            <div class="h-px bg-slate-100 dark:bg-zinc-800/80 w-full my-0.5 animate-pill-in" style="animation-delay: 0.18s;"></div>

            <!-- Datos del Evento en Fila Simple -->
            <div class="flex flex-col gap-3.5 sm:gap-4 animate-pill-in" style="animation-delay: 0.22s;">
                <!-- Cuándo -->
                <div class="flex justify-between items-center group/row py-0.5">
                    <div class="flex items-center gap-2">
                        <i class="ph ph-calendar text-slate-400 dark:text-slate-500 text-base group-hover/row:text-[#6c5ce7] group-hover/row:scale-110 transition-all duration-300"></i>
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cuándo</span>
                    </div>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">${capitalizedDateStr}</span>
                </div>
                
                <!-- Lugar -->
                <div class="flex justify-between items-center group/row py-0.5">
                    <div class="flex items-center gap-2">
                        <i class="ph ph-map-pin text-slate-400 dark:text-slate-500 text-base group-hover/row:text-[#6c5ce7] group-hover/row:scale-110 transition-all duration-300"></i>
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lugar</span>
                    </div>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">${event.city?.name || 'Bolivia'}</span>
                </div>
                
                <!-- Buscamos -->
                <div class="flex justify-between items-center group/row py-0.5">
                    <div class="flex items-center gap-2">
                        <i class="ph ph-tag text-slate-400 dark:text-slate-500 text-base group-hover/row:text-[#6c5ce7] group-hover/row:scale-110 transition-all duration-300"></i>
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Buscamos</span>
                    </div>
                    <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]" title="${event.category?.name || 'Show'}">
                        ${event.category?.name || 'Show'}
                    </span>
                </div>
            </div>

            <!-- Nota o Mensaje del organizador -->
            <div class="border-t border-slate-100 dark:border-zinc-800/80 pt-4 animate-pill-in" style="animation-delay: 0.28s;">
                <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal overflow-y-auto max-h-[120px] pr-2 modal-detail-scrollable whitespace-pre-line italic">
                    "${event.description || 'No se proporcionaron detalles adicionales del requerimiento.'}"
                </p>
            </div>

            <!-- Bloque Inferior Contraste: Precio y CTA (Giant Pill) -->
            <div class="${pillBgClass} rounded-[1.75rem] p-3 sm:p-3.5 flex items-center justify-between mt-1.5 sm:mt-2 shadow-xl animate-pill-in" style="animation-delay: 0.35s;">
                <div class="pl-2.5">
                    <p class="text-[8px] sm:text-[9px] font-bold text-white/70 uppercase tracking-wider">Pago Neto</p>
                    <p class="text-xl sm:text-2xl font-black text-white leading-none mt-1">
                        ${formattedBudget} ${!isEstimated ? '<span class="text-xs sm:text-sm font-bold text-white/85">Bs.</span>' : ''}
                    </p>
                </div>
                <div class="flex items-center select-none">
                    ${actionBtnHTML}
                </div>
            </div>
        </div>
    `;

    // Agregar clase active para animar entrada
    modalEventoOverlay.classList.add('active');
    modalEventoPanel.classList.add('active');
    document.body.classList.add('overflow-hidden');

    // Agregar listener para cerrar
    const btnCerrar = modalEventoPanel.querySelector('#btn-cerrar-evento');
    btnCerrar.addEventListener('click', closeEventModal);

    // Activar el efecto de luz que sigue al mouse (spotlight)
    setupSpotlights();
}

function closeEventModal() {
    modalEventoOverlay.classList.remove('active');
    modalEventoPanel.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
}

// Ejecutar init al estar listo
document.addEventListener('DOMContentLoaded', init);
