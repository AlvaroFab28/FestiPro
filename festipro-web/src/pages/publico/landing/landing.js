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
 * Configura la animación de scroll para las tarjetas genéricas (Catálogos)
 */
function setupScrollReveal() {
    const cards = document.querySelectorAll('.catalog-card, .event-card');
    
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
                    entry.target.classList.add('catalog-card-visible', 'event-card-visible');
                }, idx * 70);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
}

/**
 * Dibuja una estrella de 5 puntas
 */
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

/**
 * Inicializa las partículas dinámicas en el Hero Canvas
 */
function initHeroParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const isDark = document.documentElement.classList.contains('dark');
    
    // Config de colores basados en el tema
    const colorRGB = isDark ? '255, 255, 255' : '147, 51, 234'; // Blanco en dark, Morado en light

    function resize() {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = isDark ? (Math.random() * 2.2 + 0.8) : (Math.random() * 2.5 + 1.5);
            
            // Más velocidad y parpadeo de noche, más lento de día
            if (isDark) {
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
                this.alphaChange = (Math.random() * 0.015) + 0.005;
            } else {
                this.speedX = Math.random() * 0.14 - 0.07;
                this.speedY = Math.random() * 0.14 - 0.07;
                this.alphaChange = (Math.random() * 0.006) + 0.002;
            }
            
            this.alpha = Math.random();
            this.direction = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > width || this.x < 0) this.speedX *= -1;
            if (this.y > height || this.y < 0) this.speedY *= -1;

            this.alpha += this.alphaChange * this.direction;
            if (this.alpha >= 1) {
                this.alpha = 1;
                this.direction = -1;
            } else if (this.alpha <= 0) {
                this.alpha = 0;
                this.direction = 1;
                // Reposition randomly
                this.x = Math.random() * width;
                this.y = Math.random() * height;
            }
        }

        draw() {
            ctx.save();
            if (isDark) {
                // Dibujar estrellita tipo punto circular relleno de noche
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.95})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.fill();
            } else {
                // Dibujar estrella de 5 puntas literal de día (solo contorno)
                const spikes = 5;
                const outerRadius = this.size * 2.5;
                const innerRadius = this.size * 1.0;
                drawStar(ctx, this.x, this.y, spikes, outerRadius, innerRadius);
                ctx.strokeStyle = `rgba(${colorRGB}, ${this.alpha * 0.6})`;
                ctx.lineWidth = 1.25;
                ctx.shadowBlur = 4;
                ctx.shadowColor = `rgba(${colorRGB}, ${this.alpha})`;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function init() {
        resize();
        particles = [];
        // Más partículas de noche (original de 100 en desktop), menos de día (35)
        let numParticles;
        if (isDark) {
            numParticles = window.innerWidth < 768 ? 40 : 100;
        } else {
            numParticles = window.innerWidth < 768 ? 15 : 35;
        }
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    
    // Escuchar cambios de tema para ajustar color
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                initHeroParticles(); // Reiniciar con nuevos colores
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

    init();
    animate();
}

/**
 * Configura las animaciones secuenciales de scroll para el Showcase y Timeline
 */
function setupPremiumScrollAnimations() {
    // 1. Showcase Section Items
    const showcaseItems = document.querySelectorAll('.showcase-item');
    const showcaseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                showcaseObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
    showcaseItems.forEach(item => showcaseObserver.observe(item));

    // 2. Timeline "How It Works"
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineNodes = document.querySelectorAll('.timeline-node');
    const stepCards = document.querySelectorAll('.step-card');
    
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stepIndex = Array.from(timelineNodes).indexOf(entry.target);
                
                // Animar el nodo y la tarjeta
                entry.target.classList.add('active');
                if (stepCards[stepIndex]) {
                    stepCards[stepIndex].classList.add('in-view');
                }
                
                // Actualizar la línea de progreso vertical
                if (timelineProgress) {
                    const percentage = ((stepIndex + 1) / timelineNodes.length) * 100;
                    timelineProgress.style.height = `${percentage}%`;
                }
            }
        });
    }, { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' });

    timelineNodes.forEach(node => timelineObserver.observe(node));

    // 3. Elementos con Scroll Reveal Genérico
    const revealItems = document.querySelectorAll('.scroll-reveal-item');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-reveal-active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
}

/**
 * Carga los primeros 4 talentos destacados desde la API pública.
 */
async function cargarTalentosDestacados() {
    const contenedor = document.getElementById('talentos-destacados');
    if (!contenedor) return;

    // Skeletons base para el nuevo diseño (opcional actualizar diseño interno si es necesario)
    // Se mantiene intacta la lógica de pintado
    try {
        const response = await apiClient.get('/talentos');
        const talentos = response?.data?.data || [];
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

        const htmlCards = destacados.map(talent => {
            const artisticName = talent.artistic_name || talent.user?.name;
            const ratingFloat = parseFloat(talent.average_rating || 0);
            const rating = ratingFloat > 0 ? ratingFloat.toFixed(1) : 'Nuevo';

            const basePrice = talent.base_price 
                ? parseFloat(talent.base_price).toLocaleString('es-BO') + ' Bs.' 
                : 'A convenir';

            // Status Badge
            const statusBadgeHTML = talent.is_available 
                ? `
                    <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/90 text-white shadow-sm backdrop-blur-xs">
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

            // Avatar Fallback Logic
            let avatarHTML = '';
            if (talent.user?.avatar_url && talent.user.avatar_url.trim() !== '') {
                const avatarUrl = getAssetUrl(talent.user.avatar_url);
                avatarHTML = `<img src="${avatarUrl}" alt="${artisticName}" loading="lazy" class="relative z-20 w-20 h-20 rounded-2xl object-cover border-[3px] border-white dark:border-[#1f1f1f] shadow-md bg-slate-100 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">`;
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
                    <div class="relative z-20 w-20 h-20 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-extrabold text-3xl border-[3px] border-white dark:border-[#1f1f1f] shadow-md flex-shrink-0 select-none transition-transform duration-300 group-hover:scale-105">
                        ${initial}
                    </div>
                `;
            }

            // Banner Fallback Logic
            let bannerHTML = '';
            if (talent.banner_url) {
                const bannerImg = getAssetUrl(talent.banner_url);
                bannerHTML = `
                    <img src="${bannerImg}" 
                         alt="${artisticName}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         loading="lazy">
                `;
            } else {
                bannerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-fp-primary-light to-fp-accent-light relative flex items-center justify-center overflow-hidden">
                        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30"></div>
                        <span class="text-white/20 font-display font-extrabold text-3xl tracking-widest select-none transform -rotate-12 pointer-events-none">FestiPro ✦</span>
                    </div>
                `;
            }

            return `
                <article class="catalog-card spotlight-card group relative rounded-3xl overflow-hidden flex flex-col h-full cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-slate-200 dark:border-slate-800" onclick="window.location.href='/src/pages/publico/perfil/perfil-talento.html?id=${talent.id}'">
                    <!-- Shimmer premium -->
                    <div class="card-shimmer"></div>

                    <!-- Banner de Fondo -->
                    <div class="relative z-20 h-48 overflow-hidden bg-slate-100 dark:bg-fp-surface-dark flex items-center justify-center">
                        ${bannerHTML}
                        ${statusBadgeHTML}
                        <span class="absolute bottom-3 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-extrabold bg-white/70 dark:bg-fp-surface-dark/70 text-slate-800 dark:text-white shadow-xs backdrop-blur-xs">
                            ${talent.category?.name || 'Artista'}
                        </span>
                    </div>

                    <!-- Avatar flotante overlapping -->
                    <div class="relative px-6 z-30 flex justify-start">
                        <div class="absolute -top-10 left-6">
                            ${avatarHTML}
                        </div>
                    </div>

                    <!-- Contenido de la Tarjeta -->
                    <div class="p-6 pt-12 flex flex-col flex-grow bg-white dark:bg-[#131b2e]">
                        <div class="mb-4">
                            <h3 class="font-display font-black text-[20px] text-slate-955 dark:text-white leading-snug truncate tracking-tight group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors">
                                ${artisticName}
                            </h3>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-zinc-800/80 text-slate-655 dark:text-zinc-200 border border-slate-200/40 dark:border-zinc-700/50 rounded-full text-[11px] font-bold">
                                    <i class="ph-fill ph-map-pin text-slate-400 dark:text-zinc-400"></i> ${talent.city?.name || 'Bolivia'}
                                </span>
                                <span class="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-extrabold">
                                    <i class="ph-fill ph-star text-[12px]"></i> ${rating}
                                </span>
                            </div>
                        </div>

                        <p class="text-sm text-slate-655 dark:text-slate-350 line-clamp-2 leading-relaxed mb-5 flex-grow">
                            ${talent.bio || 'Explora mi portafolio para conocer más sobre mi trabajo y shows en vivo.'}
                        </p>

                        <!-- Footer -->
                        <div class="pt-4 border-t border-slate-100 dark:border-fp-border-dark/40 flex items-center justify-between mt-auto">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-slate-455 dark:text-slate-500 uppercase tracking-wider font-bold">Tarifa desde</span>
                                <span class="text-lg font-black catalog-card-price mt-0.5">
                                    ${basePrice}
                                </span>
                            </div>
                            
                            <span class="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 dark:bg-fp-surface-muted-dark group-hover:bg-fp-primary-light group-hover:text-white dark:group-hover:bg-fp-primary-dark text-slate-700 dark:text-slate-350 font-bold text-sm rounded-xl transition-all duration-300">
                                Ver Perfil
                            </span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        contenedor.innerHTML = htmlCards;

        // Activar spotlights y scroll reveal
        if (window.setupSpotlights) window.setupSpotlights();
        setupScrollReveal();

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

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role');
    const isHost = token && (userRole === 'anfitrion' || userRole === 'anfitrión');

    try {
        const response = await apiClient.get('/eventos');
        const eventos = response?.data?.data || [];
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

        const htmlCards = proximos.map(event => {
            const title = event.title;
            const categoryName = event.category?.name || 'Talento';
            const cityName = event.city?.name || 'Bolivia';
            const description = event.description || 'Sin detalles del show requeridos.';
            
            const isEstimated = !event.estimated_budget;
            const formattedBudget = event.estimated_budget 
                ? parseFloat(event.estimated_budget).toLocaleString('es-BO') 
                : 'A convenir';

            const status = (event.status || 'abierto').toLowerCase();
            const dateObj = event.event_date ? new Date(event.event_date) : new Date();
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
            const year = dateObj.getFullYear();

            // Ribbon
            let ribbonHTML = '';
            if (status === 'abierto') {
                ribbonHTML = `
                  <div class="absolute top-0 right-0 w-[75px] h-[75px] overflow-hidden pointer-events-none z-30">
                    <div class="absolute top-[14px] -right-[22px] w-[95px] py-0.5 bg-gradient-to-r from-[#6c5ce7] to-[#9350FF] text-white text-[9px] font-black text-center uppercase tracking-widest rotate-45 shadow-xs ribbon-shimmer-diagonal">
                      ABIERTO
                    </div>
                  </div>
                `;
            }

            let actionBtnHTML = '';
            const reqAuthClass = !token ? 'requires-auth' : '';

            const hostName = event.host?.name || 'Anfitrión';
            const waMessage = `Hola ${hostName}! Vi tu anuncio de evento "${title}" en FestiPro y me gustaría postularme como artista para cubrir tu show.`;
            const waLink = event.host?.whatsapp_number ? formatWhatsAppLink(event.host.whatsapp_number, waMessage) : '#';

            if (status === 'abierto') {
                if (isHost) {
                    actionBtnHTML = `
                        <a href="/src/pages/anfitrion/dashboard.html" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group/btn no-card-click select-none">
                            <span>Crear</span>
                            <i class="ph ph-plus-circle text-sm"></i>
                        </a>
                    `;
                } else {
                    actionBtnHTML = `
                        <a href="${waLink}" target="_blank" class="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-zinc-800 dark:hover:border-indigo-400 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group/btn no-card-click select-none ${reqAuthClass}">
                            <span>Contactar</span>
                            <i class="ph ph-paper-plane-tilt text-sm transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200"></i>
                        </a>
                    `;
                }
            } else {
                actionBtnHTML = `
                    <span class="text-slate-400 dark:text-slate-500 text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/35 select-none flex items-center gap-1.5 no-card-click">
                        <i class="ph ph-lock-key text-sm"></i> Finalizado
                    </span>
                `;
            }

            return `
                <article class="event-card spotlight-card flex flex-col sm:flex-row bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-fp-border-dark/65 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08),0_10px_30px_-10px_rgba(37,99,235,0.15)] dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.5),0_10px_30px_-10px_rgba(108,92,231,0.1)] hover:shadow-[0_30px_60px_-10px_rgba(37,99,235,0.25),0_12px_25px_-8px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_30px_60px_-10px_rgba(108,92,231,0.3),0_12px_25px_-8px_rgba(147,80,255,0.2)] hover:border-blue-500 dark:hover:border-indigo-500/70 transition-all duration-500 w-full group relative overflow-hidden">
                  
                  ${ribbonHTML}

                  <!-- DOBLE BLOW DE COLOR -->
                  <div class="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 dark:from-blue-600/10 dark:via-blue-500/5 dark:to-sky-400/5 rounded-full blur-2xl opacity-25 dark:opacity-30 pointer-events-none z-0"></div>
                  <div class="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500 dark:from-blue-500/10 dark:via-sky-500/5 dark:to-indigo-500/5 rounded-full blur-2xl opacity-20 dark:opacity-25 pointer-events-none z-0"></div>

                  <!-- SECCIÓN IZQUIERDA: Calendario 3D -->
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
                    
                    <span class="block text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2 mb-2">${month} ${year}</span>
                  </div>

                  <!-- SECCIÓN DERECHA: Info del Evento -->
                  <div class="p-6 flex-1 flex flex-col justify-between relative z-10 min-w-0">
                    <div class="mb-3">
                      <div class="flex items-center justify-between gap-4 mb-2">
                        <h3 class="text-base sm:text-lg font-extrabold text-slate-855 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">${title}</h3>
                      </div>

                      <div class="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span class="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-blue-500/20 dark:border-indigo-500/20 rounded font-bold shadow-3xs flex items-center gap-1 hover-tag-anim">
                          <i class="ph ph-tag text-xs"></i> ${categoryName}
                        </span>
                        <span class="px-2.5 py-1 bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border border-slate-500/20 rounded font-bold shadow-3xs flex items-center gap-1 hover-map-anim">
                          <i class="ph ph-map-pin text-xs"></i> ${cityName}
                        </span>
                      </div>
                    </div>

                    <p class="text-sm text-slate-600 dark:text-slate-350 line-clamp-2 leading-relaxed mb-5">
                      ${description}
                    </p>

                    <!-- Footer -->
                    <div class="pt-3 border-t border-slate-100 dark:border-fp-border-dark/40 flex items-center justify-between mt-auto">
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ofrece</span>
                        <span class="text-lg font-black catalog-card-price whitespace-nowrap">
                          ${formattedBudget} ${!isEstimated ? 'Bs.' : ''}
                        </span>
                      </div>
                      
                      ${actionBtnHTML}
                    </div>
                  </div>
                </article>
            `;
        }).join('');

        contenedor.innerHTML = htmlCards;

        // Activar spotlights y scroll reveal
        if (window.setupSpotlights) window.setupSpotlights();
        setupScrollReveal();

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

/**
 * Carga estadísticas reales desde el backend
 */
async function cargarEstadisticas() {
    const statArtistas = document.getElementById('stat-artistas');
    const statEventos = document.getElementById('stat-eventos');
    const statRating = document.getElementById('stat-rating');
    
    try {
        const response = await apiClient.get('/stats');
        const stats = response?.data || {};
        
        // Animación de conteo ascendente
        const animateCount = (el, max) => {
            if (!el) return;
            let current = 0;
            const increment = Math.max(1, Math.ceil(max / 50));
            const timer = setInterval(() => {
                current += increment;
                if (current >= max) {
                    current = max;
                    clearInterval(timer);
                }
                el.textContent = current;
            }, 30);
        };

        if (statArtistas) animateCount(statArtistas, stats.artistas !== undefined ? stats.artistas : 150);
        if (statEventos) animateCount(statEventos, stats.eventos !== undefined ? stats.eventos : 300);
        if (statRating) statRating.textContent = (stats.rating !== undefined ? stats.rating : 4.8);
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        if (statArtistas) statArtistas.textContent = '240';
        if (statEventos) statEventos.textContent = '180';
        if (statRating) statRating.textContent = '4.9';
    }
}

/**
 * Carga categorías dinámicas y asignarles estilos de la landing
 */
async function cargarCategorias() {
    const contenedor = document.getElementById('categorias-grid');
    if (!contenedor) return;

    try {
        const response = await apiClient.get('/categorias');
        const categorias = response?.data || [];
        
        // Limitar a las primeras 5 para dejar espacio a "Ver todo"
        const primerasCategorias = categorias.slice(0, 5);
        
        const CATEGORY_STYLES = [
            { gradient: 'from-indigo-400 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800', icon: 'ph-headphones' },
            { gradient: 'from-rose-400 to-rose-600 dark:from-rose-600 dark:to-rose-800', icon: 'ph-guitar' },
            { gradient: 'from-amber-400 to-amber-600 dark:from-amber-600 dark:to-amber-800', icon: 'ph-magic-wand' },
            { gradient: 'from-emerald-400 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800', icon: 'ph-microphone-stage' },
            { gradient: 'from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800', icon: 'ph-mask-happy' },
        ];

        let html = primerasCategorias.map((cat, index) => {
            const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
            const icon = cat.icon_class || style.icon;
            const gradient = style.gradient;

            return `
                <a href="/src/pages/publico/catalogo/catalogo.html?categoria=${cat.id}" class="group relative flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:border-fp-primary-light/50 dark:hover:border-fp-primary-dark/50 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden spotlight-card">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br ${gradient} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
                        <i class="ph-fill ${icon} text-3xl group-hover:animate-bounce"></i>
                    </div>
                    <span class="font-display font-extrabold text-slate-800 dark:text-slate-100 text-center group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors duration-300 relative z-10">${cat.nombre}</span>
                </a>
            `;
        }).join('');

        // Añadir la tarjeta "Ver todo" de forma manual al final
        html += `
            <a href="/src/pages/publico/catalogo/catalogo.html" class="group relative flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:border-fp-primary-light/50 dark:hover:border-fp-primary-dark/50 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden spotlight-card">
                <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
                    <i class="ph-fill ph-sparkle text-3xl group-hover:animate-spin"></i>
                </div>
                <span class="font-display font-extrabold text-slate-800 dark:text-slate-100 text-center group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors duration-300 relative z-10">Ver todo</span>
            </a>
        `;

        contenedor.innerHTML = html;

        if (window.setupSpotlights) window.setupSpotlights();

    } catch (error) {
        console.error('Error al cargar categorías en la Landing:', error);
        contenedor.innerHTML = `
            <div class="col-span-full py-6 text-center text-slate-500">
                No se pudieron cargar las categorías. <a href="/src/pages/publico/catalogo/catalogo.html" class="text-fp-primary-light hover:underline font-bold">Ver catálogo completo</a>
            </div>
        `;
    }
}

/**
 * Configura la barra de progreso de scroll superior
 */
function setupScrollProgress() {
    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const bar = document.getElementById('scroll-progress-bar');
        if (bar) bar.style.width = scrolled + '%';
    });
}

/**
 * Configuración de coordenadas (sobre viewport 500x500 del SVG)
 * y nombres para los departamentos de Bolivia.
 */
const DEPTS_CONFIG = {
    'BO-B': { name: 'Beni', x: 200, y: 150 },
    'BO-C': { name: 'Cochabamba', x: 170, y: 280 },
    'BO-H': { name: 'Chuquisaca', x: 220, y: 370 },
    'BO-L': { name: 'La Paz', x: 80, y: 200 },
    'BO-N': { name: 'Pando', x: 100, y: 65 },
    'BO-O': { name: 'Oruro', x: 90, y: 330 },
    'BO-P': { name: 'Potosí', x: 120, y: 410 },
    'BO-S': { name: 'Santa Cruz', x: 330, y: 270 },
    'BO-T': { name: 'Tarija', x: 240, y: 440 }
};

let deptsData = {
    'BO-B': { name: 'Beni', x: 200, y: 150, talents: 0, events: 0 },
    'BO-C': { name: 'Cochabamba', x: 170, y: 280, talents: 0, events: 0 },
    'BO-H': { name: 'Chuquisaca', x: 220, y: 370, talents: 0, events: 0 },
    'BO-L': { name: 'La Paz', x: 80, y: 200, talents: 0, events: 0 },
    'BO-N': { name: 'Pando', x: 100, y: 65, talents: 0, events: 0 },
    'BO-O': { name: 'Oruro', x: 90, y: 330, talents: 0, events: 0 },
    'BO-P': { name: 'Potosí', x: 120, y: 410, talents: 0, events: 0 },
    'BO-S': { name: 'Santa Cruz', x: 330, y: 270, talents: 0, events: 0 },
    'BO-T': { name: 'Tarija', x: 240, y: 440, talents: 0, events: 0 }
};

/**
 * Carga los datos reales agregados por departamento y renderiza el mapa
 */
async function cargarDatosMapa() {
    try {
        const response = await apiClient.get('/stats/map');
        const mapData = response?.data || {};
        
        // Resetear contadores y aplicar los nuevos datos del backend
        for (const id in deptsData) {
            if (mapData[id]) {
                deptsData[id].talents = mapData[id].talents || 0;
                deptsData[id].events = mapData[id].events || 0;
            } else {
                deptsData[id].talents = 0;
                deptsData[id].events = 0;
            }
        }
        
        // Renderizar pines e interacciones
        renderMapaBolivia();
    } catch (error) {
        console.error('Error al inicializar datos agregados del mapa:', error);
    }
}

/**
 * Selecciona y destaca un departamento específico en el mapa y posiciona el tooltip flotante
 */
function selectDepartment(id) {
    const data = deptsData[id];
    if (!data) return;
    
    // Destacar el path SVG correspondiente
    const paths = document.querySelectorAll('.map-dept-path');
    paths.forEach(path => {
        const pathId = path.getAttribute('data-dept-id');
        if (pathId === id) {
            path.classList.remove('fill-slate-700/60', 'stroke-slate-400/80', 'stroke-1');
            path.classList.add('fill-purple-500/35', 'stroke-purple-400', 'stroke-[1.5]');
        } else {
            path.classList.add('fill-slate-700/60', 'stroke-slate-400/80', 'stroke-1');
            path.classList.remove('fill-purple-500/35', 'stroke-purple-400', 'stroke-[1.5]');
        }
    });
    
    // Destacar el pin activo en el contenedor de pines
    const pins = document.querySelectorAll('#map-pins-container > div');
    pins.forEach(pin => {
        const pinId = pin.getAttribute('data-dept-id');
        const coreDot = pin.querySelector('.w-3\\.5');
        if (pinId === id) {
            pin.classList.add('scale-125');
            if (coreDot) {
                coreDot.classList.add('ring-4', 'ring-purple-500/35', 'dark:ring-purple-400/35');
            }
        } else {
            pin.classList.remove('scale-125');
            if (coreDot) {
                coreDot.classList.remove('ring-4', 'ring-purple-500/35', 'dark:ring-purple-400/35');
            }
        }
    });
    
    // Posicionar y rellenar el tooltip flotante
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
        const nameEl = document.getElementById('tooltip-dept-name');
        const talentsEl = document.getElementById('tooltip-talents-count');
        const eventsEl = document.getElementById('tooltip-events-count');
        
        if (nameEl) nameEl.textContent = data.name;
        if (talentsEl) talentsEl.textContent = data.talents;
        if (eventsEl) eventsEl.textContent = data.events;
        
        // Obtener coordenadas en base al viewport del SVG
        const pctX = (data.x / 500) * 100;
        const pctY = (data.y / 500) * 100;
        
        tooltip.style.left = `${pctX}%`;
        tooltip.style.top = `${pctY}%`;
        tooltip.style.transform = 'translate(-50%, -130%)';
        
        // Efecto Fade In
        tooltip.classList.remove('opacity-0', 'translate-y-2');
        tooltip.classList.add('opacity-100', 'translate-y-0');
    }
}

/**
 * Oculta el tooltip y limpia las iluminaciones de los elementos activos del mapa
 */
function hideTooltip() {
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
        tooltip.classList.remove('opacity-100', 'translate-y-0');
        tooltip.classList.add('opacity-0', 'translate-y-2');
    }
    
    // Limpiar paths SVG
    const paths = document.querySelectorAll('.map-dept-path');
    paths.forEach(path => {
        path.classList.add('fill-slate-700/60', 'stroke-slate-400/80', 'stroke-1');
        path.classList.remove('fill-purple-500/35', 'stroke-purple-400', 'stroke-[1.5]');
    });
    
    // Limpiar pines
    const pins = document.querySelectorAll('#map-pins-container > div');
    pins.forEach(pin => {
        pin.classList.remove('scale-125');
        const coreDot = pin.querySelector('.w-3\\.5');
        if (coreDot) {
            coreDot.classList.remove('ring-4', 'ring-purple-500/35', 'dark:ring-purple-400/35');
        }
    });
}

/**
 * Renderiza dinámicamente los pines interactivos del mapa sobre las coordenadas proyectadas
 */
function renderMapaBolivia() {
    const pinsContainer = document.getElementById('map-pins-container');
    if (!pinsContainer) return;
    
    pinsContainer.innerHTML = '';
    
    // Filtrar departamentos activos que tienen artistas o eventos reales
    const activeDepts = Object.entries(deptsData).filter(([id, data]) => data.talents > 0 || data.events > 0);
    
    activeDepts.forEach(([id, data]) => {
        const pctX = (data.x / 500) * 100;
        const pctY = (data.y / 500) * 100;
        
        const pin = document.createElement('div');
        pin.className = 'absolute group cursor-pointer pointer-events-auto transition-all duration-300';
        pin.style.left = `${pctX}%`;
        pin.style.top = `${pctY}%`;
        pin.style.transform = 'translate(-50%, -50%)';
        pin.setAttribute('data-dept-id', id);
        
        pin.innerHTML = `
            <!-- Ondas concéntricas de radar animadas -->
            <div class="absolute w-6 h-6 -left-3 -top-3 rounded-full bg-purple-500/30 dark:bg-purple-500/20 animate-ping" style="animation-duration: 3s;"></div>
            <div class="absolute w-10 h-10 -left-5 -top-5 rounded-full bg-purple-500/10 dark:bg-purple-500/5 animate-ping" style="animation-duration: 4.5s;"></div>
            <!-- Punto central del pin -->
            <div class="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 shadow-[0_0_12px_#9333ea] dark:shadow-[0_0_15px_#a855f7] border-2 border-white dark:border-zinc-900 transition-transform duration-300 group-hover:scale-125"></div>
        `;
        
        pinsContainer.appendChild(pin);
        
        // Interactividad al pasar el cursor sobre el ping
        pin.addEventListener('mouseenter', () => {
            selectDepartment(id);
        });
        
        // Interactividad al hacer click
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDepartment(id);
        });
    });
    
    // Registrar interactividad de hover en los paths SVG del mapa
    const paths = document.querySelectorAll('.map-dept-path');
    paths.forEach(path => {
        const id = path.getAttribute('data-dept-id');
        path.addEventListener('mouseenter', () => {
            selectDepartment(id);
        });
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDepartment(id);
        });
    });
    
    // Registrar evento de salida del cursor en todo el wrapper para ocultar el tooltip
    const wrapper = pinsContainer.parentElement;
    if (wrapper) {
        wrapper.removeEventListener('mouseleave', hideTooltip);
        wrapper.addEventListener('mouseleave', hideTooltip);
    }
    
    // Inicializar oculto al inicio
    hideTooltip();
}

/**
 * Configura el botón y el modal de agradecimiento (USFX)
 */
function setupAgradecimientoModal() {
    const btnAgradecimiento = document.getElementById('btn-agradecimiento');
    const modalAgradecimiento = document.getElementById('modal-agradecimiento');
    const btnCloseBottom = document.getElementById('btn-close-modal-bottom');

    if (!modalAgradecimiento) return;

    // Función para abrir el modal
    const openModal = () => {
        modalAgradecimiento.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
    };

    // Función para cerrar el modal
    const closeModal = () => {
        modalAgradecimiento.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    };

    // Registrar eventos para abrir
    if (btnAgradecimiento) {
        btnAgradecimiento.addEventListener('click', openModal);
    }

    // Registrar eventos para cerrar
    if (btnCloseBottom) {
        btnCloseBottom.addEventListener('click', closeModal);
    }

    // Cerrar al hacer click fuera del contenedor del modal
    modalAgradecimiento.addEventListener('click', (e) => {
        if (e.target === modalAgradecimiento) {
            closeModal();
        }
    });

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalAgradecimiento.classList.contains('active')) {
            closeModal();
        }
    });

    // Auto-abrir en la primera visita usando sessionStorage
    const yaVisito = sessionStorage.getItem('festipro_agradecimiento_visto');
    if (!yaVisito) {
        // Un leve retraso de 800ms para permitir que carguen las animaciones de la landing antes del modal
        setTimeout(() => {
            openModal();
            sessionStorage.setItem('festipro_agradecimiento_visto', 'true');
        }, 800);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initHeroParticles();
    cargarEstadisticas();
    cargarCategorias();
    cargarTalentosDestacados();
    cargarEventosProximos();
    setupPremiumScrollAnimations();
    setupScrollProgress();
    cargarDatosMapa();
    setupAgradecimientoModal();
});
