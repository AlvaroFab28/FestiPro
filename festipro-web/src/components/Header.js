export function getHeaderHTML() {
    // Verificamos si existe un token en el almacenamiento local para saber si está "logueado"
    const isAuthenticated = !!localStorage.getItem('token');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const userName = localStorage.getItem('user_name') || 'Usuario';
    const userAvatar = localStorage.getItem('user_avatar');
    const userRoleLabel = localStorage.getItem('user_role_label') || (isAdmin ? 'Admin' : 'Usuario');
    
    // Ruta actual para marcar el enlace activo
    const pathname = window.location.pathname;
    const isArtistasActive = pathname.includes('/catalogo');
    const isEventosActive = pathname.includes('/eventos');

    // Generamos la URL del avatar si existe
    const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
    const baseUrl = API_URL.replace('/api', '');
    let avatarSrc = '';
    if (userAvatar && userAvatar.trim() !== '') {
        if (userAvatar.startsWith('http://') || userAvatar.startsWith('https://')) {
            avatarSrc = userAvatar;
        } else {
            avatarSrc = `${baseUrl}${userAvatar}`;
        }
    }

    const initial = userName.charAt(0).toUpperCase();

    // Paleta de degradados hermosos para las iniciales del avatar
    const colors = [
        'from-purple-500 to-indigo-600',
        'from-blue-500 to-teal-600',
        'from-pink-500 to-rose-600',
        'from-orange-500 to-amber-600',
        'from-emerald-500 to-teal-600',
    ];
    let sum = 0;
    for (let i = 0; i < userName.length; i++) {
        sum += userName.charCodeAt(i);
    }
    const colorClass = colors[sum % colors.length];

    // Elemento visual del avatar (con foto o con inicial)
    let avatarEl = '';
    if (avatarSrc) {
        avatarEl = `<img src="${avatarSrc}" alt="${userName}" class="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800/80 group-hover:ring-fp-primary-light dark:group-hover:ring-fp-primary-dark transition-all duration-300">`;
    } else {
        avatarEl = `<div class="w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-100 dark:ring-slate-800/80 group-hover:ring-fp-primary-light dark:group-hover:ring-fp-primary-dark transition-all duration-300">${initial}</div>`;
    }

    // Generamos los botones de acción dependiendo del estado de autenticación
    let actionButtons = '';
    let mobileMenuButton = '';
    
    if (isAuthenticated) {
        // Bloque de acciones en Desktop cuando está logueado
        actionButtons = `
            <div class="relative">
                <button id="user-menu-button" onclick="toggleUserDropdown()" aria-expanded="false" aria-haspopup="true" class="flex items-center space-x-3 p-1.5 pr-3 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-300 focus:outline-none cursor-pointer group">
                    ${avatarEl}
                    <div class="hidden lg:flex flex-col text-left text-xs">
                        <span class="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[120px] transition-colors duration-300 group-hover:text-slate-900 dark:group-hover:text-white">${userName}</span>
                        <span class="text-[10px] font-bold text-fp-primary-light dark:text-fp-primary-dark uppercase tracking-wider transition-colors duration-300 group-hover:text-fp-accent-light dark:group-hover:text-fp-accent-dark">${userRoleLabel}</span>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                <!-- Dropdown Menu Desktop -->
                <div id="user-dropdown-menu" aria-hidden="true" class="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-fp-surface-dark border border-slate-100 dark:border-fp-border-dark shadow-xl py-2 z-50 opacity-0 scale-95 pointer-events-none transition-all duration-200 origin-top-right">
                    <!-- Información de usuario para pantallas donde el nombre está oculto en el botón -->
                    <div class="lg:hidden px-4 py-2 border-b border-slate-100 dark:border-fp-border-dark mb-1">
                        <p class="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">${userName}</p>
                        <p class="text-xs text-slate-400 dark:text-zinc-500">${userRoleLabel}</p>
                    </div>
                    
                    <button onclick="goToDashboard()" class="group w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-all duration-300 flex items-center space-x-2 cursor-pointer">
                        <svg class="w-4 h-4 text-slate-400 group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors duration-300 animate-bounce-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span class="transition-transform duration-300 group-hover:translate-x-1">Mi Panel</span>
                    </button>
                    
                    ${isAdmin ? `
                    <a href="/src/pages/admin/admin.html" class="group w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-all duration-300 flex items-center space-x-2">
                        <svg class="w-4 h-4 text-slate-400 group-hover:text-fp-primary-light dark:group-hover:text-fp-primary-dark transition-colors duration-300 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span class="transition-transform duration-300 group-hover:translate-x-1">Panel Admin</span>
                    </a>
                    ` : ''}
                    
                    <div class="border-t border-slate-100 dark:border-fp-border-dark my-1"></div>
                    
                    <button onclick="logoutUser()" class="group w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 flex items-center space-x-2 cursor-pointer">
                        <svg class="w-4 h-4 text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 animate-exit-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span class="transition-transform duration-300 group-hover:translate-x-1">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        `;

        // En móvil: el avatar del usuario logueado abre el drawer lateral
        mobileMenuButton = `
            <button id="mobile-menu-toggle-avatar" onclick="toggleMobileMenu()" class="focus:outline-none cursor-pointer group">
                ${avatarEl}
            </button>
        `;
    } else {
        // Bloque de acciones en Desktop cuando es Anónimo
        actionButtons = `
            <a href="/src/pages/auth/login.html" class="text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark font-medium transition-colors">Iniciar Sesión</a>
            <a href="/src/pages/auth/registro.html" class="group flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 text-white px-5 py-2 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-fp-primary-light/20 dark:hover:shadow-fp-primary-dark/20 hover:scale-[1.02] active:scale-95 cursor-pointer shimmer-btn">
                <svg class="w-4 h-4 mr-1.5 text-white/90 transition-transform duration-700 ease-out group-hover:rotate-[360deg]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Regístrate</span>
            </a>
        `;

        // En móvil: hamburguesa clásica
        mobileMenuButton = `
            <button id="mobile-menu-toggle" onclick="toggleMobileMenu()" class="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer" title="Menú">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
        `;
    }

    return `
        <!-- Header Principal Glassmorphism -->
        <div class="spotlight-card overflow-visible sticky top-0 z-50 bg-white/85 dark:bg-fp-surface-dark/85 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-fp-border-dark transition-colors duration-300 w-full">
            <div class="container mx-auto px-6 h-[76px] relative z-20 flex items-center justify-between">
                <!-- Logo con punto degradado premium -->
                <a href="/" class="text-2xl font-display font-bold text-slate-800 dark:text-white hover:opacity-90 transition-opacity">
                    FestiPro<span class="text-transparent bg-clip-text bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark font-extrabold">.</span>
                </a>

                <!-- Navegación Principal (Desktop) - Centrado geométrico perfecto -->
                <nav class="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 space-x-8 items-center z-10">
                    <a href="/src/pages/publico/catalogo/catalogo.html" class="relative py-2 text-sm transition-colors duration-300 group ${isArtistasActive ? 'text-fp-primary-light dark:text-fp-primary-dark font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium'}">
                        Artistas
                        <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark transform origin-left transition-transform duration-300 ${isArtistasActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}"></span>
                    </a>
                    <a href="/src/pages/publico/eventos/eventos.html" class="relative py-2 text-sm transition-colors duration-300 group ${isEventosActive ? 'text-fp-primary-light dark:text-fp-primary-dark font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium'}">
                        Eventos
                        <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark transform origin-left transition-transform duration-300 ${isEventosActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}"></span>
                    </a>
                </nav>

                <!-- Acciones y Cambio de Tema -->
                <div class="flex items-center space-x-4">
                    <!-- Botón para alternar Modo Oscuro/Claro -->
                    <button onclick="toggleTheme()" class="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group" title="Alternar tema">
                        <!-- Icono SVG de Luna (Visible en modo claro) con inclinación y cambio de color -->
                        <svg class="w-5 h-5 dark:hidden transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110 group-hover:text-fp-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <!-- Icono SVG de Sol (Visible en modo oscuro) con giro suave de 90 grados y cambio de color -->
                        <svg class="w-5 h-5 hidden dark:block transition-transform duration-500 ease-out group-hover:rotate-90 group-hover:scale-110 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </button>
                    
                    <!-- Contenedor Acciones Desktop -->
                    <div class="hidden md:flex items-center space-x-4">
                        ${actionButtons}
                    </div>

                    <!-- Contenedor Acciones Móvil -->
                    <div class="flex md:hidden items-center">
                        ${mobileMenuButton}
                    </div>
                </div>
            </div>
        </div>

        <!-- Backdrop Overlay para Menú Móvil -->
        <div id="mobile-drawer-overlay" aria-hidden="true" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300"></div>

        <!-- Drawer Lateral Móvil -->
        <div id="mobile-drawer" aria-hidden="true" class="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-fp-surface-dark shadow-2xl border-l border-slate-100 dark:border-fp-border-dark z-50 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
            <!-- Header del Drawer -->
            <div class="h-[76px] px-6 border-b border-slate-100 dark:border-fp-border-dark flex items-center justify-between">
                <span class="text-xl font-bold text-slate-800 dark:text-white font-display">
                    FestiPro<span class="text-transparent bg-clip-text bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark font-extrabold">.</span>
                </span>
                <button onclick="toggleMobileMenu()" class="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Navegación / Contenido del Drawer -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <!-- Información resumida del usuario logueado -->
                ${isAuthenticated ? `
                <div class="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-fp-surface-dark/40 rounded-2xl mb-2">
                    ${avatarEl}
                    <div class="flex flex-col text-left">
                        <span class="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">${userName}</span>
                        <span class="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">${userRoleLabel}</span>
                    </div>
                </div>
                ` : ''}

                <div class="space-y-4">
                    <p class="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Explorar</p>
                    <a href="/src/pages/publico/catalogo/catalogo.html" class="flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span>Artistas</span>
                    </a>
                    <a href="/src/pages/publico/eventos/eventos.html" class="flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>Eventos</span>
                    </a>
                </div>

                <div class="border-t border-slate-100 dark:border-fp-border-dark my-4"></div>

                <div class="space-y-4">
                    <p class="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Mi Cuenta</p>
                    ${isAuthenticated ? `
                        <button onclick="toggleMobileMenu(); goToDashboard();" class="w-full flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium text-left cursor-pointer">
                            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span>Mi Panel</span>
                        </button>
                        ${isAdmin ? `
                            <a href="/src/pages/admin/admin.html" onclick="toggleMobileMenu();" class="flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium">
                                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span>Panel Admin</span>
                            </a>
                        ` : ''}
                        <button onclick="toggleMobileMenu(); logoutUser();" class="w-full flex items-center space-x-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 font-medium text-left cursor-pointer">
                            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            <span>Cerrar Sesión</span>
                        </button>
                    ` : `
                        <a href="/src/pages/auth/login.html" onclick="toggleMobileMenu();" class="flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium">
                            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            <span>Iniciar Sesión</span>
                        </a>
                        <a href="/src/pages/auth/registro.html" onclick="toggleMobileMenu();" class="flex items-center space-x-3 py-2 text-slate-600 dark:text-slate-300 hover:text-fp-primary-light dark:hover:text-fp-primary-dark transition-colors font-medium">
                            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                            <span>Registrarse</span>
                        </a>
                    `}
                </div>
            </div>
        </div>
    `;
}