import { injectShell, showToast } from '../../../assets/js/utils.js';
import { apiClient } from '../../../assets/js/api-client.js';

let currentGallery = [];
let fotosParaEliminar = [];
let archivosNuevosGaleria = [];
let originalData = null;

document.addEventListener('DOMContentLoaded', async () => {
    injectShell();

    // Configurar botón de cancelar
    const cancelBtn = document.getElementById('btn-cancel-changes');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            fotosParaEliminar = [];
            archivosNuevosGaleria = [];
            document.querySelectorAll('.img-preview').forEach(img => img.remove());
            document.querySelectorAll('div.flex.flex-col').forEach(div => div.classList.remove('opacity-0'));
            
            if (originalData) fillFormWithData(originalData);
            showToast('Cambios descartados');
            hideTalentoButtons();
        };
    }

    // Exportar función global para cambiar pestañas
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
        const activePanel = document.getElementById(`panel-${tabId}`);
        if (activePanel) activePanel.classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('text-indigo-700', 'bg-indigo-50', 'dark:text-indigo-300', 'dark:bg-indigo-900/30');
            btn.classList.add('text-gray-600', 'hover:bg-gray-50', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
        });

        const activeBtn = document.getElementById(`tab-btn-${tabId}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-50', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
            activeBtn.classList.add('text-indigo-700', 'bg-indigo-50', 'dark:text-indigo-300', 'dark:bg-indigo-900/30');
        }
    };

    // Detección de cambios (Dirty state) para mostrar los botones
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id === 'toggle-disponibilidad') return; // Ignorar el toggle porque tiene autoguardado
        el.addEventListener('input', showCancelBtn);
        el.addEventListener('change', showCancelBtn);
    });

    // Preview simple para Avatar y Banner
    handleAvatarPreview();
    handleBannerPreview();

    // UI Feedback para archivos de galería
    const MAX_FOTOS = 8;
    const inputGaleria = document.getElementById('input-galeria');
    if (inputGaleria) {
        inputGaleria.addEventListener('change', (e) => {
            const fotosActuales = currentGallery.length - fotosParaEliminar.length;
            const nuevasSeleccionadas = Array.from(e.target.files);
            
            if (fotosActuales + archivosNuevosGaleria.length + nuevasSeleccionadas.length > MAX_FOTOS) {
                showToast(`Has alcanzado el límite máximo de ${MAX_FOTOS} fotos en tu portafolio.`, 'error');
                inputGaleria.value = '';
                return;
            }

            nuevasSeleccionadas.forEach(file => {
                file.tempId = Math.random().toString(36).substring(7);
                archivosNuevosGaleria.push(file);
            });
            inputGaleria.value = ''; // Reset para poder seleccionar la misma
            renderGallery();
            showCancelBtn();
        });
    }

    // Cargar datos
    await loadInitialData();

    // Listener global rápido para disponibilidad (Historia de Usuario 10)
    const toggleDispo = document.getElementById('toggle-disponibilidad');
    if (toggleDispo) {
        toggleDispo.addEventListener('change', async (e) => {
            try {
                await apiClient.patch('/talento/disponibilidad', { esta_disponible: e.target.checked });
                showToast('Disponibilidad actualizada');
            } catch (err) {
                e.target.checked = !e.target.checked; // Revert
                showToast('Error cambiando disponibilidad', 'error');
            }
        });
    }
});

/**
 * Carga los catálogos y el perfil actual en paralelo para evitar lag visual (TTFB optimizado)
 */
async function loadInitialData() {
    try {
        // Disparamos todas las peticiones a la API al mismo tiempo
        const [catRes, ciuRes, profileRes] = await Promise.all([
            apiClient.get('/categorias'),
            apiClient.get('/ciudades'),
            apiClient.get('/talento/perfil')
        ]);

        // 1. Rellenar Categorías
        const selectCat = document.getElementById('select-categoria');
        selectCat.innerHTML = '<option value="" disabled selected>Selecciona tu arte</option>';
        catRes.data.forEach(cat => {
            selectCat.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });

        // 2. Rellenar Ciudades
        const selectCiu = document.getElementById('select-ciudad');
        selectCiu.innerHTML = '<option value="" disabled selected>¿Dónde te ubicas?</option>';
        ciuRes.data.forEach(ciu => {
            selectCiu.innerHTML += `<option value="${ciu.id}">${ciu.ciudad} (${ciu.departamento})</option>`;
        });

        // 3. Rellenar datos del Perfil en la UI
        fillFormWithData(profileRes.data);

    } catch (error) {
        showToast('Error cargando los datos iniciales.', 'error');
        console.error(error);
    }
}

function showTalentoButtons() {
    const container = document.getElementById('talento-action-buttons-container');
    if (container) {
        container.classList.remove('opacity-0', 'max-h-0', 'overflow-hidden', 'pointer-events-none', 'translate-y-4', 'scale-95');
        container.classList.add('opacity-100', 'max-h-24', 'translate-y-0', 'scale-100');
    }
}

function hideTalentoButtons() {
    const container = document.getElementById('talento-action-buttons-container');
    if (container) {
        container.classList.add('opacity-0', 'max-h-0', 'overflow-hidden', 'pointer-events-none', 'translate-y-4', 'scale-95');
        container.classList.remove('opacity-100', 'max-h-24', 'translate-y-0', 'scale-100');
    }
}

function showCancelBtn() {
    showTalentoButtons();
}

function handleAvatarPreview() {
    const input = document.getElementById('input-avatar');
    if (!input) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const avatarPreview = document.getElementById('avatar-preview-img');
            const avatarInitial = document.getElementById('avatar-initial');
            
            avatarPreview.src = url;
            avatarPreview.classList.remove('hidden');
            avatarInitial.classList.add('hidden');
            
            showCancelBtn();
        }
    });
}

function handleBannerPreview() {
    const input = document.getElementById('input-banner');
    if (!input) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const bannerPreview = document.getElementById('banner-preview-img');
            const bannerPlaceholder = document.getElementById('banner-placeholder');
            
            bannerPreview.src = url;
            bannerPreview.classList.remove('hidden');
            bannerPlaceholder.classList.add('hidden');
            
            showCancelBtn();
        }
    });
}

/**
 * Llena el formulario con los datos de la DB
 */
function fillFormWithData(data) {
    // Guardar para el botón Cancelar
    originalData = JSON.parse(JSON.stringify(data));

    const user = data.user;
    const profile = data.talent_profile;

    // Llenar tabla users
    document.getElementById('input-nombre-completo').value = user.nombre_completo || user.name || '';
    document.getElementById('input-email').value = user.email || '';
    document.getElementById('input-telefono').value = user.telefono_whatsapp || user.whatsapp_number || '';
    
    // Sidebar Header
    document.getElementById('sb-name').innerText = user.nombre_completo;
    const sbAvatar = document.getElementById('sb-avatar');
    const sbInitial = document.getElementById('sb-initial');
    if (user.avatar_url) {
        sbAvatar.src = `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar_url}`;
        sbAvatar.classList.remove('hidden');
        sbInitial.classList.add('hidden');
    } else {
        sbInitial.innerText = user.nombre_completo.charAt(0).toUpperCase();
        sbInitial.classList.remove('hidden');
        sbAvatar.classList.add('hidden');
    }

    // Avatar Card UI
    const avatarPreview = document.getElementById('avatar-preview-img');
    const avatarInitial = document.getElementById('avatar-initial');
    if (user.avatar_url) {
        avatarPreview.src = `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar_url}`;
        avatarPreview.classList.remove('hidden');
        avatarInitial.classList.add('hidden');
    } else {
        avatarInitial.innerText = user.nombre_completo.charAt(0).toUpperCase();
        avatarInitial.classList.remove('hidden');
        avatarPreview.classList.add('hidden');
    }

    if (profile) {
        // Llenar tabla perfiles_talento
        document.getElementById('input-nombre-artistico').value = profile.nombre_artistico || '';
        document.getElementById('input-precio').value = profile.precio_base || '';
        document.getElementById('input-biografia').value = profile.biografia || '';
        document.getElementById('input-youtube').value = profile.youtube_link || '';
        document.getElementById('select-categoria').value = profile.categoria_id || '';
        document.getElementById('select-ciudad').value = profile.ciudad_id || '';
        
        const bannerPreview = document.getElementById('banner-preview-img');
        const bannerPlaceholder = document.getElementById('banner-placeholder');
        if (profile.banner_url) {
            bannerPreview.src = `${import.meta.env.VITE_API_URL.replace('/api', '')}${profile.banner_url}`;
            bannerPreview.classList.remove('hidden');
            bannerPlaceholder.classList.add('hidden');
        } else {
            bannerPreview.classList.add('hidden');
            bannerPlaceholder.classList.remove('hidden');
        }

        // Disponibilidad y Métricas
        const toggleDispo = document.getElementById('toggle-disponibilidad');
        toggleDispo.checked = profile.esta_disponible;

        // Rellenar métricas (simuladas o reales del backend si existen)
        document.getElementById('metric-vistas').innerText = profile.vistas || '0';
        document.getElementById('metric-calificacion').innerText = profile.calificacion ? Number(profile.calificacion).toFixed(1) : '0.0';
        document.getElementById('metric-comentarios').innerText = profile.comentarios_count || '0';

        toggleDispo.disabled = false;
        toggleDispo.parentElement.classList.remove('opacity-50', 'cursor-not-allowed');
        toggleDispo.parentElement.title = "";
        
        // Galería
        if (profile.galleries) {
            currentGallery = profile.galleries;
            renderGallery();
        }

        // Habilitar pestaña de portafolio
        document.getElementById('tab-btn-portafolio').classList.remove('opacity-50', 'cursor-not-allowed');
        document.getElementById('tab-btn-portafolio').onclick = () => switchTab('portafolio');
    } else {
        // Vaciar inputs por si se cancelan cambios de un perfil no guardado
        document.getElementById('input-nombre-artistico').value = '';
        document.getElementById('input-precio').value = '';
        document.getElementById('input-biografia').value = '';
        document.getElementById('input-youtube').value = '';
        document.getElementById('select-categoria').value = '';
        document.getElementById('select-ciudad').value = '';

        // Bloquear UI que requiere perfil
        const toggleDispo = document.getElementById('toggle-disponibilidad');
        toggleDispo.disabled = true;
        toggleDispo.parentElement.classList.add('opacity-50', 'cursor-not-allowed');
        toggleDispo.parentElement.title = "Debes crear tu perfil primero";
        
        const portafolioBtn = document.getElementById('tab-btn-portafolio');
        portafolioBtn.classList.add('opacity-50', 'cursor-not-allowed');
        portafolioBtn.onclick = (e) => {
            e.preventDefault();
            showToast('Debes guardar tu Perfil Artístico primero.', 'error');
        };
    }
}

/**
 * Renderiza la galería existente de la DB y los previews de las nuevas
 */
function renderGallery() {
    const grid = document.getElementById('galeria-grid');
    grid.innerHTML = '';
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');

    // 1. Fotos del servidor
    currentGallery.forEach(foto => {
        if (fotosParaEliminar.includes(foto.id)) return;
        createGalleryItem(grid, baseUrl + foto.imagen_url, () => marcarParaEliminar(foto.id), false);
    });

    // 2. Fotos nuevas pendientes de subir (Preview)
    archivosNuevosGaleria.forEach(file => {
        const url = URL.createObjectURL(file);
        createGalleryItem(grid, url, () => quitarFotoNueva(file.tempId), true);
    });
}

function createGalleryItem(grid, url, onRemove, isNew) {
    const div = document.createElement('div');
    div.className = 'relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-fp-surface-muted-dark';
    div.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Portafolio">
        ${isNew ? '<span class="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">Nueva</span>' : ''}
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <button type="button" class="btn-remove bg-red-500 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95">
                <i class="ph ph-trash text-lg"></i>
            </button>
        </div>
    `;
    div.querySelector('.btn-remove').onclick = onRemove;
    grid.appendChild(div);
}

// Exportar global para el onClick
window.marcarParaEliminar = function(id) {
    fotosParaEliminar.push(id);
    renderGallery(); // Repintamos
    showCancelBtn();
    showToast('Foto marcada para eliminar.', 'success');
};

window.quitarFotoNueva = function(tempId) {
    archivosNuevosGaleria = archivosNuevosGaleria.filter(f => f.tempId !== tempId);
    renderGallery();
};

// ==========================================
// LÓGICA DE GUARDADO (UPSERT)
// ==========================================
document.getElementById('btn-save-all').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin text-lg"></i> Guardando...';

    try {
        const formData = new FormData();
        
        // 1. Datos del usuario (Tabla Users)
        formData.append('nombre_completo', document.getElementById('input-nombre-completo').value);
        formData.append('email', document.getElementById('input-email').value);
        formData.append('telefono_whatsapp', document.getElementById('input-telefono').value);
        
        const pwd = document.getElementById('input-password').value;
        if (pwd) formData.append('password', pwd);

        const avatarInput = document.getElementById('input-avatar');
        if (avatarInput.files.length > 0) {
            formData.append('avatar', avatarInput.files[0]);
        }

        // 2. Datos Perfil (Solo si el usuario decide crearlo llenando el nombre)
        const nombreArtistico = document.getElementById('input-nombre-artistico').value;
        if (nombreArtistico.trim() !== '') {
            formData.append('nombre_artistico', nombreArtistico);
            
            const catId = document.getElementById('select-categoria').value;
            if (catId) formData.append('categoria_id', catId);
            
            const cityId = document.getElementById('select-ciudad').value;
            if (cityId) formData.append('ciudad_id', cityId);
            
            formData.append('precio_base', document.getElementById('input-precio').value || 0);
            formData.append('biografia', document.getElementById('input-biografia').value);
            formData.append('youtube_link', document.getElementById('input-youtube').value);
            
            const bannerInput = document.getElementById('input-banner');
            if (bannerInput.files.length > 0) {
                formData.append('banner', bannerInput.files[0]);
            }

            // 3. Galería (Fotos nuevas)
            for (let i = 0; i < archivosNuevosGaleria.length; i++) {
                formData.append(`galeria[${i}]`, archivosNuevosGaleria[i]);
            }
        }

        // 4. Fotos a eliminar
        fotosParaEliminar.forEach((id, index) => {
            formData.append(`fotos_a_eliminar[${index}]`, id);
        });

        // ENVIAR
        const res = await fetch(`${import.meta.env.VITE_API_URL}/talento/perfil`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
                // No configuramos Content-Type a multipart/form-data porque fetch + FormData lo hace automáticamente
            },
            body: formData
        });

        const resData = await res.json();
        
        if (!res.ok) {
            // Manejar validaciones de Laravel 422
            if (res.status === 422) {
                const firstError = Object.values(resData.errors)[0][0];
                throw new Error(firstError);
            }
            throw new Error(resData.message || 'Error guardando el perfil');
        }

        showToast('¡Perfil actualizado con éxito!');
        
        // Ocultar botones
        hideTalentoButtons();
        
        // Limpiamos memoria
        fotosParaEliminar = [];
        archivosNuevosGaleria = []; // Vaciamos los archivos pendientes
        document.getElementById('input-galeria').value = "";
        document.getElementById('galeria-selected-text').classList.add('hidden');
        document.getElementById('input-password').value = ""; // Limpiar password tras éxito
        
        // Recargar con los datos frescos devueltos
        fillFormWithData(resData.data);

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-floppy-disk text-lg"></i> Guardar';
    }
});


