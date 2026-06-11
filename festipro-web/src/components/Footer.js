export function getFooterHTML() {
    const currentYear = new Date().getFullYear();
    return `
        <div class="relative bg-slate-50 dark:bg-fp-surface-dark border-t border-slate-200 dark:border-fp-border-dark py-10 transition-colors duration-300 h-full flex items-center">
            <div class="container mx-auto px-6 relative z-20">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-center md:text-left">
                    <!-- Columna 1: Marca y Redes -->
                    <div class="flex flex-col items-center md:items-start space-y-3">
                        <span class="text-xl font-display font-bold text-fp-primary-light dark:text-fp-primary-dark">
                            FestiPro<span class="text-fp-accent-light dark:text-fp-accent-dark">.</span>
                        </span>
                        <p class="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
                            Conectando talento artístico de primer nivel con los mejores eventos. Tu socio tecnológico en entretenimiento.
                        </p>
                        <div class="flex space-x-4 pt-1">
                            <a href="#" class="text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark transition-colors" aria-label="Facebook">
                                <i class="ph ph-facebook-logo text-xl"></i>
                            </a>
                            <a href="#" class="text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark transition-colors" aria-label="Instagram">
                                <i class="ph ph-instagram-logo text-xl"></i>
                            </a>
                            <a href="#" class="text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark transition-colors" aria-label="Twitter">
                                <i class="ph ph-twitter-logo text-xl"></i>
                            </a>
                            <a href="#" class="text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark transition-colors" aria-label="LinkedIn">
                                <i class="ph ph-linkedin-logo text-xl"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Columna 2: Enlaces Útiles -->
                    <div class="flex flex-col items-center md:items-start space-y-3">
                        <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Compañía
                        </h4>
                        <nav class="flex flex-col space-y-2 text-sm">
                            <button id="btn-footer-about" class="text-slate-500 dark:text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark text-left transition-colors font-medium focus:outline-none">
                                Sobre Nosotros
                            </button>
                            <button id="btn-footer-terms" class="text-slate-500 dark:text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark text-left transition-colors font-medium focus:outline-none">
                                Términos de Servicio
                            </button>
                            <button id="btn-footer-privacy" class="text-slate-500 dark:text-slate-400 hover:text-fp-accent-light dark:hover:text-fp-accent-dark text-left transition-colors font-medium focus:outline-none">
                                Política de Privacidad
                            </button>
                        </nav>
                    </div>

                    <!-- Columna 3: Información e Intermediación -->
                    <div class="flex flex-col items-center md:items-start space-y-3">
                        <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Plataforma
                        </h4>
                        <p class="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed text-justify md:text-left">
                            FestiPro actúa exclusivamente como un facilitador tecnológico de intermediación. No asumimos responsabilidad alguna sobre el cumplimiento de acuerdos contractuales, calidad artística, pagos pendientes o disputas derivadas de los servicios coordinados.
                        </p>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-200 dark:border-fp-border-dark flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <div>
                        &copy; ${currentYear} FestiPro. Todos los derechos reservados.
                    </div>
                    <div class="flex items-center gap-2 font-medium">
                        <i class="ph ph-heart text-base text-rose-500 animate-pulse"></i>
                        <span>Hecho en la Facultad de Tecnología - USFX para toda Bolivia</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modales (Inyectados fuera del flujo visual) -->
        <!-- Modal: Sobre Nosotros -->
        <div id="modal-footer-about" class="fixed inset-0 z-[100] hidden items-center justify-center p-4" role="dialog" aria-modal="true">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm modal-backdrop"></div>
            <!-- Content Container -->
            <div class="relative bg-white dark:bg-fp-surface-dark border border-slate-200 dark:border-fp-border-dark rounded-2xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] transition-all duration-300 transform scale-95 opacity-0">
                <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors btn-modal-close" aria-label="Cerrar">
                    <i class="ph ph-x text-2xl"></i>
                </button>
                
                <div class="text-center mb-8">
                    <span class="px-3 py-1 text-xs font-semibold tracking-wider text-fp-accent-light dark:text-fp-accent-dark bg-fp-accent-light/10 dark:bg-fp-accent-dark/10 rounded-full uppercase">
                        El Equipo Creativo
                    </span>
                    <h3 class="text-2xl sm:text-3xl font-display font-bold text-slate-800 dark:text-slate-100 mt-2">
                        Sobre Nosotros
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto text-sm">
                        Conoce a los creadores encargados de estructurar la infraestructura y la experiencia inmersiva del ecosistema FestiPro.
                    </p>
                </div>

                <!-- Grilla de Desarrolladores -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Dev 1: Alvaro Fabian Villena Mamani -->
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fp-border-dark/60 rounded-xl p-5 text-center flex flex-col items-center hover:border-fp-accent-light dark:hover:border-fp-accent-dark hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold font-display shadow-md shadow-indigo-500/20 mb-4">
                            AV
                        </div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Villena Mamani Alvaro Fabian</h4>
                        <p class="text-xs font-semibold text-fp-accent-light dark:text-fp-accent-dark mt-0.5">Fullstack Architect & Product Owner</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">"Liderando la arquitectura de sistemas, diseño UI/UX y la visión estratégica del producto."</p>
                    </div>
                    <!-- Dev 2: Luis Hernan Huallpa Franses -->
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fp-border-dark/60 rounded-xl p-5 text-center flex flex-col items-center hover:border-fp-accent-light dark:hover:border-fp-accent-dark hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold font-display shadow-md shadow-emerald-500/20 mb-4">
                            LH
                        </div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Huallpa Franses Luis Hernan</h4>
                        <p class="text-xs font-semibold text-fp-accent-light dark:text-fp-accent-dark mt-0.5">Lead Backend Engineer & Cloud Architect</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">"Estructurando bases de datos, APIs de alto rendimiento y la lógica del servidor."</p>
                    </div>
                    <!-- Dev 3: Marco Lopez Yapu -->
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fp-border-dark/60 rounded-xl p-5 text-center flex flex-col items-center hover:border-fp-accent-light dark:hover:border-fp-accent-dark hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white text-lg font-bold font-display shadow-md shadow-pink-500/20 mb-4">
                            ML
                        </div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Lopez Yapu Marco</h4>
                        <p class="text-xs font-semibold text-fp-accent-light dark:text-fp-accent-dark mt-0.5">Lead Mobile & Frontend Engineer</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">"Perfeccionando la interactividad web y llevando la experiencia a dispositivos móviles."</p>
                    </div>
                    <!-- Dev 4: Gustavo Gabriel Apaza Albarado -->
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-fp-border-dark/60 rounded-xl p-5 text-center flex flex-col items-center hover:border-fp-accent-light dark:hover:border-fp-accent-dark hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold font-display shadow-md shadow-amber-500/20 mb-4">
                            GA
                        </div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Apaza Albarado Gustavo Gabriel</h4>
                        <p class="text-xs font-semibold text-fp-accent-light dark:text-fp-accent-dark mt-0.5">DevOps Director & QA Specialist</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">"Garantizando la estabilidad de producción, pruebas de carga y el ciclo CI/CD."</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Términos y Condiciones / Política de Privacidad -->
        <div id="modal-footer-legal" class="fixed inset-0 z-[100] hidden items-center justify-center p-4" role="dialog" aria-modal="true">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm modal-backdrop"></div>
            <!-- Content Container -->
            <div class="relative bg-white dark:bg-fp-surface-dark border border-slate-200 dark:border-fp-border-dark rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] transition-all duration-300 transform scale-95 opacity-0">
                <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors btn-modal-close" aria-label="Cerrar">
                    <i class="ph ph-x text-2xl"></i>
                </button>
                
                <div class="mb-6">
                    <span id="legal-modal-tag" class="px-3 py-1 text-xs font-semibold tracking-wider text-fp-accent-light dark:text-fp-accent-dark bg-fp-accent-light/10 dark:bg-fp-accent-dark/10 rounded-full uppercase">
                        Información Legal
                    </span>
                    <h3 id="legal-modal-title" class="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 mt-2">
                        Términos de Servicio
                    </h3>
                </div>

                <div id="legal-modal-body" class="text-slate-600 dark:text-slate-300 text-sm space-y-4 leading-relaxed pr-2 overflow-y-auto">
                    <!-- Contenido dinámico -->
                </div>
            </div>
        </div>
    `;
}

export function setupFooter() {
    const btnAbout = document.getElementById('btn-footer-about');
    const btnTerms = document.getElementById('btn-footer-terms');
    const btnPrivacy = document.getElementById('btn-footer-privacy');

    const modalAbout = document.getElementById('modal-footer-about');
    const modalLegal = document.getElementById('modal-footer-legal');

    const legalTitle = document.getElementById('legal-modal-title');
    const legalTag = document.getElementById('legal-modal-tag');
    const legalBody = document.getElementById('legal-modal-body');

    if (!modalAbout || !modalLegal) return;

    function openModal(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Forzar reflujo
        modal.offsetHeight;

        const container = modal.querySelector('.relative');
        if (container) {
            container.classList.remove('scale-95', 'opacity-0');
            container.classList.add('scale-100', 'opacity-100');
        }
        document.body.classList.add('overflow-hidden');
    }

    function closeModal(modal) {
        const container = modal.querySelector('.relative');
        if (container) {
            container.classList.remove('scale-100', 'opacity-100');
            container.classList.add('scale-95', 'opacity-0');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            // Verificar si no hay otros modales abiertos antes de restaurar el scroll
            const openModals = document.querySelectorAll('[id^="modal-footer-"]:not(.hidden)');
            if (openModals.length === 0) {
                document.body.classList.remove('overflow-hidden');
            }
        }, 200);
    }

    if (btnAbout) {
        btnAbout.addEventListener('click', () => openModal(modalAbout));
    }

    if (btnTerms) {
        btnTerms.addEventListener('click', () => {
            legalTag.textContent = 'Información Legal';
            legalTag.className = 'px-3 py-1 text-xs font-semibold tracking-wider text-fp-accent-light dark:text-fp-accent-dark bg-fp-accent-light/10 dark:bg-fp-accent-dark/10 rounded-full uppercase';
            legalTitle.textContent = 'Términos de Servicio';
            legalBody.innerHTML = `
                <p><strong>1. Relación de Intermediación:</strong> FestiPro actúa exclusivamente como un portal tecnológico que facilita la conexión directa entre organizadores de eventos (Anfitriones) y artistas (Talentos). La plataforma no forma parte de los acuerdos contractuales internos entre ambas partes, ni establece relaciones laborales.</p>
                <p><strong>2. Límites de Responsabilidad:</strong> No somos responsables por el incumplimiento de servicios, cancelaciones de última hora, comportamiento inapropiado, impagos o accidentes ocurridos durante los eventos. Cada usuario es plenamente responsable por el cumplimiento de los contratos concertados.</p>
                <p><strong>3. Uso Aceptable:</strong> Los usuarios se comprometen a utilizar los canales oficiales de FestiPro de manera honesta y respetuosa. Queda prohibida la falsificación de credenciales, el spam y el comportamiento discriminatorio.</p>
                <p><strong>4. Modificaciones:</strong> Nos reservamos el derecho de modificar o actualizar estos términos en cualquier momento, informando de dichos cambios en el portal web.</p>
            `;
            openModal(modalLegal);
        });
    }

    if (btnPrivacy) {
        btnPrivacy.addEventListener('click', () => {
            legalTag.textContent = 'Confidencialidad';
            legalTag.className = 'px-3 py-1 text-xs font-semibold tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-400/10 rounded-full uppercase';
            legalTitle.textContent = 'Política de Privacidad';
            legalBody.innerHTML = `
                <p><strong>1. Información Recolectada:</strong> FestiPro recopila datos personales como nombre, correo electrónico, número telefónico y perfiles profesionales/de talento con el único fin de permitir el correcto funcionamiento del catálogo de búsqueda e interacción del sitio.</p>
                <p><strong>2. Uso de la Información:</strong> Tus datos se utilizan para personalizar tu experiencia, procesar solicitudes de contratación, enviarte notificaciones del sistema y mejorar la seguridad del portal.</p>
                <p><strong>3. Protección de Datos:</strong> Implementamos medidas de seguridad técnicas y organizativas para resguardar tu información frente a accesos no autorizados, alteraciones o filtraciones.</p>
                <p><strong>4. Derechos de Acceso y Rectificación:</strong> En todo momento puedes solicitar el acceso, rectificación o eliminación permanente de tus datos de nuestros sistemas a través del formulario de soporte técnico.</p>
            `;
            openModal(modalLegal);
        });
    }

    // Configurar el evento de cierre en los botones y backdrops
    const closeButtons = modalAbout.parentNode.querySelectorAll('.btn-modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.currentTarget.closest('[id^="modal-footer-"]');
            if (modal) closeModal(modal);
        });
    });

    const backdrops = modalAbout.parentNode.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.currentTarget.closest('[id^="modal-footer-"]');
            if (modal) closeModal(modal);
        });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('[id^="modal-footer-"]:not(.hidden)');
            openModals.forEach(modal => closeModal(modal));
        }
    });
}