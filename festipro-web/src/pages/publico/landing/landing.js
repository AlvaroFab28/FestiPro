import { apiClient } from '/src/assets/js/api-client.js';

// Base API URL extraction for asset hosting
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

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

// Gradient options for empty banners
const GRADIENTS = [
    'from-indigo-950 via-purple-900 to-slate-900',
    'from-slate-950 via-slate-900 to-zinc-900',
    'from-violet-950 via-indigo-950 to-slate-955',
    'from-fuchsia-950 via-purple-900 to-slate-950',
    'from-emerald-950 via-teal-900 to-slate-950',
    'from-rose-950 via-pink-950 to-slate-950'
];

/**
 * Carga los primeros 4 talentos destacados desde la API pública.
 */
async function cargarTalentosDestacados() {
    const contenedor = document.getElementById('talentos-destacados');
    if (!contenedor) return;

    try {
        // Realizar la llamada GET pública a la API de talentos
        const response = await apiClient.get('/talentos');
        
        // La paginación devuelve la lista real en data.data
        const talentos = response?.data?.data || [];
        
        // Seleccionamos los primeros 4 elementos
        const destacados = talentos.slice(0, 4);

        if (destacados.length === 0) {
            contenedor.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-sm">
                    <div class="text-5xl mb-4 text-fp-accent-light dark:text-fp-accent-dark"><i class="ph-fill ph-sparkle"></i></div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">No hay artistas destacados en este momento</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Pronto se registrarán nuevos talentos en la plataforma.</p>
                </div>
            `;
            return;
        }

        // Generamos el HTML para cada tarjeta de talento
        const htmlCards = destacados.map(talent => {
            const userAvatar = getAssetUrl(talent.user?.avatar_url, `https://picsum.photos/seed/avatar_${talent.id}/150/150`);
            const rating = talent.average_rating || 5.0;
            const starsHTML = Array.from({ length: 5 }, (_, i) => {
                const isGold = i < Math.floor(rating);
                return `<span class="${isGold ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}">★</span>`;
            }).join('');

            // Renderizado del banner
            let bannerHTML = '';
            if (talent.banner_url) {
                const bannerImg = getAssetUrl(talent.banner_url);
                bannerHTML = `
                    <img src="${bannerImg}" 
                         alt="${talent.artistic_name || talent.user?.name}" 
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

            return `
                <article class="group bg-white dark:bg-fp-surface-dark rounded-2xl border border-slate-100 dark:border-fp-border-dark shadow-sm hover:shadow-xl hover:border-fp-primary-light/30 dark:hover:border-fp-primary-dark/30 transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden flex flex-col h-full">
                    <!-- Banner del Artista con Estado de Disponibilidad -->
                    <div class="relative h-48 overflow-hidden bg-slate-100 dark:bg-fp-surface-dark flex items-center justify-center">
                        ${bannerHTML}
                        <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Disponible
                        </span>
                    </div>
                    
                    <div class="p-6 flex flex-col flex-grow">
                        <!-- Avatar y Encabezado -->
                        <div class="flex items-center gap-3 mb-4">
                            <img src="${userAvatar}" alt="${talent.user?.name || 'Avatar'}" class="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-fp-border-dark bg-slate-100">
                            <div class="min-w-0 flex-1">
                                <h3 class="font-display font-bold text-slate-900 dark:text-white leading-tight truncate">
                                    ${talent.artistic_name || talent.user?.name}
                                </h3>
                                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    ${talent.category?.name || 'Artista'} · ${talent.city?.name || 'Bolivia'}
                                </p>
                            </div>
                        </div>
                        
                        <!-- Biografía resumida -->
                        <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-6 flex-grow">
                            ${talent.bio || 'Explora mi portafolio para conocer más sobre mi trabajo y shows en vivo.'}
                        </p>
...

                        <!-- Rating y Footer -->
                        <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex items-end justify-between mt-auto">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Tarifa base</span>
                                <span class="text-base font-extrabold text-slate-900 dark:text-white">
                                    ${talent.base_price ? parseFloat(talent.base_price).toLocaleString('es-BO') + ' Bs' : 'A convenir'}
                                </span>
                            </div>
                            
                            <a href="/src/pages/publico/catalogo/catalogo.html?talento=${talent.id}" class="inline-flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-fp-surface-dark text-slate-700 dark:text-slate-300 group-hover:bg-fp-primary-light group-hover:text-white dark:group-hover:bg-fp-primary-dark font-semibold text-xs rounded-xl transition-all duration-300 cursor-pointer">
                                Ver perfil
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        contenedor.innerHTML = htmlCards;

    } catch (error) {
        console.error('Error al cargar talentos destacados:', error);
        contenedor.innerHTML = `
            <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl">
                <div class="text-4xl mb-3"><i class="ph-fill ph-warning"></i></div>
                <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar artistas</h3>
                <p class="text-sm text-red-650 dark:text-red-400">Por favor, intenta recargar la página.</p>
            </div>
        `;
    }
}

/**
 * Carga los primeros 4 eventos publicados desde la API pública.
 */
async function cargarEventosProximos() {
    const contenedor = document.getElementById('eventos-proximos');
    if (!contenedor) return;

    try {
        // Realizar la llamada GET pública a la API de eventos
        const response = await apiClient.get('/eventos');
        
        // La paginación devuelve la lista real en data.data
        const eventos = response?.data?.data || [];
        
        // Seleccionamos los primeros 4 elementos
        const proximos = eventos.slice(0, 4);

        if (proximos.length === 0) {
            contenedor.innerHTML = `
                <div class="col-span-full py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-dashed border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-sm">
                    <div class="text-5xl mb-4 text-fp-primary-light dark:text-fp-primary-dark"><i class="ph-fill ph-calendar-blank"></i></div>
                    <h3 class="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">No hay eventos publicados por ahora</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Si buscas un artista, puedes publicar tu propio evento desde tu panel.</p>
                </div>
            `;
            return;
        }

        // Generamos el HTML para cada tarjeta de evento
        const htmlCards = proximos.map(event => {
            const formattedDate = event.event_date 
                ? new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) 
                : 'Fecha por definir';

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
                            ${event.title}
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            ${event.category?.name || 'Talento'} · ${event.city?.name || 'Bolivia'}
                        </p>
                        <p class="text-sm text-slate-600 dark:text-slate-350 line-clamp-3 leading-relaxed flex-grow">
                            ${event.description || 'Sin detalles del show requeridos.'}
                        </p>
                    </div>
                    
                    <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark flex items-end justify-between mt-auto">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Presupuesto</span>
                            <span class="text-base font-extrabold text-slate-900 dark:text-white">
                                ${event.estimated_budget ? parseFloat(event.estimated_budget).toLocaleString('es-BO') + ' Bs' : 'A convenir'}
                            </span>
                        </div>
                        
                        <a href="/src/pages/publico/eventos/eventos.html" class="inline-flex items-center justify-center px-4 py-2 bg-fp-accent-light hover:bg-fp-accent-light/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-300 cursor-pointer">
                            Contactar Anfitrión
                        </a>
                    </div>
                </article>
            `;
        }).join('');

        contenedor.innerHTML = htmlCards;

    } catch (error) {
        console.error('Error al cargar eventos próximos:', error);
        contenedor.innerHTML = `
            <div class="col-span-full py-12 px-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl">
                <div class="text-4xl mb-3"><i class="ph-fill ph-warning"></i></div>
                <h3 class="font-display font-bold text-lg text-red-800 dark:text-red-300 mb-1">Ocurrió un error al cargar eventos</h3>
                <p class="text-sm text-red-650 dark:text-red-400">Por favor, intenta recargar la página.</p>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarTalentosDestacados();
    cargarEventosProximos();
});
