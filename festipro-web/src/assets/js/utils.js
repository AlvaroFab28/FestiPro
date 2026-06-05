import { getHeaderHTML } from '../../components/header.js';
import { getFooterHTML } from '../../components/footer.js';

/**
 * Alterna el tema visual (Claro/Oscuro) y guarda la preferencia
 * del usuario en el localStorage del navegador.
 */
export function toggleTheme() {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        htmlEl.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}
window.toggleTheme = toggleTheme;

/**
 * Inyecta dinámicamente el Header y el Footer en la página actual.
 */
export function injectShell() {
    const headerContainer = document.getElementById('app-header');
    const footerContainer = document.getElementById('app-footer');

    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
    }

    if (footerContainer) {
        footerContainer.innerHTML = getFooterHTML();
    }

    setupSpotlights();
}

/**
 * Cierra sesión interactuando con el backend y limpiando localStorage
 */
export async function logoutUser() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
            await fetch(`${API_URL}/logout`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error cerrando sesión en servidor', error);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('is_admin');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_avatar');
        localStorage.removeItem('user_role_label');
    }
    window.location.href = '/'; // Redirigir siempre a la Landing Page
}
window.logoutUser = logoutUser;

export function goToDashboard() {
    const role = localStorage.getItem('user_role');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    
    if (role === 'talent' || role === 'talento') {
        window.location.href = '/src/pages/talento/dashboard/dashboard.html';
    } else if (role === 'anfitrión' || role === 'anfitrion') {
        window.location.href = '/src/pages/anfitrion/dashboard.html';
    } else if (isAdmin) {
        window.location.href = '/src/pages/admin/admin.html';
    } else {
        window.location.href = '/';
    }
}
window.goToDashboard = goToDashboard;

/**
 * Alterna el menú lateral móvil (Drawer) y su respectiva opacidad de overlay
 */
export function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!drawer || !overlay) return;

    const isHidden = drawer.classList.contains('translate-x-full');
    if (isHidden) {
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('overflow-hidden');
    } else {
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('translate-x-full');
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('overflow-hidden');
    }
}
window.toggleMobileMenu = toggleMobileMenu;

/**
 * Alterna el menú dropdown de perfil de usuario en desktop
 */
export function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown-menu');
    const btn = document.getElementById('user-menu-button');
    if (!dropdown) return;

    const isExpanded = btn?.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
        dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        dropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
        btn?.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
    } else {
        dropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        dropdown.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
        btn?.setAttribute('aria-expanded', 'true');
        dropdown.setAttribute('aria-hidden', 'false');
    }
}
window.toggleUserDropdown = toggleUserDropdown;

/**
 * Redirección Fuerte (El Atrapa-Usuarios) - Historia de Usuario 7
 * Intercepta globalmente los clics en elementos que requieran autenticación.
 */
document.addEventListener('click', (e) => {
    // Buscamos si el clic ocurrió en un elemento con la clase .requires-auth o dentro de él
    const target = e.target.closest('.requires-auth');
    
    if (target) {
        const token = localStorage.getItem('token');
        
        // Si el usuario es anónimo (no hay token)
        if (!token) {
            // Prevenimos la acción original
            e.preventDefault();
            
            // Guardamos la URL actual exacta para devolverlo aquí cuando se loguee
            sessionStorage.setItem('redirect_after_login', window.location.href);
            
            // Lo mandamos al "peaje" (Login)
            window.location.href = '/src/pages/auth/login.html';
        }
    }
});

/**
 * Manejador de clics en cualquier parte de la pantalla para cerrar menús desplegables (Click Outsider)
 */
document.addEventListener('click', (e) => {
    // 1. Dropdown del Avatar
    const dropdown = document.getElementById('user-dropdown-menu');
    const btn = document.getElementById('user-menu-button');
    if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        if (btn.getAttribute('aria-expanded') === 'true') {
            dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            dropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            btn.setAttribute('aria-expanded', 'false');
            dropdown.setAttribute('aria-hidden', 'true');
        }
    }

    // 2. Drawer Móvil (clic fuera del drawer o en el overlay)
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const toggleBtnMobile = document.getElementById('mobile-menu-toggle');
    const toggleBtnMobileAvatar = document.getElementById('mobile-menu-toggle-avatar');
    
    // Si el drawer está abierto y el clic no fue dentro del drawer ni en sus botones de alternar
    if (drawer && overlay && !drawer.contains(e.target) && 
        (!toggleBtnMobile || !toggleBtnMobile.contains(e.target)) &&
        (!toggleBtnMobileAvatar || !toggleBtnMobileAvatar.contains(e.target))) {
        if (drawer.classList.contains('translate-x-0')) {
            drawer.classList.remove('translate-x-0');
            drawer.classList.add('translate-x-full');
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
            drawer.setAttribute('aria-hidden', 'true');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('overflow-hidden');
        }
    }
});

// Ejecutar la inyección tan pronto se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar tema oscuro si aplica
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
    injectShell();
});

/**
 * Muestra una notificación (Toast) elegante y premium basada en la plantilla del sistema.
 * @param {string} message - Mensaje a mostrar.
 * @param {'success' | 'info' | 'warning' | 'error'} type - Tipo de notificación.
 */
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full sm:w-auto pointer-events-none px-4 sm:px-0';
        document.body.appendChild(container);
    }

    const config = {
        success: {
            bg: 'bg-green-100 dark:bg-green-950/80',
            border: 'border-green-500 dark:border-green-700',
            text: 'text-green-900 dark:text-green-100',
            hoverBg: 'hover:bg-green-200 dark:hover:bg-green-900/60',
            icon: 'ph-fill ph-check-circle text-green-600 dark:text-green-400'
        },
        info: {
            bg: 'bg-blue-100 dark:bg-blue-950/80',
            border: 'border-blue-500 dark:border-blue-700',
            text: 'text-blue-900 dark:text-blue-100',
            hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-900/60',
            icon: 'ph-fill ph-info text-blue-600 dark:text-blue-400'
        },
        warning: {
            bg: 'bg-yellow-100 dark:bg-yellow-950/80',
            border: 'border-yellow-500 dark:border-yellow-700',
            text: 'text-yellow-900 dark:text-yellow-100',
            hoverBg: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/60',
            icon: 'ph-fill ph-warning text-yellow-600 dark:text-yellow-400'
        },
        error: {
            bg: 'bg-red-100 dark:bg-red-950/80',
            border: 'border-red-500 dark:border-red-700',
            text: 'text-red-900 dark:text-red-100',
            hoverBg: 'hover:bg-red-200 dark:hover:bg-red-900/60',
            icon: 'ph-fill ph-x-circle text-red-600 dark:text-red-400'
        }
    };

    const c = config[type] || config.success;

    const toast = document.createElement('div');
    toast.role = 'alert';
    toast.className = `pointer-events-auto border-l-4 ${c.bg} ${c.border} ${c.text} ${c.hoverBg} p-3 rounded-lg flex items-center justify-between shadow-lg transition duration-300 ease-in-out transform translate-y-4 opacity-0 hover:scale-105 select-none cursor-pointer w-full sm:min-w-[280px]`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${c.icon} text-xl mr-3 flex-shrink-0 animate-bounce-subtle"></i>
            <p class="text-xs font-semibold leading-relaxed">${message}</p>
        </div>
        <button class="ml-4 text-current opacity-50 hover:opacity-100 transition-opacity focus:outline-none flex-shrink-0" aria-label="Cerrar">
            <i class="ph ph-x text-sm"></i>
        </button>
    `;

    // Animación suave de entrada
    container.appendChild(toast);
    
    // Forzar reflujo
    toast.offsetHeight;
    
    // Quitar estados iniciales
    toast.classList.remove('translate-y-4', 'opacity-0');

    const dismiss = () => {
        toast.classList.add('opacity-0', 'translate-y-2', 'scale-95');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    };

    // Cerrar al pulsar el botón
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
    });

    // Cerrar al pulsar el toast mismo
    toast.addEventListener('click', dismiss);

    // Auto-destrucción
    setTimeout(() => {
        if (toast.parentNode) {
            dismiss();
        }
    }, 1600);
}

window.showToast = showToast;

/**
 * Configura el efecto spotlight interactivo para todas las tarjetas con la clase .spotlight-card
 */
export function setupSpotlights() {
    const spotlights = document.querySelectorAll('.spotlight-card');
    
    spotlights.forEach(panel => {
        if (panel.dataset.spotlightInitialized) return;
        panel.dataset.spotlightInitialized = 'true';
        
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            panel.style.setProperty('--mouse-x', `${x}px`);
            panel.style.setProperty('--mouse-y', `${y}px`);
        });
        
        panel.addEventListener('mouseenter', () => {
            panel.style.setProperty('--mouse-opacity', '1');
        });
        
        panel.addEventListener('mouseleave', () => {
            panel.style.setProperty('--mouse-opacity', '0');
        });
    });
}
window.setupSpotlights = setupSpotlights;