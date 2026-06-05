import { apiClient } from '/src/assets/js/api-client.js';
import { showToast } from '/src/assets/js/utils.js';

// Base API URL extraction for asset hosting
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

// Gradient options for empty banners
const GRADIENTS = [
    'from-indigo-950 via-purple-900 to-slate-900',
    'from-slate-950 via-slate-900 to-zinc-900',
    'from-violet-950 via-indigo-950 to-slate-955',
    'from-fuchsia-950 via-purple-900 to-slate-950',
    'from-emerald-950 via-teal-900 to-slate-950',
    'from-rose-950 via-pink-950 to-slate-950'
];

// Global state
let categorias = [];
let ciudades = [];
let favoritosSet = new Set();
let debounceTimer;

// DOM Selectors
const filtrosForm = document.getElementById('filtros-form');
const inputBuscar = document.getElementById('filtro-buscar');
const selectCategoria = document.getElementById('filtro-categoria');
const selectCiudad = document.getElementById('filtro-ciudad');
const inputPrecioMin = document.getElementById('filtro-precio-min');
const inputPrecioMax = document.getElementById('filtro-precio-max');
const gridCatalogo = document.getElementById('catalogo-grid');

const activeFiltersContainer = document.getElementById('active-filters-container');
const activeFiltersList = document.getElementById('active-filters-list');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

// Modal de Filtros Avanzados DOM
const modalFiltros = document.getElementById('modal-filtros');
const btnMostrarFiltros = document.getElementById('btn-mostrar-filtros');
const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
const btnLimpiarModal = document.getElementById('btn-limpiar-modal');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
const filtrosBadge = document.getElementById('filtros-badge');
const checkSoloDisponibles = document.getElementById('filtro-solo-disponibles');

// Contenedores de Top en Tendencia DOM
const topTendenciaSeccion = document.getElementById('top-tendencia-seccion');
const topTendenciaGrid = document.getElementById('top-tendencia-grid');



// User Authentication details
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('user_role');
const isAdmin = localStorage.getItem('is_admin') === 'true';

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
 * Convierte un link normal de YouTube en link embed
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    let videoId = '';
    try {
        if (url.includes('youtube.com/watch')) {
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/v/')) {
            videoId = url.split('youtube.com/v/')[1]?.split('?')[0];
        }
    } catch (e) {
        console.error('Error parsing YouTube URL:', e);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
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
        <div class="bg-white dark:bg-fp-surface-dark rounded-2xl border border-slate-100 dark:border-fp-border-dark shadow-sm overflow-hidden animate-pulse">
            <div class="h-48 bg-slate-200 dark:bg-fp-surface-muted-dark"></div>
            <div class="p-6 space-y-4">
                <div class="flex gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-fp-surface-muted-dark"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-3/4"></div>
                        <div class="h-3 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-1/2"></div>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="h-3 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-full"></div>
                    <div class="h-3 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-5/6"></div>
                </div>
                <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex justify-between items-center">
                    <div class="h-5 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-md w-1/3"></div>
                    <div class="h-8 bg-slate-200 dark:bg-fp-surface-muted-dark rounded-xl w-1/4"></div>
                </div>
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
    if (!token) {
        // Dejar que el interceptor global redireccione a login
        return;
    }
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
            heartBtn.innerHTML = '♡';
            showToast('Removido de favoritos.');
        } else {
            await apiClient.post(`/anfitrion/favoritos/${talentId}`);
            favoritosSet.add(talentId);
            heartBtn.classList.remove('text-slate-400');
            heartBtn.classList.add('text-rose-550', 'scale-110');
            heartBtn.innerHTML = '♥';
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
 * @param {boolean} isFirstLoad - Si es true, usa esqueletos grises completos. Si es false, solo reduce opacidad para evitar parpadeos (Lag visual).
 * @param {string} initialQueryString - Si se proporciona, usa estos parámetros de URL directamente sin consultar el DOM (optimización para carga inicial paralela).
 */
async function cargarTalentos(isFirstLoad = false, initialQueryString = null) {
    if (isFirstLoad) {
        renderSkeletons();
    } else {
        gridCatalogo.style.transition = 'opacity 0.2s';
        gridCatalogo.style.opacity = '0.6';
        gridCatalogo.style.pointerEvents = 'none';
    }

    let queryString = initialQueryString;

    if (queryString === null) {
        const params = new URLSearchParams();
        
        const buscarVal = inputBuscar.value.trim();
        const categoriaVal = selectCategoria.value;
        const ciudadVal = selectCiudad.value;
        const precioMinVal = inputPrecioMin.value;
        const precioMaxVal = inputPrecioMax.value;

        // Capturar filtros del modal
        const radioPuntuacion = document.querySelector('input[name="filtro-puntuacion"]:checked');
        const puntuacionVal = radioPuntuacion ? radioPuntuacion.value : '';
        const soloDisponiblesVal = checkSoloDisponibles.checked ? 'true' : 'false';

        if (buscarVal) params.append('q', buscarVal);
        if (categoriaVal) params.append('categoria', categoriaVal);
        if (ciudadVal) params.append('ciudad', ciudadVal);
        if (precioMinVal) params.append('precio_min', precioMinVal);
        if (precioMaxVal) params.append('precio_max', precioMaxVal);
        if (puntuacionVal) params.append('puntuacion', puntuacionVal);
        if (soloDisponiblesVal === 'true') params.append('solo_disponibles', 'true');

        // Actualizar badge de cantidad de filtros avanzados
        let activeCount = 0;
        if (precioMinVal) activeCount++;
        if (precioMaxVal) activeCount++;
        if (puntuacionVal) activeCount++;
        if (soloDisponiblesVal === 'true') activeCount++;
        
        if (activeCount > 0) {
            filtrosBadge.textContent = activeCount;
            filtrosBadge.classList.remove('hidden');
        } else {
            filtrosBadge.classList.add('hidden');
        }

        // Actualizar URL sin recargar para soportar filtros compartibles
        queryString = params.toString();
        const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
        window.history.replaceState({ path: newUrl }, '', newUrl);

        // Actualizar tags de filtros activos
        renderActiveFilters();
    }

    try {
        const response = await apiClient.get(`/talentos?${queryString}`);
        const talentos = response?.data?.data || [];

        // Actualizar contadores del Hero dinámicamente
        const totalTalentos = response?.data?.total || talentos.length;
        const counterTalentos = document.getElementById('counter-talentos');
        if (counterTalentos) {
            counterTalentos.textContent = totalTalentos > 0 ? `${totalTalentos}+` : '0';
        }
        const counterCiudades = document.getElementById('counter-ciudades');
        if (counterCiudades) {
            counterCiudades.textContent = ciudades.length > 0 ? ciudades.length : '9';
        }

        // Renderizar Top Tendencia (Máximo 3 ordenados por profile_views desc)
        if (talentos.length > 0) {
            const topTalentos = [...talentos]
                .sort((a, b) => (b.profile_views || 0) - (a.profile_views || 0))
                .slice(0, 3);
            
            const medals = [
                { icon: '🥇', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-300 border border-amber-200/40 dark:border-amber-900/40', text: '1° Tendencia' },
                { icon: '🥈', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-355 border border-slate-200/40 dark:border-slate-800/40', text: '2° Tendencia' },
                { icon: '🥉', bg: 'bg-orange-100 text-orange-700 dark:bg-orange-955/40 dark:text-orange-355 border border-orange-200/40 dark:border-orange-900/40', text: '3° Tendencia' }
            ];

            topTendenciaGrid.innerHTML = topTalentos.map((talent, index) => {
                const avatarUrl = getAssetUrl(talent.user?.avatar_url, `https://picsum.photos/seed/avatar_${talent.id}/150/150`);
                const artisticName = talent.artistic_name || talent.user?.name;
                const categoryName = talent.category?.name || 'Artista';
                const rating = parseFloat(talent.average_rating || 0).toFixed(1);
                const medal = medals[index];
                const views = talent.profile_views || 0;

                return `
                    <article data-talent-id="${talent.id}" class="clickable-card flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-fp-surface-dark/60 border border-white/40 dark:border-fp-border-dark/40 hover:border-fp-primary-light/35 dark:hover:border-fp-primary-dark/35 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer">
                        <!-- Medalla flotante -->
                        <div class="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${medal.bg}">
                            <span>${medal.icon}</span>
                            <span>${medal.text}</span>
                        </div>
                        
                        <!-- Avatar -->
                        <div class="relative w-14 h-14 rounded-full overflow-hidden border border-fp-primary-light/30 dark:border-fp-primary-dark/30 flex-shrink-0">
                            <img src="${avatarUrl}" alt="${artisticName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        </div>

                        <!-- Info -->
                        <div class="min-w-0 flex-1 pr-16">
                            <h3 class="font-display font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors">
                                ${artisticName}
                            </h3>
                            <p class="text-[11px] text-slate-500 dark:text-slate-450 font-medium truncate mt-0.5">
                                ${categoryName}
                            </p>
                            
                            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span class="inline-flex items-center gap-0.5 text-xs text-amber-500 font-extrabold">
                                    <i class="ph-fill ph-star"></i>
                                    ${rating}
                                </span>
                                <span class="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                                <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-450 flex items-center gap-0.5">
                                    <i class="ph ph-eye text-xs"></i>
                                    ${views} vistas
                                </span>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            
            topTendenciaSeccion.classList.remove('hidden');
        } else {
            topTendenciaSeccion.classList.add('hidden');
        }

        if (talentos.length === 0) {
            gridCatalogo.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-sm flex flex-col items-center">
                    <div class="text-5xl mb-4 text-slate-300 dark:text-slate-600"><i class="ph ph-magnifying-glass"></i></div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">No se encontraron artistas</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Intenta relajar los filtros de búsqueda o presiona Limpiar.</p>
                </div>
            `;
            gridCatalogo.style.opacity = '1';
            gridCatalogo.style.pointerEvents = 'auto';
            return;
        }

        gridCatalogo.innerHTML = talentos.map(talent => {
            const avatarUrl = getAssetUrl(talent.user?.avatar_url, `https://picsum.photos/seed/avatar_${talent.id}/150/150`);
            const artisticName = talent.artistic_name || talent.user?.name;
            const categoryName = talent.category?.name || 'Artista';
            const cityName = talent.city?.name || 'Bolivia';
            const bio = talent.bio || 'Explora mi portafolio para conocer más sobre mi trabajo y shows en vivo.';
            const basePrice = talent.base_price ? `${parseFloat(talent.base_price).toLocaleString('es-BO')} Bs` : 'A convenir';
            const rating = parseFloat(talent.average_rating || 0).toFixed(1);

            // Renderizado del banner
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
                const gradientIndex = talent.id % GRADIENTS.length;
                bannerHTML = `
                    <div class="w-full h-full bg-gradient-to-tr ${GRADIENTS[gradientIndex]} relative">
                        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40"></div>
                    </div>
                `;
            }

            // Favorite Button Setup
            let heartHTML = '';
            if (!isTalent) {
                const isFav = favoritosSet.has(talent.id);
                const reqAuthClass = !token ? 'requires-auth' : '';
                heartHTML = `
                    <button data-talent-id="${talent.id}" class="heart-btn absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-fp-surface-dark text-xl font-bold shadow-md transition-all duration-300 hover:scale-110 active:scale-95 ${reqAuthClass} ${isFav ? 'text-rose-550 scale-110' : 'text-slate-400 hover:text-rose-500'}" title="Agregar a favoritos">
                        ${isFav ? '♥' : '♡'}
                    </button>
                `;
            }

            // Contact Button Setup
            let contactBtnHTML = '';
            if (isTalent) {
                contactBtnHTML = `
                    <button disabled class="px-3 py-2 bg-slate-100 dark:bg-fp-surface-dark text-slate-400 dark:text-slate-655 font-semibold text-xs rounded-xl cursor-not-allowed" title="Opción no disponible entre artistas">
                        Contactar
                    </button>
                `;
            } else {
                const reqAuthClass = !token ? 'requires-auth' : '';
                const waMessage = `Hola ${artisticName}! Vi tu perfil en FestiPro y me gustaría cotizar un show para mi próximo evento.`;
                const waLink = talent.user?.whatsapp_number ? formatWhatsAppLink(talent.user.whatsapp_number, waMessage) : '#';
                
                contactBtnHTML = `
                    <a href="${waLink}" target="_blank" class="wa-contact-btn btn-wa-premium px-3.5 py-2 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-1 shadow-sm relative ${reqAuthClass}">
                        <i class="ph ph-whatsapp-logo text-base"></i>
                        Contactar
                        <i class="ph-fill ph-star star-item star-1"></i>
                        <i class="ph-fill ph-star star-item star-2"></i>
                        <i class="ph-fill ph-star star-item star-3"></i>
                        <i class="ph-fill ph-star star-item star-4"></i>
                        <i class="ph-fill ph-star star-item star-5"></i>
                        <i class="ph-fill ph-star star-item star-6"></i>
                    </a>
                `;
            }

            return `
                <article data-talent-id="${talent.id}" class="clickable-card group relative bg-white dark:bg-fp-surface-dark rounded-2xl border border-slate-100 dark:border-fp-border-dark shadow-sm hover:shadow-xl hover:border-fp-primary-light/30 dark:hover:border-fp-primary-dark/30 transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden flex flex-col h-full cursor-pointer">
                    ${heartHTML}

                    <!-- Banner de Fondo -->
                    <div class="relative h-44 overflow-hidden bg-slate-100 dark:bg-fp-surface-dark flex items-center justify-center">
                        ${bannerHTML}
                        <span class="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Disponible
                        </span>

                        <!-- Puntuación Flotante en la esquina -->
                        <span class="absolute top-4 right-14 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-white/95 dark:bg-fp-surface-dark/95 text-amber-500 shadow-sm backdrop-blur-sm z-10">
                            <i class="ph-fill ph-star"></i>
                            ${rating}
                        </span>
                    </div>

                    <!-- Contenido de la Tarjeta -->
                    <div class="p-5 flex flex-col flex-grow">
                        <!-- Perfil Avatar y Nombre -->
                        <div class="flex items-center gap-3 mb-3">
                            <img src="${avatarUrl}" alt="${artisticName}" loading="lazy" class="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-fp-border-dark bg-slate-100">
                            <div class="min-w-0 flex-1">
                                <h3 class="font-display font-bold text-slate-900 dark:text-white leading-tight truncate group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors">
                                    ${artisticName}
                                </h3>
                                <p class="text-[11px] text-slate-500 dark:text-slate-450 truncate">
                                    ${categoryName} · ${cityName}
                                </p>
                            </div>
                        </div>

                        <!-- Bio Corta -->
                        <p class="text-xs text-slate-655 dark:text-slate-350 line-clamp-3 leading-relaxed mb-4 flex-grow">
                            ${bio}
                        </p>

                        <!-- Separador y Footer -->
                        <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex items-center justify-between mt-auto">
                            <div class="flex flex-col">
                                <span class="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Tarifa base</span>
                                <span class="text-sm font-extrabold text-slate-900 dark:text-white">
                                    ${basePrice}
                                </span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <a href="/src/pages/publico/perfil/perfil-talento.html?id=${talent.id}" class="px-3 py-2 bg-slate-100 dark:bg-fp-surface-dark text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-xl hover:bg-fp-primary-light hover:text-white dark:hover:bg-fp-primary-dark transition-all cursor-pointer">
                                    Ver perfil
                                </a>
                                ${contactBtnHTML}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Re-asignar listeners a botones de las tarjetas
        asignarCardListeners();
        
        gridCatalogo.style.opacity = '1';
        gridCatalogo.style.pointerEvents = 'auto';

    } catch (error) {
        console.error('Error al cargar talentos:', error);
        gridCatalogo.innerHTML = `
            <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl flex flex-col items-center">
                <div class="text-4xl mb-3 text-red-500"><i class="ph-fill ph-warning"></i></div>
                <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar artistas</h3>
                <p class="text-sm text-red-600 dark:text-red-400">Por favor, intenta de nuevo.</p>
            </div>
        `;
    }
}

/**
 * Asigna eventos a los botones dinámicos en las tarjetas
 */
function asignarCardListeners() {
    // Botones de favoritos (corazón)
    document.querySelectorAll('.heart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-talent-id');
            toggleFavorito(id, btn);
        });
    });

    // Clic en toda la tarjeta (tanto Top como Generales)
    document.querySelectorAll('.clickable-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar redirigir si se hace click en botón contactar, favoritos, o links
            if (e.target.closest('button, a, .heart-btn')) {
                return;
            }
            const id = card.getAttribute('data-talent-id');
            window.location.href = `/src/pages/publico/perfil/perfil-talento.html?id=${id}`;
        });
    });
}

/**
 * Pinta los tags de filtros activos en la barra
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
    if (inputPrecioMin.value) {
        list.push({ key: 'precio_min', label: `Mín: ${inputPrecioMin.value} Bs.`, el: inputPrecioMin });
    }
    if (inputPrecioMax.value) {
        list.push({ key: 'precio_max', label: `Máx: ${inputPrecioMax.value} Bs.`, el: inputPrecioMax });
    }
    
    // Capturar valor de puntuación para tag activo
    const radioPuntuacionChecked = document.querySelector('input[name="filtro-puntuacion"]:checked');
    if (radioPuntuacionChecked && radioPuntuacionChecked.value) {
        list.push({ 
            key: 'puntuacion', 
            label: `Puntuación: ${radioPuntuacionChecked.value}★+`, 
            el: null,
            reset: () => {
                const defaultRadio = document.querySelector('input[name="filtro-puntuacion"][value=""]');
                if (defaultRadio) defaultRadio.checked = true;
            }
        });
    }

    // Capturar valor de disponibilidad para tag activo
    if (checkSoloDisponibles.checked) {
        list.push({ 
            key: 'solo_disponibles', 
            label: `Solo Disponibles`, 
            el: checkSoloDisponibles,
            reset: () => {
                checkSoloDisponibles.checked = false;
            }
        });
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
            <button data-clear-filter="${item.key}" class="hover:text-rose-500 font-bold ml-0.5 cursor-pointer flex items-center justify-center"><i class="ph-fill ph-x-circle text-sm"></i></button>
        </span>
    `).join('');

    // Listener para eliminar filtro individual
    document.querySelectorAll('[data-clear-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-clear-filter');
            const item = list.find(x => x.key === key);
            if (item) {
                if (item.reset) {
                    item.reset();
                } else if (item.el) {
                    item.el.value = '';
                }
                cargarTalentos();
            }
        });
    });
}

/**
 * Inicialización de la Página (Punto de entrada)
 * Optimizado para ejecutar llamadas a la API en paralelo y reducir el tiempo de carga (TTFB).
 */
function abrirModalFiltros() {
    modalFiltros.classList.remove('hidden');
    setTimeout(() => {
        modalFiltros.classList.remove('opacity-0');
        modalFiltros.querySelector('.relative').classList.remove('scale-95');
        modalFiltros.querySelector('.relative').classList.add('scale-100');
    }, 10);
}

function cerrarModalFiltros() {
    modalFiltros.classList.add('opacity-0');
    modalFiltros.querySelector('.relative').classList.remove('scale-100');
    modalFiltros.querySelector('.relative').classList.add('scale-95');
    setTimeout(() => {
        modalFiltros.classList.add('hidden');
    }, 300);
}

async function init() {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Setear parámetros estáticos de texto/número inmediatamente
    if (searchParams.has('q')) inputBuscar.value = searchParams.get('q');
    if (searchParams.has('precio_min')) inputPrecioMin.value = searchParams.get('precio_min');
    if (searchParams.has('precio_max')) inputPrecioMax.value = searchParams.get('precio_max');
    if (searchParams.has('puntuacion')) {
        const ratingVal = searchParams.get('puntuacion');
        const radio = document.querySelector(`input[name="filtro-puntuacion"][value="${ratingVal}"]`);
        if (radio) radio.checked = true;
    }
    if (searchParams.has('solo_disponibles')) {
        checkSoloDisponibles.checked = searchParams.get('solo_disponibles') === 'true';
    }

    // 1. Iniciar todas las peticiones a la API en paralelo para evitar bloqueo en cascada
    const pFiltros = cargarFiltrosEstaticos().then(() => {
        // Setear los selectores una vez sus opciones existen en el DOM
        if (searchParams.has('categoria')) selectCategoria.value = searchParams.get('categoria');
        if (searchParams.has('ciudad')) selectCiudad.value = searchParams.get('ciudad');
        // Actualizar chips de filtros iniciales
        renderActiveFilters();
    });

    const pFavoritos = cargarFavoritosHost();
    const pTalentos = cargarTalentos(true, searchParams.toString());

    await Promise.all([pFiltros, pFavoritos, pTalentos]);

    // Registrar Listeners para Modal
    btnMostrarFiltros.addEventListener('click', abrirModalFiltros);
    btnCerrarFiltros.addEventListener('click', cerrarModalFiltros);
    modalFiltros.addEventListener('click', (e) => {
        if (e.target === modalFiltros) cerrarModalFiltros();
    });

    // Botón restablecer dentro de modal
    btnLimpiarModal.addEventListener('click', () => {
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        checkSoloDisponibles.checked = false;
        const defaultRadio = document.querySelector('input[name="filtro-puntuacion"][value=""]');
        if (defaultRadio) defaultRadio.checked = true;
    });

    // Botón aplicar dentro de modal
    btnAplicarFiltros.addEventListener('click', () => {
        cargarTalentos(false);
        cerrarModalFiltros();
    });

    // Búsqueda de texto (Debounce 500ms)
    inputBuscar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            cargarTalentos(false);
        }, 500);
    });

    // Selects con disparo inmediato
    selectCategoria.addEventListener('change', () => cargarTalentos(false));
    selectCiudad.addEventListener('change', () => cargarTalentos(false));

    // Botón Limpiar Todos
    btnLimpiarFiltros.addEventListener('click', () => {
        filtrosForm.reset();
        inputBuscar.value = '';
        selectCategoria.value = '';
        selectCiudad.value = '';
        inputPrecioMin.value = '';
        inputPrecioMax.value = '';
        checkSoloDisponibles.checked = false;
        const defaultRadio = document.querySelector('input[name="filtro-puntuacion"][value=""]');
        if (defaultRadio) defaultRadio.checked = true;
        cargarTalentos(false);
    });
}

// Ejecutar init al estar listo
document.addEventListener('DOMContentLoaded', init);
