import { apiClient } from '/src/assets/js/api-client.js';
import { showToast, setupSpotlights } from '/src/assets/js/utils.js';

// Base URL extraction for asset hosting
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://festipro-api.test/api').replace('/api', '');

// Global rating star texts config
const STAR_TEXTS = {
    '1': '1+ estrella (Básico)',
    '2': '2+ estrellas (Regular)',
    '3': '3+ estrellas (Bueno)',
    '4': '4+ estrellas (Muy bueno)',
    '5': '5 estrellas (¡Excelente!)'
};

// Global state
let categorias = [];
let ciudades = [];
let favoritosSet = new Set();
let debounceTimer;
let talentosAbortController = null;
let currentPage = 1;
let lastPage = 1;
let isLoadingMore = false;

// Advanced filters state
let ratingMinSelected = '';

// DOM Selectors - Main Filters
const inputBuscar = document.getElementById('filtro-buscar');
const selectCategoria = document.getElementById('filtro-categoria');
const selectCiudad = document.getElementById('filtro-ciudad');
const gridCatalogo = document.getElementById('catalogo-grid');
const resultadosConteo = document.getElementById('resultados-conteo');

// DOM Selectors - Active Chips
const activeFiltersContainer = document.getElementById('active-filters-container');
const activeFiltersList = document.getElementById('active-filters-list');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

// DOM Selectors - Modal Filtros
const btnAbrirFiltros = document.getElementById('btn-abrir-filtros');
const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
const modalOverlay = document.getElementById('modal-filtros-overlay');
const modalPanel = document.getElementById('modal-filtros-panel');
const btnModalLimpiar = document.getElementById('btn-modal-limpiar');
const btnModalAplicar = document.getElementById('btn-modal-aplicar');
const inputPrecioMin = document.getElementById('filtro-precio-min');
const inputPrecioMax = document.getElementById('filtro-precio-max');
const ratingRadios = document.querySelectorAll('input[name="filtro-rating-star"]');
const starTextIndicator = document.getElementById('star-text-indicator');
const filtroCountBadge = document.getElementById('filtro-count-badge');
const inputDisponibles = document.getElementById('filtro-disponibles');

// DOM Selectors - Tendencias
const seccionTendencias = document.getElementById('seccion-tendencias');
const tendenciasContainer = document.getElementById('tendencias-container');

// User Authentication details
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('user_role');
const isHost = token && (userRole === 'anfitrion' || userRole === 'anfitrión');
const isTalent = token && (userRole === 'talento' || userRole === 'talent');

/**
 * Obtiene la ruta completa de un asset
 */
function getAssetUrl(path, defaultImg) {
    if (!path) return defaultImg;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${BASE_URL}${path}`;
}

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
    gridCatalogo.innerHTML = Array.from({ length: 8 }).map(() => `
        <div class="bg-white dark:bg-fp-surface-dark rounded-3xl border border-slate-200/50 dark:border-fp-border-dark/50 shadow-xs overflow-hidden animate-pulse">
            <div class="h-44 bg-slate-200 dark:bg-fp-surface-dark/60"></div>
            <div class="p-5 space-y-3">
                <div class="flex gap-3">
                    <div class="w-9 h-9 rounded-full bg-slate-200 dark:bg-fp-surface-dark/60"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-md w-3/4"></div>
                        <div class="h-3 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-md w-1/2"></div>
                    </div>
                </div>
                <div class="space-y-1.5">
                    <div class="h-3 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-md w-full"></div>
                    <div class="h-3 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-md w-5/6"></div>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-fp-border-dark/40 flex justify-between items-center">
                    <div class="h-5 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-md w-1/3"></div>
                    <div class="h-8 bg-slate-200 dark:bg-fp-surface-dark/60 rounded-xl w-1/4"></div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Carga las listas de categorías y ciudades
 * @param {boolean} cargarGlobalTotal - Si es true, consulta el total de talentos para el banner.
 */
async function cargarFiltrosEstaticos(cargarGlobalTotal = true) {
    try {
        const promesas = [
            apiClient.get('/categorias'),
            apiClient.get('/ciudades')
        ];
        if (cargarGlobalTotal) {
            promesas.push(apiClient.get('/talentos'));
        }

        const resultados = await Promise.all(promesas);

        categorias = resultados[0]?.data || [];
        ciudades = resultados[1]?.data || [];

        // Actualizar data-target para count-up dinámico
        const elCiudades = document.getElementById('stat-ciudades');
        const elCategorias = document.getElementById('stat-categorias');

        if (elCiudades && ciudades.length > 0) elCiudades.setAttribute('data-target', ciudades.length);
        if (elCategorias && categorias.length > 0) elCategorias.setAttribute('data-target', categorias.length);

        if (cargarGlobalTotal && resultados[2]) {
            const resTal = resultados[2];
            const totalTalentos = resTal?.data?.total || resTal?.data?.data?.length || 0;
            const elTalentos = document.getElementById('stat-talentos');
            if (elTalentos && totalTalentos > 0) elTalentos.setAttribute('data-target', totalTalentos);
        }

        // Poblar categorias
        selectCategoria.innerHTML = '<option value="">Todas las Categorías</option>' +
            categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');

        // Poblar ciudades
        selectCiudad.innerHTML = '<option value="">Todas las Ciudades</option>' +
            ciudades.map(ciu => `<option value="${ciu.id}">${ciu.ciudad} (${ciu.departamento})</option>`).join('');

    } catch (error) {
        console.error('Error cargando filtros estáticos y estadísticas:', error);
        showToast('Error al conectar con los catálogos estáticos.', 'error');
    }
}

/**
 * Carga los favoritos del anfitrión si está logueado
 */
async function cargarFavoritosHost() {
    if (!isHost) return;
    try {
        const response = await apiClient.get('/anfitrion/favoritos');
        const favoritos = response?.data || [];
        favoritosSet = new Set(favoritos.map(fav => fav.talent_profile_id));
    } catch (error) {
        console.error('Error cargando favoritos de anfitrión:', error);
    }
}

/**
 * Guarda o elimina un talento de favoritos
 */
async function toggleFavorito(talentId, heartBtn) {
    if (!token) return;
    if (!isHost) {
        showToast('Solo los anfitriones pueden guardar favoritos.', 'error');
        return;
    }

    const isFav = favoritosSet.has(talentId);
    heartBtn.disabled = true;

    try {
        if (isFav) {
            await apiClient.delete(`/anfitrion/favoritos/${talentId}`);
            favoritosSet.delete(talentId);
            heartBtn.classList.remove('text-rose-550', 'scale-110');
            heartBtn.classList.add('text-slate-400');
            heartBtn.innerHTML = '<i class="ph ph-heart text-xl"></i>';
            showToast('Removido de favoritos.');
        } else {
            await apiClient.post(`/anfitrion/favoritos/${talentId}`);
            favoritosSet.add(talentId);
            heartBtn.classList.remove('text-slate-400');
            heartBtn.classList.add('text-rose-550', 'scale-110');
            heartBtn.innerHTML = '<i class="ph-fill ph-heart text-xl text-rose-500"></i>';
            showToast('Guardado en favoritos.');
        }
    } catch (error) {
        console.error('Error al actualizar favorito:', error);
        showToast('Error al procesar favoritos.', 'error');
    } finally {
        heartBtn.disabled = false;
    }
}

/**
 * Carga y renderiza los talentos de la API basándose en los filtros actuales.
 * @param {boolean} isFirstLoad - Si es true, usa esqueletos grises completos.
 * @param {string} initialQueryString - Si se proporciona, usa estos parámetros de URL directamente.
 */
async function cargarTalentos(isFirstLoad = false, initialQueryString = null, isLoadMore = false) {
    if (talentosAbortController && !isLoadMore) {
        talentosAbortController.abort();
    }
    
    if (!isLoadMore) {
        talentosAbortController = new AbortController();
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
        const ciudadVal = selectCiudad.value;
        const precioMinVal = inputPrecioMin.value;
        const precioMaxVal = inputPrecioMax.value;
        const ratingVal = ratingMinSelected;
        const soloDisponiblesVal = inputDisponibles?.checked;

        if (buscarVal) params.append('q', buscarVal);
        if (categoriaVal) params.append('categoria', categoriaVal);
        if (ciudadVal) params.append('ciudad', ciudadVal);
        if (precioMinVal) params.append('precio_min', precioMinVal);
        if (precioMaxVal) params.append('precio_max', precioMaxVal);
        if (ratingVal) params.append('rating_min', ratingVal);
        if (soloDisponiblesVal) params.append('solo_disponibles', 'true');
        
        params.append('page', currentPage);

        queryString = params.toString();
        
        if (!isLoadMore) {
            const newUrl = window.location.pathname + (queryString ? `?${queryString.replace(/&?page=\d+/, '')}` : '');
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }

        // Actualizar chips de filtros activos y conteo del badge modal
        renderActiveFilters();
        actualizarBadgeFiltrosAvanzados();
    } else {
        const params = new URLSearchParams(queryString);
        params.set('page', currentPage);
        queryString = params.toString();
    }

    const sentinel = document.getElementById('sentinel-catalogo');

    if (isFirstLoad) {
        renderSkeletons();
        if (sentinel) sentinel.innerHTML = '';
    } else if (isLoadMore) {
        if (sentinel) {
            sentinel.innerHTML = `
                <div class="flex flex-col items-center gap-2 animate-fade-in py-4 w-full">
                    <div class="w-8 h-8 rounded-full border-4 border-slate-200 border-t-fp-primary-light dark:border-zinc-800 dark:border-t-fp-primary-dark animate-spin"></div>
                    <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Cargando más artistas...</span>
                </div>
            `;
        }
    } else {
        gridCatalogo.style.transition = 'opacity 0.2s';
        gridCatalogo.style.opacity = '0.6';
        gridCatalogo.style.pointerEvents = 'none';
        if (sentinel) sentinel.innerHTML = '';
    }

    try {
        if (!isLoadMore) {
            resultadosConteo.textContent = 'Buscando talentos...';
        }
        const response = await apiClient.get(`/talentos?${queryString}`, { signal: talentosAbortController.signal });
        const paginator = response?.data;
        const talentos = paginator?.data || [];
        currentPage = paginator?.current_page || 1;
        lastPage = paginator?.last_page || 1;
        const total = paginator?.total || talentos.length;

        // Actualizar contador
        if (!isLoadMore) {
            resultadosConteo.innerHTML = `Hemos encontrado <span class="text-slate-900 dark:text-white font-extrabold text-sm mx-1">${total}</span> talentos disponibles`;
        }

        // Si se cargó sin filtros de búsqueda activos, este total representa el total general.
        // Lo seteamos en el banner para que la animación del contador funcione.
        const searchParams = new URLSearchParams(queryString || window.location.search);
        const filterKeys = ['q', 'categoria', 'ciudad', 'precio_min', 'precio_max', 'rating_min', 'solo_disponibles'];
        const hasFilters = Array.from(searchParams.keys()).some(key => filterKeys.includes(key));
        if (!isLoadMore && !hasFilters) {
            const elTalentos = document.getElementById('stat-talentos');
            if (elTalentos && total > 0) {
                elTalentos.setAttribute('data-target', total);
            }
        }

        if (talentos.length === 0 && !isLoadMore) {
            gridCatalogo.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-xs flex flex-col items-center animate-fade-in animate-card-fade">
                    <div class="text-5xl mb-4 text-slate-350 dark:text-slate-600"><i class="ph ph-smiley-sad"></i></div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-250 mb-2">No se encontraron artistas</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Intenta relajar los filtros de búsqueda o presiona Limpiar todos.</p>
                </div>
            `;
            if (sentinel) sentinel.innerHTML = '';
            gridCatalogo.style.opacity = '1';
            gridCatalogo.style.pointerEvents = 'auto';
            return;
        }

        const cardsHTML = talentos.map(talent => {
            const artisticName = talent.artistic_name || talent.user?.name;
            let avatarHTML = '';
            if (talent.user?.avatar_url && talent.user.avatar_url.trim() !== '') {
                const avatarUrl = getAssetUrl(talent.user.avatar_url);
                avatarHTML = `<img src="${avatarUrl}" alt="${artisticName}" loading="lazy" class="relative z-20 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border-[3px] border-white dark:border-[#1f1f1f] shadow-md bg-slate-100 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">`;
            } else {
                const initial = (artisticName || 'U').charAt(0).toUpperCase();
                const colors = [
                    'from-purple-500 to-indigo-600',
                    'from-blue-500 to-teal-600',
                    'from-pink-500 to-rose-600',
                    'from-orange-500 to-amber-600',
                    'from-emerald-500 to-teal-605',
                ];
                let sum = 0;
                const nameStr = artisticName || 'Usuario';
                for (let i = 0; i < nameStr.length; i++) {
                    sum += nameStr.charCodeAt(i);
                }
                const colorClass = colors[sum % colors.length];
                avatarHTML = `
                    <div class="relative z-20 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-extrabold text-lg sm:text-xl md:text-2xl border-[3px] border-white dark:border-[#1f1f1f] shadow-md flex-shrink-0 select-none transition-transform duration-300 group-hover:scale-105">
                        ${initial}
                    </div>
                `;
            }

            const categoryName = talent.category?.name || 'Artista';
            const cityName = talent.city?.name || 'Bolivia';
            const bio = talent.bio || 'Explora mi portafolio para conocer más sobre mi trabajo y shows en vivo.';
            const basePrice = talent.base_price ? `${parseFloat(talent.base_price).toLocaleString('es-BO')} Bs.` : 'A convenir';
            const ratingFloat = parseFloat(talent.average_rating || 0);
            const rating = ratingFloat > 0 ? ratingFloat.toFixed(1) : 'Nuevo';

            const statusBadgeHTML = talent.is_available 
                ? `
                    <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark text-white shadow-sm backdrop-blur-xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        Disponible
                    </span>
                ` 
                : `
                    <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-500/90 text-white shadow-sm backdrop-blur-xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        No disponible
                    </span>
                `;

            let bannerHTML = '';
            if (talent.banner_url) {
                const bannerUrl = getAssetUrl(talent.banner_url);
                bannerHTML = `
                    <img src="${bannerUrl}" 
                         alt="${artisticName}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         loading="lazy">
                `;
            } else {
                bannerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-fp-primary-light to-fp-accent-light relative flex items-center justify-center overflow-hidden">
                        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30"></div>
                        <span class="text-white/20 font-display font-extrabold text-2xl tracking-widest select-none transform -rotate-12 pointer-events-none">FestiPro ✦</span>
                    </div>
                `;
            }

            let heartHTML = '';
            if (!isTalent) {
                const isFav = favoritosSet.has(talent.id);
                const reqAuthClass = !token ? 'requires-auth' : '';
                heartHTML = `
                    <button data-talent-id="${talent.id}" class="heart-btn no-card-click absolute top-4 right-4 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-fp-surface-dark text-slate-445 hover:text-rose-500 shadow-md transition-all duration-300 hover:scale-110 active:scale-95 ${reqAuthClass} ${isFav ? 'text-rose-550 scale-110' : 'text-slate-455'}" title="Agregar a favoritos">
                        ${isFav ? '<i class="ph-fill ph-heart text-xl text-rose-500"></i>' : '<i class="ph ph-heart text-xl"></i>'}
                    </button>
                `;
            }

            let contactBtnHTML = '';
            if (isTalent) {
                contactBtnHTML = `
                    <button disabled class="relative z-20 btn-wa-premium no-card-click w-full py-2 bg-slate-100 dark:bg-fp-surface-dark text-slate-455 dark:text-slate-500 font-bold text-[10px] sm:text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1" title="Opción no disponible entre artistas">
                        <i class="ph ph-lock text-sm"></i> Privado
                    </button>
                `;
            } else {
                const reqAuthClass = !token ? 'requires-auth' : '';
                const waMessage = `Hola ${artisticName}! Vi tu perfil en FestiPro y me gustaría cotizar un show para mi próximo evento.`;
                const waLink = talent.user?.whatsapp_number ? formatWhatsAppLink(talent.user.whatsapp_number, waMessage) : '#';

                contactBtnHTML = `
                    <a href="${waLink}" target="_blank" class="relative z-20 btn-wa-premium no-card-click w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] sm:text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-1 shadow-sm ${reqAuthClass}">
                        <i class="ph-fill ph-whatsapp text-sm"></i> Contactar
                    </a>
                `;
            }

            return `
                <article class="catalog-card spotlight-card group relative rounded-3xl overflow-hidden flex flex-col h-full cursor-pointer" onclick="if(!event.target.closest('.no-card-click')) window.location.href='/src/pages/publico/perfil/perfil-talento.html?id=${talent.id}'">
                    ${heartHTML}

                    <div class="relative z-20 h-24 sm:h-44 overflow-hidden bg-slate-100 dark:bg-fp-surface-dark flex items-center justify-center">
                        ${bannerHTML}
                        ${statusBadgeHTML}
                        <span class="absolute bottom-3 right-4 inline-flex items-center gap-1 px-2.5 py-0.75 rounded-md text-[9px] font-extrabold bg-white/70 dark:bg-fp-surface-dark/70 text-slate-800 dark:text-white shadow-xs backdrop-blur-xs">
                            ${categoryName}
                        </span>
                    </div>

                    <div class="relative px-3.5 sm:px-5 z-30 flex justify-center sm:justify-start">
                        <div class="absolute -top-7 sm:-top-8 md:-top-10 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0">
                            ${avatarHTML}
                        </div>
                    </div>

                    <div class="p-3.5 pt-7 sm:p-5 sm:pt-10 md:pt-12 flex flex-col flex-grow">
                        <div class="mb-2 sm:mb-3">
                            <h3 class="font-display font-black text-sm sm:text-base md:text-[19px] text-slate-955 dark:text-white leading-tight truncate tracking-tight text-center sm:text-left">
                                ${artisticName}
                            </h3>
                            <div class="flex flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.75 bg-slate-100 dark:bg-zinc-800/80 text-slate-655 dark:text-zinc-200 border border-slate-200/40 dark:border-zinc-700/50 rounded-full text-[9px] sm:text-[10px] font-bold w-fit">
                                    <i class="ph-fill ph-map-pin text-slate-400 dark:text-zinc-400"></i> ${cityName}
                                </span>
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.75 bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[9px] sm:text-[10px] font-extrabold w-fit">
                                    <i class="ph-fill ph-star text-[11px]"></i> ${rating}
                                </span>
                            </div>
                        </div>

                        <p class="text-xs text-slate-655 dark:text-slate-300 line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2 sm:mb-2.5 sm:flex-grow text-center sm:text-left">
                            ${bio}
                        </p>

                        <div class="pt-2 border-t border-slate-100 dark:border-fp-border-dark/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2.5 mt-auto">
                            <div class="flex flex-row items-center justify-center gap-1 sm:flex-col sm:items-start sm:justify-start sm:gap-0 text-center sm:text-left">
                                <span class="text-[8px] sm:text-[9px] text-slate-455 dark:text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">Tarifa desde</span>
                                <span class="text-[11px] sm:text-base md:text-lg font-black leading-none mt-0 sm:mt-1 catalog-card-price whitespace-nowrap">
                                    ${basePrice}
                                </span>
                            </div>
                            
                            <div class="w-full sm:w-28 sm:w-32 flex-shrink-0">
                                ${contactBtnHTML}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        if (isLoadMore) {
            gridCatalogo.insertAdjacentHTML('beforeend', cardsHTML);
        } else {
            gridCatalogo.innerHTML = cardsHTML;
        }

        // Re-asignar listeners a botones
        asignarCardListeners();
        
        // Re-inicializar efectos spotlight en las nuevas tarjetas
        setupSpotlights();

        // Inicializar animaciones de entrada reveal escalonadas
        setupScrollReveal();

        // Actualizar mensaje del sentinel
        if (sentinel) {
            if (currentPage >= lastPage) {
                sentinel.innerHTML = `
                    <div class="text-center py-6 animate-fade-in w-full">
                        <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            ✦ Fin del catálogo · Has visto todos los artistas ✦
                        </span>
                    </div>
                `;
            } else {
                sentinel.innerHTML = '';
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            return; // Silenciar cancelaciones
        }
        console.error('Error al cargar talentos:', error);
        if (isLoadMore) {
            if (sentinel) {
                sentinel.innerHTML = `
                    <div class="text-center py-4 animate-fade-in w-full">
                        <button id="btn-reintentar-talentos" class="text-xs font-extrabold text-rose-500 hover:underline">
                            Error al cargar más. Haz clic aquí para reintentar.
                        </button>
                    </div>
                `;
                document.getElementById('btn-reintentar-talentos')?.addEventListener('click', () => {
                    cargarTalentos(false, null, true);
                });
            }
        } else {
            resultadosConteo.textContent = 'Error al cargar los talentos';
            gridCatalogo.innerHTML = `
                <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 rounded-3xl flex flex-col items-center animate-fade-in">
                    <div class="text-4xl mb-3 text-red-500"><i class="ph-fill ph-warning"></i></div>
                    <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar artistas</h3>
                    <p class="text-sm text-red-650 dark:text-red-400">Por favor, comprueba tu conexión y vuelve a intentarlo.</p>
                </div>
            `;
            if (sentinel) sentinel.innerHTML = '';
        }
    } finally {
        isLoadingMore = false;
        gridCatalogo.style.opacity = '1';
        gridCatalogo.style.pointerEvents = 'auto';
    }
}

/**
 * Carga los 3 talentos estrella (Top en Tendencia)
 */
async function cargarTopTendencia() {
    try {
        const response = await apiClient.get('/talentos/top');
        const topTalentos = response?.data || [];

        if (topTalentos.length === 0) {
            seccionTendencias.classList.add('hidden');
            return;
        }

        seccionTendencias.classList.remove('hidden');

        const medallas = [
            { icon: '<i class="ph-fill ph-trophy"></i>', class: 'oro' },
            { icon: '<i class="ph-fill ph-trophy"></i>', class: 'plata' },
            { icon: '<i class="ph-fill ph-trophy"></i>', class: 'bronce' }
        ];

        tendenciasContainer.innerHTML = topTalentos.map((talent, idx) => {
            const artisticName = talent.artistic_name || talent.user?.name;
            const categoryName = talent.category?.name || 'Artista';
            const cityName = talent.city?.name || 'Bolivia';
            const views = talent.profile_views || 0;
            const ratingFloat = parseFloat(talent.average_rating || 0);
            const rating = ratingFloat > 0 ? ratingFloat.toFixed(1) : 'Nuevo';

            const medal = medallas[idx] || medallas[2];

            let avatarHTML = '';
            if (talent.user?.avatar_url && talent.user.avatar_url.trim() !== '') {
                const avatarUrl = getAssetUrl(talent.user.avatar_url);
                avatarHTML = `<img src="${avatarUrl}" alt="${artisticName}" class="w-full h-full object-cover">`;
            } else {
                const initial = (artisticName || 'U').charAt(0).toUpperCase();
                const colors = [
                    'from-purple-500 to-indigo-600',
                    'from-blue-500 to-teal-600',
                    'from-pink-500 to-rose-600',
                    'from-orange-500 to-amber-600',
                    'from-emerald-500 to-teal-650',
                ];
                let sum = 0;
                const nameStr = artisticName || 'Usuario';
                for (let i = 0; i < nameStr.length; i++) {
                    sum += nameStr.charCodeAt(i);
                }
                const colorClass = colors[sum % colors.length];
                avatarHTML = `
                    <div class="w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-extrabold text-2xl select-none">
                        ${initial}
                    </div>
                `;
            }

            return `
                <article class="trending-card-horizontal spotlight-card group relative rounded-3xl p-5 flex gap-5 items-center cursor-pointer glow-${medal.class} transition-all duration-300 animate-fade-in" 
                         onclick="window.location.href='/src/pages/publico/perfil/perfil-talento.html?id=${talent.id}'"
                         style="animation-delay: ${idx * 150}ms">
                    
                    <!-- Shimmer premium -->
                    <div class="card-shimmer"></div>

                    <!-- Medalla en contenedor flotante 3D -->
                    <div class="medal-container">
                        <div class="medal-badge medal-${medal.class}">
                            <span class="medal-icon">${medal.icon}</span>
                        </div>
                    </div>

                    <!-- Foto de perfil Squircle premium -->
                    <div class="relative z-20 w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white dark:border-fp-border-dark/60 shadow-md">
                        ${avatarHTML}
                    </div>

                    <!-- Datos del talento -->
                    <div class="relative z-20 flex-grow min-w-0">
                        <div class="flex items-center justify-between gap-3 mb-1">
                            <h3 class="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate tracking-tight">
                                ${artisticName}
                            </h3>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-fp-primary-light/10 text-fp-primary-light dark:bg-fp-primary-dark/20 dark:text-fp-primary-dark flex-shrink-0 uppercase tracking-wider badge-${medal.class}">
                                ${categoryName}
                            </span>
                        </div>
                        
                        <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                            <i class="ph-fill ph-map-pin text-[13px] text-slate-400"></i> ${cityName}
                        </p>
                        
                        <div class="flex items-center gap-4 border-t border-slate-200 dark:border-fp-border-dark/60 pt-2 flex-wrap">
                            <span class="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <i class="ph-fill ph-star text-amber-500 text-sm"></i> ${rating}
                            </span>
                            <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <i class="ph ph-eye text-sm"></i> ${views} vistas
                            </span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar talentos en tendencia:', error);
        seccionTendencias.classList.add('hidden'); // Fallback silencioso para no dañar UX
    }
}

/**
 * Asigna eventos a los botones dinámicos en las tarjetas
 */
function asignarCardListeners() {
    document.querySelectorAll('.heart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-talent-id');
            toggleFavorito(id, btn);
        });
    });
}

/**
 * Pinta los chips de filtros activos en la barra
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
        list.push({ key: 'precio_min', label: `Mín: ${inputPrecioMin.value} Bs.`, el: inputPrecioMin });
    }
    if (inputPrecioMax.value) {
        list.push({ key: 'precio_max', label: `Máx: ${inputPrecioMax.value} Bs.`, el: inputPrecioMax });
    }
    if (ratingMinSelected) {
        list.push({ key: 'rating_min', label: `Calif: ${ratingMinSelected}★+`, el: null });
    }
    if (inputDisponibles && inputDisponibles.checked) {
        list.push({ key: 'solo_disponibles', label: `Solo Disponibles`, el: inputDisponibles });
    }

    if (list.length === 0) {
        activeFiltersContainer.classList.add('hidden');
        activeFiltersList.innerHTML = '';
        return;
    }

    activeFiltersContainer.classList.remove('hidden');
    activeFiltersList.innerHTML = list.map(item => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-fp-primary-light/10 text-fp-primary-light dark:bg-fp-primary-dark/15 dark:text-fp-primary-dark border border-fp-primary-light/20 dark:border-fp-primary-dark/20 animate-fade-in">
            ${item.label}
            <button data-clear-filter="${item.key}" class="hover:text-rose-500 font-extrabold ml-0.5 cursor-pointer flex items-center justify-center"><i class="ph-fill ph-x-circle text-[13px]"></i></button>
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
                } else if (key === 'rating_min') {
                    ratingMinSelected = '';
                    resetRatingStars();
                }
                cargarTalentos(false);
            }
        });
    });
}

/**
 * Resetea visualmente los inputs de estrellas
 */
function resetRatingStars() {
    ratingRadios.forEach(radio => {
        radio.checked = false;
    });
    starTextIndicator.textContent = 'Cualquier calificación';
}

/**
 * Actualiza el contador badge en el botón Filtros
 */
function actualizarBadgeFiltrosAvanzados() {
    let count = 0;
    if (inputPrecioMin.value) count++;
    if (inputPrecioMax.value) count++;
    if (ratingMinSelected) count++;
    if (inputDisponibles && inputDisponibles.checked) count++;

    if (count > 0) {
        filtroCountBadge.textContent = count;
        filtroCountBadge.classList.remove('hidden');
    } else {
        filtroCountBadge.textContent = '0';
        filtroCountBadge.classList.add('hidden');
    }
}

/**
 * Configura la animación scroll reveal para las tarjetas del catálogo
 */
function setupScrollReveal() {
    const cards = document.querySelectorAll('.catalog-card');
    
    const observerOptions = {
        root: null,
        threshold: 0.05,
        rootMargin: '50px 0px 50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                // Efecto de stagger escalonado
                setTimeout(() => {
                    entry.target.classList.add('catalog-card-visible');
                }, idx * 70);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
}

/**
 * Configura el count-up en los stats del Banner
 */
function setupBannerStatsAnimations() {
    const statsElements = [
        document.getElementById('stat-talentos'),
        document.getElementById('stat-ciudades'),
        document.getElementById('stat-categorias')
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
    
    const suffix = (el.id === 'stat-talentos' || el.id === 'stat-categorias') ? '+' : '';
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing cuadrático de salida (frena al final)
        const ease = progress * (2 - progress);
        const currentVal = Math.floor(ease * target);
        
        el.textContent = currentVal + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target + suffix;
        }
    }
    requestAnimationFrame(update);
}

/**
 * Inicialización de la Página (Punto de entrada)
 */
async function init() {
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

    // Disponibilidad Icon helper
    const updateCheckIconColor = () => {
        const icon = document.getElementById('icon-modal-check');
        if (icon && inputDisponibles) {
            if (inputDisponibles.checked) {
                icon.classList.remove('text-slate-400', 'dark:text-slate-500');
                icon.classList.add('text-emerald-500', 'dark:text-emerald-450');
            } else {
                icon.classList.remove('text-emerald-500', 'dark:text-emerald-450');
                icon.classList.add('text-slate-400', 'dark:text-slate-500');
            }
        }
    };

    // Setear parámetros en los inputs inmediatamente
    if (searchParams.has('q')) inputBuscar.value = searchParams.get('q');
    if (searchParams.has('precio_min')) inputPrecioMin.value = searchParams.get('precio_min');
    if (searchParams.has('precio_max')) inputPrecioMax.value = searchParams.get('precio_max');
    if (searchParams.has('solo_disponibles')) {
        const val = searchParams.get('solo_disponibles') === 'true';
        if (inputDisponibles) inputDisponibles.checked = val;
    }
    updateCheckIconColor();
    
    // Check if initial prices match presets
    const initialMin = inputPrecioMin.value;
    const initialMax = inputPrecioMax.value;
    if ((initialMin === '0' || initialMin === '') && initialMax === '1000') {
        selectPreset('eco');
    } else if (initialMin === '1000' && initialMax === '1500') {
        selectPreset('std');
    } else if (initialMin === '5000' && initialMax === '') {
        selectPreset('premium');
    }

    if (searchParams.has('rating_min')) {
        ratingMinSelected = searchParams.get('rating_min');
        const radio = document.querySelector(`input[name="filtro-rating-star"][value="${ratingMinSelected}"]`);
        if (radio) {
            radio.checked = true;
            starTextIndicator.textContent = STAR_TEXTS[ratingMinSelected] || 'Cualquier calificación';
        }
    }

    // 1. Cargar filtros maestros estáticos
    const filterKeys = ['q', 'categoria', 'ciudad', 'precio_min', 'precio_max', 'rating_min', 'solo_disponibles'];
    const hasFilters = Array.from(searchParams.keys()).some(key => filterKeys.includes(key));

    const pFiltros = cargarFiltrosEstaticos(hasFilters).then(() => {
        if (searchParams.has('categoria')) selectCategoria.value = searchParams.get('categoria');
        if (searchParams.has('ciudad')) selectCiudad.value = searchParams.get('ciudad');
        renderActiveFilters();
    });

    const pFavoritos = cargarFavoritosHost();
    const pTendencias = cargarTopTendencia();
    
    // QA FIX: Esperamos a que los favoritos carguen primero ANTES de pedir los talentos
    // Así evitamos la "condición de carrera" donde el catálogo se dibuja antes de saber si tiene corazones.
    await pFavoritos;
    
    const pTalentos = cargarTalentos(true, searchParams.toString());

    await Promise.all([pFiltros, pTendencias, pTalentos]);

    // 2. Activar animaciones de contadores del Banner
    setupBannerStatsAnimations();

    // 3. Registrar Event Listeners de Filtros Principales (Sticky Bar)
    
    // Búsqueda de texto con debounce para no saturar base de datos
    inputBuscar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            cargarTalentos(false);
        }, 450);
    });

    selectCategoria.addEventListener('change', () => cargarTalentos(false));
    selectCiudad.addEventListener('change', () => cargarTalentos(false));

    // 4. Modal Filtros Avanzados - Abrir/Cerrar
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

    // 4.5. Modal Filtros Avanzados - Budget Preset Buttons
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
                    inputPrecioMax.value = '1000';
                } else if (preset === 'std') {
                    inputPrecioMin.value = '1000';
                    inputPrecioMax.value = '1500';
                } else if (preset === 'premium') {
                    inputPrecioMin.value = '5000';
                    inputPrecioMax.value = '';
                }
            }
        });
    });

    // Desactivar preset chips si el usuario edita los inputs manualmente
    [inputPrecioMin, inputPrecioMax].forEach(input => {
        input.addEventListener('input', clearPresets);
    });

    // 5. Modal Filtros Avanzados - Selección de Calificación (Estrellas)
    ratingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            ratingMinSelected = val;
            
            starTextIndicator.textContent = STAR_TEXTS[val] || 'Cualquier calificación';

            // Micro-animación en la estrella pulsada
            const label = document.querySelector(`label[for="${e.target.id}"]`);
            const icon = label?.querySelector('i');
            if (icon) {
                icon.classList.add('star-pop');
                setTimeout(() => icon.classList.remove('star-pop'), 400);
            }
        });
    });

    // 6. Modal Filtros Avanzados - Aplicar y Restablecer
    btnModalAplicar.addEventListener('click', () => {
        cerrarModal();
        cargarTalentos(false);
    });

    if (inputDisponibles) {
        inputDisponibles.addEventListener('change', updateCheckIconColor);
    }

    btnModalLimpiar.addEventListener('click', () => {
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        ratingMinSelected = '';
        if (inputDisponibles) inputDisponibles.checked = false;
        resetRatingStars();
        clearPresets();
        updateCheckIconColor();
        actualizarBadgeFiltrosAvanzados();
        showToast('Filtros del modal restablecidos.');
    });

    // 7. Botón Limpiar Todos (Chips activos)
    btnLimpiarFiltros.addEventListener('click', () => {
        inputBuscar.value = '';
        selectCategoria.value = '';
        selectCiudad.value = '';
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        ratingMinSelected = '';
        if (inputDisponibles) inputDisponibles.checked = false;
        resetRatingStars();
        clearPresets();
        updateCheckIconColor();
        actualizarBadgeFiltrosAvanzados();
        
        cargarTalentos(false);
        showToast('Todos los filtros se han limpiado.');
    });

    // 8. Activar Scroll Infinito
    setupInfiniteScroll();
}

/**
 * Configura el Scroll Infinito usando IntersectionObserver en el sentinel
 */
function setupInfiniteScroll() {
    const sentinel = document.getElementById('sentinel-catalogo');
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
                cargarTalentos(false, null, true);
            }
        });
    }, observerOptions);

    observer.observe(sentinel);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

