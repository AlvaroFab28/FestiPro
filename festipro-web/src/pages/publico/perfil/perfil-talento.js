import { apiClient } from '/src/assets/js/api-client.js';
import { setupSpotlights, showToast } from '/src/assets/js/utils.js';

// ══════════════════════════════════════════
// SECCIÓN 1: IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ══════════════════════════════════════════

// Extracción de la URL base de la API para la carga de recursos y multimedia
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

// Paleta de degradados para banners vacíos
const GRADIENTS = [
    'from-indigo-950 via-purple-900 to-slate-900',
    'from-slate-950 via-slate-900 to-zinc-900',
    'from-violet-950 via-indigo-950 to-slate-955',
    'from-fuchsia-950 via-purple-900 to-slate-950',
    'from-emerald-950 via-teal-900 to-slate-950',
    'from-rose-950 via-pink-950 to-slate-950'
];

// Paleta de colores de marca FestiPro para calificaciones (1-5 estrellas)
const RATING_PALETTE = {
    1: { color: '#ff7675', bg: 'rgba(255, 118, 117, 0.08)', border: 'rgba(255, 118, 117, 0.22)', darkBg: 'rgba(255, 118, 117, 0.15)', darkBorder: 'rgba(255, 118, 117, 0.3)' },
    2: { color: '#ff8a5c', bg: 'rgba(255, 138, 92, 0.08)',  border: 'rgba(255, 138, 92, 0.22)',  darkBg: 'rgba(255, 138, 92, 0.15)',  darkBorder: 'rgba(255, 138, 92, 0.3)' },
    3: { color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.08)',  border: 'rgba(255, 159, 67, 0.22)',  darkBg: 'rgba(255, 159, 67, 0.15)',  darkBorder: 'rgba(255, 159, 67, 0.3)' },
    4: { color: '#b683ff', bg: 'rgba(182, 131, 255, 0.08)', border: 'rgba(182, 131, 255, 0.22)', darkBg: 'rgba(182, 131, 255, 0.15)', darkBorder: 'rgba(182, 131, 255, 0.3)' },
    5: { color: '#9350FF', bg: 'rgba(147, 80, 255, 0.08)',  border: 'rgba(147, 80, 255, 0.22)',  darkBg: 'rgba(147, 80, 255, 0.15)',  darkBorder: 'rgba(147, 80, 255, 0.35)' }
};

// ══════════════════════════════════════════
// SECCIÓN 2: ESTADO GLOBAL DE LA PÁGINA
// ══════════════════════════════════════════

// Datos de sesión y autenticación del usuario actual
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('user_role');
const isTalent = token && (userRole === 'talento' || userRole === 'talent');

// Estado para el visor de imágenes (Lightbox)
let galleryImages = [];
let currentImgIndex = 0;

// Estado para la paginación y almacenamiento de reseñas
let visibleReviewsCount = 3;
let allReviewsData = [];

// Banderas para asegurar inicializaciones únicas de componentes interactivos
let isReviewFormToggleSetup = false;
let isLoadMoreSetup = false;
let isLightboxSetup = false;

// ══════════════════════════════════════════
// SECCIÓN 3: REFERENCIAS AL DOM
// ══════════════════════════════════════════

// 3.1 Esqueleto y contenedor principal
const profileSkeleton = document.getElementById('profile-skeleton');
const profileContent = document.getElementById('profile-content');

// 3.2 Hero: banner y avatar
const perfilBanner = document.getElementById('perfil-banner');
const perfilAvatar = document.getElementById('perfil-avatar');

// 3.3 Cápsulas de información y biografía
const perfilNombre = document.getElementById('perfil-nombre');
const perfilCategoria = document.getElementById('perfil-categoria');
const perfilCiudad = document.getElementById('perfil-ciudad');
const perfilBio = document.getElementById('perfil-bio');

// 3.4 Multimedia (YouTube y Galería)
const perfilYoutubeContainer = document.getElementById('perfil-youtube-container');
const perfilYoutubeIframe = document.getElementById('perfil-youtube-iframe');
const perfilGaleriaContainer = document.getElementById('perfil-galeria-container');
const perfilGaleriaGrid = document.getElementById('perfil-galeria-grid');

// 3.5 Sección de reseñas y formulario
const perfilReseñasLista = document.getElementById('perfil-reseñas-lista');
const perfilReseñaPromedio = document.getElementById('perfil-reseña-promedio');
const reviewFormContainer = document.getElementById('review-form-container');
const reviewFormWrapper = document.getElementById('review-form-wrapper');
const btnShowReviewForm = document.getElementById('btn-show-review-form');
const reviewForm = document.getElementById('review-form');
const starRatingSelector = document.getElementById('star-rating-selector');
const reviewRatingInput = document.getElementById('review-rating');
const reviewCommentInput = document.getElementById('review-comment');
const btnSubmitReview = document.getElementById('btn-submit-review');
const perfilResumenReseñasTop = document.getElementById('perfil-resumen-reseñas-top');
const loadMoreReviewsContainer = document.getElementById('load-more-reviews-container');
const btnLoadMoreReviews = document.getElementById('btn-load-more-reviews');

// 3.6 Sidebar: precio, contacto, seguridad
const perfilPrecio = document.getElementById('perfil-precio');
const btnContacto = document.getElementById('btn-contacto');
const contactoRolMsg = document.getElementById('contacto-rol-msg');

// 3.7 Lightbox
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');

// ══════════════════════════════════════════
// SECCIÓN 4: UTILIDADES Y HELPERS PUROS
// ══════════════════════════════════════════

/**
 * Obtiene la ruta completa de un asset o recurso multimedia.
 * Si la ruta ya es una URL absoluta (http/https), la devuelve tal cual.
 * De lo contrario, concatena la URL base de la API.
 * 
 * @param {string} path - Ruta relativa del asset.
 * @param {string} defaultImg - URL de imagen por defecto si el path no existe.
 * @returns {string} URL absoluta del recurso.
 */
function getAssetUrl(path, defaultImg) {
    if (!path) return defaultImg;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${BASE_URL}${path}`;
}

/**
 * Convierte un enlace estándar de YouTube en un enlace de tipo embed.
 * Soporta URLs de tipo watch?v=, youtu.be, embed/ y v/.
 * 
 * @param {string} url - URL del video de YouTube proporcionada por el usuario.
 * @returns {string|null} URL del iframe embebido o null si no es válida.
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
        console.error('Error al procesar la URL de YouTube:', e);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

/**
 * Limpia y formatea un número telefónico para generar un enlace directo de WhatsApp.
 * Si el número limpio tiene 8 dígitos, asume el código de país de Bolivia (+591).
 * 
 * @param {string} phone - Número de teléfono crudo.
 * @param {string} message - Mensaje predefinido para iniciar el chat.
 * @returns {string} Enlace completo de WhatsApp API.
 */
function formatWhatsAppLink(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 8) {
        finalPhone = '591' + cleanPhone; // Código de país para Bolivia estándar
    }
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Devuelve el objeto de configuración de color y fondo de la paleta FestiPro
 * correspondiente a la puntuación de estrellas redondeada.
 * 
 * @param {number|string} rating - Puntuación media o individual (1 a 5).
 * @returns {object} Configuración de estilos para el color de marca asociado.
 */
function getRatingPalette(rating) {
    const r = Math.round(parseFloat(rating) || 0);
    if (r <= 1) return RATING_PALETTE[1];
    if (r === 2) return RATING_PALETTE[2];
    if (r === 3) return RATING_PALETTE[3];
    if (r === 4) return RATING_PALETTE[4];
    return RATING_PALETTE[5];
}

// ══════════════════════════════════════════
// SECCIÓN 5: RENDERIZADO DE RESEÑAS
// ══════════════════════════════════════════

/**
 * Pinta visualmente las estrellas en el selector de calificación del formulario.
 * Actualiza el ícono relleno/vacío y sus colores según el hover o el valor seleccionado.
 * 
 * @param {NodeList} starButtons - Lista de botones del selector de estrellas en el DOM.
 * @param {number} rating - Calificación actualmente guardada o activa.
 * @param {boolean} [isHover=false] - Indica si el usuario tiene el cursor sobre alguna estrella.
 * @param {number|null} [hoverValue=null] - El valor de la estrella sobre la que está el cursor.
 */
function renderSelector(starButtons, rating, isHover = false, hoverValue = null) {
    const activeRating = isHover ? hoverValue : rating;
    const palette = activeRating > 0 ? getRatingPalette(activeRating) : null;

    starButtons.forEach((sBtn, idx) => {
        const icon = sBtn.querySelector('i');
        if (!icon) return;
        
        // Agregar clases de transición
        if (!icon.classList.contains('transition-all')) {
            icon.classList.add('transition-all', 'duration-300');
        }
        
        // Limpiar todas las posibles clases de color y animaciones de marca
        icon.classList.remove(
            'text-slate-300', 'dark:text-slate-600',
            'text-rose-500', 'dark:text-rose-400',
            'text-orange-500', 'dark:text-orange-400',
            'text-sky-500', 'dark:text-sky-400',
            'text-blue-600', 'dark:text-blue-400',
            'text-amber-500', 'dark:text-amber-400',
            'text-red-500', 'dark:text-red-400',
            'text-yellow-500', 'dark:text-yellow-400',
            'text-emerald-500', 'dark:text-emerald-400',
            'text-violet-500', 'dark:text-violet-400',
            'star-cosmic-pulse'
        );
        
        // Resetear estilos inline
        icon.style.color = '';

        if (idx < activeRating) {
            // Activo: aplicar color de la calificación activa
            if (palette) {
                icon.style.color = palette.color;
            }
            icon.classList.replace('ph', 'ph-fill');
        } else {
            // Inactivo: color gris
            icon.classList.add('text-slate-300', 'dark:text-slate-600');
            icon.classList.replace('ph', 'ph-fill');
        }
    });
}

/**
 * Inicializa los eventos e interacción del selector de estrellas del formulario de reseña.
 * Permite marcar puntuaciones al hacer clic y previsualizar colores en hover.
 */
function setupStarSelector() {
    if (!starRatingSelector) return;
    const starButtons = starRatingSelector.querySelectorAll('button');
    let selectedRating = parseInt(reviewRatingInput.value, 10) || 0;

    // Renderizar estado inicial
    renderSelector(starButtons, selectedRating);

    starButtons.forEach(btn => {
        const rating = parseInt(btn.getAttribute('data-rating'), 10);
        
        btn.addEventListener('click', () => {
            selectedRating = rating;
            reviewRatingInput.value = selectedRating;
            renderSelector(starButtons, selectedRating);
            
            // Animación Star-Pop: pequeño brinco elástico
            btn.classList.remove('star-pop');
            void btn.offsetWidth; // Forzar reflow en el navegador
            btn.classList.add('star-pop');
            
            setTimeout(() => {
                btn.classList.remove('star-pop');
            }, 400);
        });

        btn.addEventListener('mouseenter', () => {
            renderSelector(starButtons, selectedRating, true, rating);
        });
    });

    // Restaurar calificación seleccionada al salir del contenedor del selector
    starRatingSelector.addEventListener('mouseleave', () => {
        renderSelector(starButtons, selectedRating);
    });
}

/**
 * Renderiza el desglose y promedio general de las reseñas.
 * Actualiza la puntuación numérica, la estrella dinámica y la insignia superior flotante.
 * 
 * @param {Array} reviews - Listado de reseñas provenientes del API.
 * @param {number|string} averageRating - Calificación promedio del artista.
 */
function renderReviews(reviews = [], averageRating = 0) {
    if (!perfilReseñaPromedio || !perfilReseñasLista) return;
    
    const avg = parseFloat(averageRating) || 0;
    const count = reviews.length;
    const avgRound = Math.round(avg);
    const avgPalette = getRatingPalette(avgRound);
    
    // Una sola estrella dinámica en lugar del bucle de 5 estrellas
    const cosmicClass = (avgRound === 5) ? ' star-cosmic-pulse' : '';
    const starsHtml = `<i class="ph-fill ph-star${cosmicClass}" style="color: ${avgPalette.color}"></i>`;
    perfilReseñaPromedio.innerHTML = `${starsHtml} <span class="ml-1 text-slate-700 dark:text-slate-300 font-bold">${avg.toFixed(1)} (${count} ${count === 1 ? 'reseña' : 'reseñas'})</span>`;
    
    // Resúmenes en la parte superior (Social Proof)
    if (count > 0) {
        const labelStr = `${avg.toFixed(1)} (${count} ${count === 1 ? 'reseña' : 'reseñas'})`;
        const summaryHtml = `<i class="ph-fill ph-star text-sm${cosmicClass}" style="color: ${avgPalette.color}"></i> <span>${labelStr}</span>`;
        
        if (perfilResumenReseñasTop) {
            perfilResumenReseñasTop.innerHTML = summaryHtml;
            perfilResumenReseñasTop.classList.remove('hidden');
            
            // Inyectar variables CSS personalizadas para la cápsula dinámica
            perfilResumenReseñasTop.style.setProperty('--badge-color', avgPalette.color);
            perfilResumenReseñasTop.style.setProperty('--badge-bg-light', avgPalette.bg);
            perfilResumenReseñasTop.style.setProperty('--badge-border-light', avgPalette.border);
            perfilResumenReseñasTop.style.setProperty('--badge-bg-dark', avgPalette.darkBg);
            perfilResumenReseñasTop.style.setProperty('--badge-border-dark', avgPalette.darkBorder);
        }
    } else {
        if (perfilResumenReseñasTop) perfilResumenReseñasTop.classList.add('hidden');
    }
    
    // Guardar reseñas en el estado global
    allReviewsData = reviews;
    
    // Renderizar la lista de reseñas visibles
    renderReviewsList();
    
    // Configurar el listener del botón "cargar más"
    setupLoadMoreReviews();
}

/**
 * Renderiza en el DOM la porción de reseñas visibles de acuerdo con la paginación actual.
 * Crea las tarjetas individuales con la información de los anfitriones y sus comentarios.
 */
function renderReviewsList() {
    if (!perfilReseñasLista) return;
    
    const count = allReviewsData.length;
    
    if (count === 0) {
        perfilReseñasLista.innerHTML = `
            <div class="text-center py-8 text-slate-400 dark:text-slate-500">
                <i class="ph ph-chat-circle-slash text-4xl mb-2"></i>
                <p class="text-sm font-medium">Este artista aún no ha recibido reseñas. ¡Sé el primero en calificarlo!</p>
            </div>
        `;
        if (loadMoreReviewsContainer) {
            loadMoreReviewsContainer.classList.add('hidden');
        }
        return;
    }
    
    // Obtener la porción visible de las reseñas
    const visibleReviews = allReviewsData.slice(0, visibleReviewsCount);
    
    perfilReseñasLista.innerHTML = visibleReviews.map(r => {
        const hostName = r.host?.name || 'Anfitrión Anónimo';
        const hostAvatar = getAssetUrl(r.host?.avatar_url, `https://picsum.photos/seed/avatar_${r.host_id || 'random'}/100/100`);
        const dateStr = new Date(r.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const rPalette = getRatingPalette(r.rating);
        let rStars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= r.rating) {
                const cosmicClass = (r.rating === 5 && i === 5) ? ' star-cosmic-pulse' : '';
                rStars += `<i class="ph-fill ph-star${cosmicClass} text-sm" style="color: ${rPalette.color}"></i>`;
            } else {
                rStars += '<i class="ph ph-star text-slate-300 dark:text-slate-600 text-sm"></i>';
            }
        }
        
        return `
            <div class="flex gap-4 border-b border-slate-100 dark:border-fp-border-dark pb-4 last:border-none last:pb-0 transition-colors duration-300">
                <img src="${hostAvatar}" alt="${hostName}" class="w-10 h-10 rounded-full object-cover bg-slate-100 dark:bg-fp-surface-dark flex-shrink-0">
                <div class="flex-grow">
                    <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white font-display">${hostName}</h4>
                        <span class="text-xs text-slate-400 dark:text-slate-500">${dateStr}</span>
                    </div>
                    <div class="flex gap-0.5 mb-2">${rStars}</div>
                    <p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-semibold">${r.comment || ''}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Mostrar/ocultar el botón para cargar más reseñas
    if (loadMoreReviewsContainer) {
        if (count > visibleReviewsCount) {
            loadMoreReviewsContainer.classList.remove('hidden');
        } else {
            loadMoreReviewsContainer.classList.add('hidden');
        }
    }
}

// ══════════════════════════════════════════
// SECCIÓN 6: FORMULARIO DE RESEÑA
// ══════════════════════════════════════════

/**
 * Configura la acción para expandir y mostrar el formulario para escribir reseñas.
 * Controla la animación elástica de altura y opacidad.
 */
function setupReviewFormToggle() {
    if (isReviewFormToggleSetup || !btnShowReviewForm || !reviewFormWrapper) return;
    isReviewFormToggleSetup = true;

    btnShowReviewForm.addEventListener('click', () => {
        if (reviewFormWrapper.classList.contains('hidden')) {
            reviewFormWrapper.classList.remove('hidden');
            requestAnimationFrame(() => {
                reviewFormWrapper.classList.remove('opacity-0', 'max-h-0');
                reviewFormWrapper.classList.add('opacity-100', 'max-h-[500px]');
                
                // Quitar overflow-hidden después de finalizar la transición de altura
                // para que el efecto ambient-shadow del botón premium no se vea truncado.
                setTimeout(() => {
                    reviewFormWrapper.classList.remove('overflow-hidden');
                    reviewFormWrapper.classList.add('overflow-visible');
                }, 500);
            });
            // Ocultar botón disparador
            btnShowReviewForm.parentElement.classList.add('hidden');
        }
    });
}

/**
 * Configura la acción para incrementar la cantidad de reseñas visibles en pantalla (paginación local).
 */
function setupLoadMoreReviews() {
    if (isLoadMoreSetup || !btnLoadMoreReviews) return;
    isLoadMoreSetup = true;
    
    btnLoadMoreReviews.addEventListener('click', () => {
        visibleReviewsCount += 5;
        renderReviewsList();
    });
}

// Configurar el listener de envío de reseña
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const searchParams = new URLSearchParams(window.location.search);
        const talentId = searchParams.get('id');
        if (!talentId) return;

        const rating = parseInt(reviewRatingInput.value, 10);
        const comment = reviewCommentInput.value;
        
        if (!rating || rating < 1 || rating > 5) {
            showToast('Por favor selecciona una calificación válida.', 'error');
            return;
        }

        btnSubmitReview.disabled = true;
        const btnSubmitText = document.getElementById('btn-submit-text');
        if (btnSubmitText) {
            btnSubmitText.textContent = 'Enviando...';
        } else {
            btnSubmitReview.textContent = 'Enviando...';
        }

        try {
            await apiClient.post('/anfitrion/reviews', {
                talent_profile_id: talentId,
                rating,
                comment
            });
            
            showToast('Reseña guardada exitosamente.');
            reviewCommentInput.value = '';
            
            // Ocultar y resetear contenedor del formulario con transiciones inversas
            if (reviewFormWrapper) {
                reviewFormWrapper.classList.add('overflow-hidden');
                reviewFormWrapper.classList.remove('overflow-visible');
                reviewFormWrapper.classList.add('hidden', 'opacity-0', 'max-h-0');
                reviewFormWrapper.classList.remove('opacity-100', 'max-h-[500px]');
            }
            if (btnShowReviewForm) {
                btnShowReviewForm.parentElement.classList.remove('hidden');
            }
            if (reviewRatingInput) {
                reviewRatingInput.value = '';
            }
            if (starRatingSelector) {
                const starButtons = starRatingSelector.querySelectorAll('button');
                renderSelector(starButtons, 0);
            }
            
            // Reiniciar contador de reseñas visibles para refrescar el layout
            visibleReviewsCount = 3;

            // Recargar datos desde la API para refrescar las listas y el promedio general
            loadTalentData();
        } catch (error) {
            console.error('Error enviando la reseña:', error);
            const msg = error.data?.message || 'Error al intentar guardar la reseña.';
            showToast(msg, 'error');
        } finally {
            btnSubmitReview.disabled = false;
            const btnSubmitText = document.getElementById('btn-submit-text');
            if (btnSubmitText) {
                btnSubmitText.textContent = 'Enviar Reseña';
            } else {
                btnSubmitReview.textContent = 'Enviar Reseña';
            }
        }
    });
}

// ══════════════════════════════════════════
// SECCIÓN 7: LIGHTBOX (GALERÍA EN PANTALLA COMPLETA)
// ══════════════════════════════════════════

/**
 * Abre una imagen suelta específica (como el avatar o el banner de portada)
 * en el visor a pantalla completa, sin controles de navegación.
 * 
 * @param {string} url - URL de la imagen a ampliar.
 * @param {string} label - Texto descriptivo para el pie de la imagen.
 */
function openLightboxSingle(url, label) {
    lightboxImg.src = url;
    lightboxCounter.textContent = label;

    // Ocultar flechas de navegación al ser una imagen única
    lightboxPrev.classList.add('hidden');
    lightboxNext.classList.add('hidden');

    lightboxOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Bloquear scroll

    setTimeout(() => {
        lightboxOverlay.classList.remove('opacity-0');
        lightboxOverlay.classList.add('opacity-100');
        lightboxImg.classList.remove('scale-95');
        lightboxImg.classList.add('scale-100');
    }, 10);
}

/**
 * Abre la galería del artista en un índice particular, mostrando flechas de control.
 * 
 * @param {number} index - Índice de la imagen de la galería.
 */
function openLightbox(index) {
    if (index < 0 || index >= galleryImages.length) return;
    currentImgIndex = index;
    
    // Inyectar recurso
    lightboxImg.src = galleryImages[currentImgIndex];
    lightboxCounter.textContent = `${currentImgIndex + 1} de ${galleryImages.length}`;

    // Mostrar u ocultar controles según el tamaño total de la galería
    if (galleryImages.length > 1) {
        lightboxPrev.classList.remove('hidden');
        lightboxNext.classList.remove('hidden');
    } else {
        lightboxPrev.classList.add('hidden');
        lightboxNext.classList.add('hidden');
    }

    // Mostrar modal con efecto de difuminado y opacidad
    lightboxOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    setTimeout(() => {
        lightboxOverlay.classList.remove('opacity-0');
        lightboxOverlay.classList.add('opacity-100');
        lightboxImg.classList.remove('scale-95');
        lightboxImg.classList.add('scale-100');
    }, 10);
}

/**
 * Cierra el visor de imágenes con animación de salida.
 */
function closeLightbox() {
    lightboxOverlay.classList.remove('opacity-100');
    lightboxOverlay.classList.add('opacity-0');
    lightboxImg.classList.remove('scale-100');
    lightboxImg.classList.add('scale-95');

    setTimeout(() => {
        lightboxOverlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden'); // Reactivar scroll
        
        // Restaurar estado de visibilidad de los controles
        lightboxPrev.classList.remove('hidden');
        lightboxNext.classList.remove('hidden');
    }, 300); // 300ms de acuerdo a la clase duration-300
}

/**
 * Desplaza la galería en la dirección especificada (adelante o atrás).
 * Soporta saltos circulares (del final al inicio y viceversa).
 * 
 * @param {number} direction - Dirección de movimiento (-1 o +1).
 */
function navigateLightbox(direction) {
    if (galleryImages.length <= 1) return;
    
    let nextIndex = currentImgIndex + direction;
    if (nextIndex < 0) {
        nextIndex = galleryImages.length - 1;
    } else if (nextIndex >= galleryImages.length) {
        nextIndex = 0;
    }
    
    // Animación de salida y entrada suave de la imagen
    lightboxImg.classList.add('opacity-50', 'scale-95');
    
    setTimeout(() => {
        currentImgIndex = nextIndex;
        lightboxImg.src = galleryImages[currentImgIndex];
        lightboxCounter.textContent = `${currentImgIndex + 1} de ${galleryImages.length}`;
        lightboxImg.classList.remove('opacity-50', 'scale-95');
    }, 150);
}

/**
 * Inicializa todos los event listeners asociados a los elementos del Lightbox.
 * Utiliza un flag para registrarse una única vez y aplica delegación de eventos.
 */
function setupLightboxListeners() {
    if (isLightboxSetup) return;
    isLightboxSetup = true;

    // Delegación de eventos para los clics en imágenes de la galería
    if (perfilGaleriaGrid) {
        perfilGaleriaGrid.addEventListener('click', (e) => {
            const element = e.target.closest('[data-gallery-index]');
            if (element) {
                const idx = parseInt(element.getAttribute('data-gallery-index'), 10);
                openLightbox(idx);
            }
        });
    }

    // Ampliar Avatar y Banner al hacer clic
    if (perfilAvatar) {
        perfilAvatar.addEventListener('click', () => {
            openLightboxSingle(perfilAvatar.src, 'Foto de perfil');
        });
    }
    if (perfilBanner) {
        perfilBanner.addEventListener('click', () => {
            // Solo abrir si el banner tiene una imagen asignada y no es un gradiente vacío
            if (perfilBanner.src && !perfilBanner.classList.contains('hidden')) {
                openLightboxSingle(perfilBanner.src, 'Banner de portada');
            }
        });
    }

    // Cerrar al pulsar el botón
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Navegar con controles laterales
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(-1);
        });
    }
    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(1);
        });
    }

    // Cerrar al pulsar el fondo oscuro de la pantalla
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (e) => {
            if (e.target === lightboxOverlay) {
                closeLightbox();
            }
        });
    }

    // Controles por teclado de accesibilidad (Escape, flechas izquierda y derecha)
    document.addEventListener('keydown', (e) => {
        if (!lightboxOverlay || lightboxOverlay.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            if (lightboxPrev && !lightboxPrev.classList.contains('hidden')) {
                navigateLightbox(-1);
            }
        } else if (e.key === 'ArrowRight') {
            if (lightboxNext && !lightboxNext.classList.contains('hidden')) {
                navigateLightbox(1);
            }
        }
    });
}

// ══════════════════════════════════════════
// SECCIÓN 8: ESTADO DE ERROR
// ══════════════════════════════════════════

/**
 * Reemplaza el contenido principal de la página con un componente visual de error.
 * Se muestra si ocurre un fallo crítico de red o si el perfil solicitado no existe.
 * 
 * @param {string} message - Mensaje detallado del error a mostrar al usuario.
 */
function renderErrorState(message) {
    if (profileSkeleton) {
        profileSkeleton.classList.add('hidden');
    }
    if (profileContent) {
        profileContent.innerHTML = `
            <div class="py-16 px-6 text-center bg-white dark:bg-fp-surface-dark border border-slate-200 dark:border-fp-border-dark rounded-3xl shadow-md max-w-lg mx-auto transition-colors duration-300">
                <div class="text-6xl mb-4 text-amber-500"><i class="ph ph-warning"></i></div>
                <h2 class="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-200 mb-3">¡Ops! Algo salió mal</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">${message}</p>
                <a href="/src/pages/publico/catalogo/catalogo.html" class="inline-flex items-center gap-2 px-6 py-3 bg-fp-primary-light hover:bg-fp-primary-light/95 dark:bg-fp-primary-dark dark:hover:bg-fp-primary-dark/95 text-white font-bold rounded-xl shadow-md transition-all duration-300 text-sm">
                    ← Regresar al catálogo
                </a>
            </div>
        `;
        profileContent.classList.remove('hidden');
    }
}

// ══════════════════════════════════════════
// SECCIÓN 9: CARGA PRINCIPAL DE DATOS (API)
// ══════════════════════════════════════════

/**
 * Orquestador central encargado de consultar a la API la información del artista,
 * renderizar su banner, avatar, biografía, video, portafolio e inicializar los listeners correspondientes.
 */
async function loadTalentData() {
    const searchParams = new URLSearchParams(window.location.search);
    const talentId = searchParams.get('id');

    if (!talentId) {
        renderErrorState('No se proporcionó ningún identificador de artista válido.');
        return;
    }

    try {
        const response = await apiClient.get(`/talentos/${talentId}`);
        const talent = response?.data;

        if (!talent) {
            renderErrorState('El perfil artístico solicitado no existe o fue desactivado.');
            return;
        }

        const artisticName = talent.artistic_name || talent.user?.name;
        document.title = `${artisticName} - Perfil Artístico | FestiPro`;

        // Rellenar imágenes (con prioridad de carga alta para LCP)
        const bannerWrapper = perfilBanner.parentElement;
        if (talent.banner_url) {
            perfilBanner.src = getAssetUrl(talent.banner_url);
            perfilBanner.setAttribute('fetchpriority', 'high'); // Optimización de LCP
            perfilBanner.classList.remove('hidden');
            bannerWrapper.className = "absolute inset-0 rounded-3xl overflow-hidden";
        } else {
            perfilBanner.removeAttribute('src');
            perfilBanner.classList.add('hidden');
            const gradientIndex = talent.id % GRADIENTS.length;
            bannerWrapper.className = `absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-tr ${GRADIENTS[gradientIndex]}`;
            if (!bannerWrapper.querySelector('.radial-overlay')) {
                const radial = document.createElement('div');
                radial.className = 'absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40 radial-overlay pointer-events-none';
                bannerWrapper.appendChild(radial);
            }
        }
        perfilAvatar.src = getAssetUrl(talent.user?.avatar_url, `https://picsum.photos/seed/avatar_${talent.id}/200/200`);
        perfilAvatar.setAttribute('fetchpriority', 'high');

        // Carga de datos básicos
        perfilNombre.textContent = artisticName;
        perfilCategoria.innerHTML = `<i class="ph ph-tag text-sm flex-shrink-0"></i> ${talent.category?.name || 'Artista'}`;
        perfilCiudad.innerHTML = `<i class="ph ph-map-pin text-sm flex-shrink-0"></i> ${talent.city?.name || 'Bolivia'}`;
        
        const perfilVistasTexto = document.getElementById('perfil-vistas-texto');
        if (perfilVistasTexto) {
            perfilVistasTexto.textContent = `${talent.profile_views || 0} vistas del perfil`;
        }
        
        if (talent.base_price) {
            const formattedPrice = parseFloat(talent.base_price).toLocaleString('es-BO');
            perfilPrecio.innerHTML = `
                <span class="text-4xl sm:text-5xl font-black tracking-tight leading-none price-gradient-light dark:price-gradient-dark my-1">${formattedPrice}</span>
                <span class="text-base font-bold text-slate-400 dark:text-slate-500">Bs.</span>
            `;
        } else {
            perfilPrecio.innerHTML = `
                <span class="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-slate-500 tracking-tight leading-none my-1">A convenir</span>
            `;
        }

        // Carga de biografía
        perfilBio.textContent = talent.bio || 'Este artista aún no ha redactado su biografía pública.';

        // Configuración de los canales de comunicación / contacto por WhatsApp
        if (isTalent) {
            btnContacto.classList.add('hidden');
            contactoRolMsg.classList.remove('hidden');
        } else {
            contactoRolMsg.classList.add('hidden');
            const waMessage = `Hola ${artisticName}! Vi tu perfil público en FestiPro y me gustaría cotizar un show para mi evento.`;
            const phone = talent.user?.whatsapp_number || '';
            const waLink = phone ? formatWhatsAppLink(phone, waMessage) : '#';

            btnContacto.href = waLink;
            if (!token) {
                btnContacto.classList.add('requires-auth');
            } else {
                btnContacto.target = '_blank';
            }
            btnContacto.classList.remove('hidden');
        }

        // Incrustación de video en el contenedor YouTube
        const youtubeEmbedUrl = getYouTubeEmbedUrl(talent.youtube_link);
        if (youtubeEmbedUrl) {
            perfilYoutubeIframe.src = youtubeEmbedUrl;
            perfilYoutubeContainer.classList.remove('hidden');
        } else {
            perfilYoutubeContainer.classList.add('hidden');
        }

        // Procesar y mostrar la sección de opiniones
        renderReviews(talent.reviews, talent.average_rating);

        // Desplegar el formulario de opiniones de forma condicional para anfitriones
        const isHost = token && (userRole === 'anfitrión' || userRole === 'anfitrion' || userRole === 'host');
        if (isHost && reviewFormContainer) {
            reviewFormContainer.classList.remove('hidden');
            setupStarSelector();
            setupReviewFormToggle();
        }

        // Construir la galería de portafolio del artista
        const galleries = talent.galleries || [];
        if (galleries.length > 0) {
            galleryImages = galleries.map((g, index) => 
                getAssetUrl(g.image_url, `https://picsum.photos/seed/gallery_${talent.id}_${index}/800/800`)
            );

            perfilGaleriaGrid.innerHTML = galleries.map((g, index) => {
                const isFeatured = index === 0;
                const fallbackRes = isFeatured ? '800/600' : '400/400';
                const imgUrl = getAssetUrl(g.image_url, `https://picsum.photos/seed/gallery_${talent.id}_${index}/${fallbackRes}`);
                const gridClasses = isFeatured
                    ? "col-span-2 aspect-[4/3] md:aspect-auto md:col-span-2 md:row-span-2"
                    : "aspect-square";
                return `
                    <div class="${gridClasses} rounded-2xl overflow-hidden bg-slate-100 dark:bg-fp-surface-dark border border-slate-200/30 dark:border-fp-border-dark group/gallery cursor-zoom-in relative" data-gallery-index="${index}">
                        <img src="${imgUrl}" alt="Foto de portafolio" class="w-full h-full object-cover transition-transform duration-500 group-hover/gallery:scale-105" loading="lazy">
                        <div class="absolute inset-0 gallery-overlay-premium flex items-center justify-center pointer-events-none">
                            <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg gallery-icon-zoom">
                                <i class="ph-fill ph-magnifying-glass-plus text-white text-xl"></i>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            perfilGaleriaContainer.classList.remove('hidden');
        } else {
            perfilGaleriaContainer.classList.add('hidden');
        }

        // Vincular eventos de apertura al visor de avatar y banner
        // Estos se configuran de forma segura una sola vez en setupLightboxListeners
        setupLightboxListeners();

        // Inicializar el efecto de foco/spotlight en las tarjetas del perfil
        setupSpotlights();

        // Ocultar placeholders/esqueletos y mostrar el contenido final de la página
        if (profileSkeleton) {
            profileSkeleton.classList.add('hidden');
        }
        if (profileContent) {
            profileContent.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error cargando los detalles del talento:', error);
        renderErrorState('No se pudo conectar con el servidor para obtener los datos de este perfil.');
    }
}

// ══════════════════════════════════════════
// SECCIÓN 10: PUNTO DE ENTRADA (INIT)
// ══════════════════════════════════════════

// Iniciar consulta de datos cuando el DOM está completamente cargado y parseado
document.addEventListener('DOMContentLoaded', loadTalentData);
