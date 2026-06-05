import { apiClient } from '../../../assets/js/api-client.js';
import { showToast } from '../../../assets/js/utils.js';

/**
 * Función auxiliar para mostrar errores de validación visuales.
 */
function showErrors(errors) {
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
    document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500', 'dark:border-red-500');
    });

    for (const [field, messages] of Object.entries(errors)) {
        const input = document.getElementById(`reg-${field}`) || 
                      document.getElementById(`login-${field}`) || 
                      document.getElementsByName(field)[0];
        
        if (input) {
            input.classList.add('border-red-500', 'dark:border-red-500');
            const errorP = document.createElement('p');
            errorP.className = 'error-msg text-red-500 text-xs mt-1 font-medium';
            errorP.textContent = messages[0];
            input.parentElement.appendChild(errorP);
        } else {
            showToast(messages[0], 'error');
        }
    }
}

/**
 * Desactiva el botón de envío para evitar peticiones duplicadas
 */
function toggleLoading(button, isLoading, originalText = '') {
    if (isLoading) {
        button.disabled = true;
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.innerHTML;
        }
        button.innerHTML = '<span class="animate-pulse">Cargando...</span>';
        button.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || originalText;
        button.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

/**
 * Maneja el flujo cuando el backend autoriza la entrada.
 */
function handleAuthSuccess(data) {
    // 1. Guardamos el token en local
    localStorage.setItem('token', data.token);
    
    // 2. Extraemos información del usuario de forma segura (previniendo null pointer en admin)
    const isAdmin = data.user.is_admin;
    const role = data.user.role ? data.user.role.toLowerCase() : null;
    
    // Guardamos datos básicos en localStorage para uso del frontend
    localStorage.setItem('user_role', role || (isAdmin ? 'admin' : 'anonimo'));
    localStorage.setItem('is_admin', isAdmin);
    localStorage.setItem('user_name', data.user.name || '');
    localStorage.setItem('user_avatar', data.user.avatar_url || '');

    let roleLabel = 'Usuario';
    if (isAdmin) {
        roleLabel = 'Admin';
    } else if (role === 'anfitrión' || role === 'anfitrion') {
        roleLabel = 'Anfitrión';
    } else if (role === 'talento') {
        roleLabel = 'Artista';
    }
    localStorage.setItem('user_role_label', roleLabel);
    
    // 3. REDIRECCIÓN FUERTE (Atrapa-Usuarios)
    // Revisamos si el usuario fue bloqueado por intentar hacer una acción protegida antes de loguearse
    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    
    if (redirectUrl) {
        // Limpiamos la memoria
        sessionStorage.removeItem('redirect_after_login');
        // Lo devolvemos exactamente a la pantalla original
        window.location.href = redirectUrl;
        return; // Terminamos aquí
    }

    // 4. Redirección normal (Si llegó al login directamente)
    if (isAdmin) {
        window.location.href = '/src/pages/admin/admin.html';
    } else if (role === 'anfitrión' || role === 'anfitrion') {
        window.location.href = '/src/pages/anfitrion/dashboard.html';
    } else if (role === 'talento') {
        window.location.href = '/src/pages/talento/dashboard/dashboard.html';
    } else {
        // Fallback por defecto si no tiene un rol válido (ej. errores de DB)
        window.location.href = '/';
    }
}

// ============================================================================
// LÓGICA DE INICIO DE SESIÓN
// ============================================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pass').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        toggleLoading(submitBtn, true);

        try {
            const response = await apiClient.post('/login', { email, password });
            handleAuthSuccess(response.data);
        } catch (error) {
            if (error.status === 422 && error.data && error.data.errors) {
                showErrors(error.data.errors);
            } else if (error.status === 403) {
                showToast(error.data.message || 'Tu cuenta ha sido suspendida.', 'error');
            } else {
                showToast('Error de conexión o credenciales incorrectas.', 'error');
            }
        } finally {
            toggleLoading(submitBtn, false, 'Iniciar Sesión');
        }
    });
}

// ============================================================================
// LÓGICA DE REGISTRO DE CUENTA
// ============================================================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-pass').value;
        const roleRadio = document.querySelector('input[name="role"]:checked');
        const role = roleRadio ? roleRadio.value : null;
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        toggleLoading(submitBtn, true);

        try {
            const response = await apiClient.post('/register', { name, email, password, role });
            handleAuthSuccess(response.data);
        } catch (error) {
            if (error.status === 422 && error.data && error.data.errors) {
                showErrors(error.data.errors);
            } else {
                showToast('Ocurrió un error inesperado al intentar crear la cuenta.', 'error');
            }
        } finally {
            toggleLoading(submitBtn, false, 'Crear cuenta gratis');
        }
    });
}

// ============================================================================
// INTERACCIONES PREMIUM DE INTERFAZ (SPOTLIGHT Y VISIBILIDAD DE CONTRASEÑA)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Efecto Spotlight/Linterna que sigue el cursor del mouse
    const spotlights = document.querySelectorAll('.spotlight-panel');
    
    spotlights.forEach(panel => {
        // Al mover el mouse, actualizamos las coordenadas CSS relativas al panel
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            panel.style.setProperty('--mouse-x', `${x}px`);
            panel.style.setProperty('--mouse-y', `${y}px`);
        });
        
        // Al entrar el cursor, aumentamos la opacidad del spotlight
        panel.addEventListener('mouseenter', () => {
            panel.style.setProperty('--mouse-opacity', '1');
        });
        
        // Al salir, la desvanecemos suavemente
        panel.addEventListener('mouseleave', () => {
            panel.style.setProperty('--mouse-opacity', '0');
        });
    });

    // 2. Alternar Visibilidad de Contraseñas (Ver/Ocultar con iconos Phosphor)
    const togglePasswordButtons = document.querySelectorAll('.toggle-password-btn');
    
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Buscamos el input de contraseña en el mismo contenedor
            const container = btn.closest('.relative');
            if (!container) return;
            
            const input = container.querySelector('input');
            const icon = btn.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('ph-eye');
                    icon.classList.add('ph-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('ph-eye-slash');
                    icon.classList.add('ph-eye');
                }
            }
        });
    });
});

