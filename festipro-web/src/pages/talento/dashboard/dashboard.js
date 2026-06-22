import { injectShell, showToast, setupSpotlights } from '../../../assets/js/utils.js';
import { apiClient } from '../../../assets/js/api-client.js';
import { getHeaderHTML } from '../../../components/header.js';

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
            
            // Vaciar inputs de tipo file para evitar que se suban archivos descartados
            const avatarInput = document.getElementById('input-avatar');
            const bannerInput = document.getElementById('input-banner');
            const galeriaInput = document.getElementById('input-galeria');
            if (avatarInput) avatarInput.value = '';
            if (bannerInput) bannerInput.value = '';
            if (galeriaInput) galeriaInput.value = '';
            
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
        el.addEventListener('input', showTalentoButtons);
        el.addEventListener('change', showTalentoButtons);
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

            // Validar peso máximo de 2MB por imagen
            const MAX_SIZE = 2 * 1024 * 1024; // 2MB
            const validFiles = [];
            for (const file of nuevasSeleccionadas) {
                if (file.size > MAX_SIZE) {
                    showToast(`La imagen "${file.name}" supera el límite de 2MB.`, 'error');
                } else {
                    validFiles.push(file);
                }
            }

            if (validFiles.length === 0) {
                inputGaleria.value = '';
                return;
            }

            validFiles.forEach(file => {
                file.tempId = Math.random().toString(36).substring(7);
                archivosNuevosGaleria.push(file);
            });
            inputGaleria.value = ''; // Reset para poder seleccionar la misma
            renderGallery();
            showTalentoButtons();
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
        const catOptions = catRes.data.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
        selectCat.innerHTML = '<option value="" disabled selected>Selecciona tu arte</option>' + catOptions;

        // 2. Rellenar Ciudades
        const selectCiu = document.getElementById('select-ciudad');
        const ciuOptions = ciuRes.data.map(ciu => `<option value="${ciu.id}">${ciu.ciudad} (${ciu.departamento})</option>`).join('');
        selectCiu.innerHTML = '<option value="" disabled selected>¿Dónde te ubicas?</option>' + ciuOptions;

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
            
            showTalentoButtons();
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
            
            showTalentoButtons();
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

    // El mini profile del sidebar fue removido en favor de la verificación por completitud.

    // Llenar tabla users
    document.getElementById('input-nombre-completo').value = user.nombre_completo || user.name || '';
    document.getElementById('input-email').value = user.email || '';
    document.getElementById('input-telefono').value = user.telefono_whatsapp || user.whatsapp_number || '';
    
    // Actualizar localStorage para el header
    const finalUserName = user.nombre_completo || user.name || '';
    localStorage.setItem('user_name', finalUserName);
    if (user.avatar_url) {
        localStorage.setItem('user_avatar', user.avatar_url);
    } else {
        localStorage.removeItem('user_avatar');
    }
    
    // Actualizar el header dinámicamente al instante
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
        setupSpotlights();
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

        // Rellenar métricas reales del backend
        document.getElementById('metric-vistas').innerText = profile.vistas_perfil || '0';
        document.getElementById('metric-calificacion').innerText = profile.calificacion_promedio ? Number(profile.calificacion_promedio).toFixed(1) : '0.0';
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

        // Link del botón Ver Perfil Público
        const btnVerPerfil = document.getElementById('btn-ver-perfil-publico');
        if (btnVerPerfil) {
            btnVerPerfil.href = `/src/pages/publico/perfil/perfil-talento.html?id=${profile.id}`;
            btnVerPerfil.classList.remove('hidden');
        }
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

        // Ocultar botón de perfil público si no hay perfil
        const btnVerPerfil = document.getElementById('btn-ver-perfil-publico');
        if (btnVerPerfil) {
            btnVerPerfil.classList.add('hidden');
        }
    }

    // Actualizar Estadísticas & Insights
    updateStatsTab(data);
}

/**
 * Renderiza la galería existente de la DB y los previews de las nuevas
 */
function renderGallery() {
    const grid = document.getElementById('galeria-grid');
    grid.innerHTML = '';
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    const fragment = document.createDocumentFragment();

    // 1. Fotos del servidor
    currentGallery.forEach(foto => {
        const isMarked = fotosParaEliminar.includes(foto.id);
        const item = createGalleryItem(
            baseUrl + foto.imagen_url, 
            isMarked ? () => desmarcarParaEliminar(foto.id) : () => marcarParaEliminar(foto.id), 
            false,
            isMarked
        );
        fragment.appendChild(item);
    });

    // 2. Fotos nuevas pendientes de subir (Preview)
    archivosNuevosGaleria.forEach(file => {
        const url = URL.createObjectURL(file);
        const item = createGalleryItem(url, () => quitarFotoNueva(file.tempId), true, false);
        fragment.appendChild(item);
    });

    grid.appendChild(fragment);
}

function createGalleryItem(url, onAction, isNew, isMarked) {
    const div = document.createElement('div');
    const borderClass = isMarked ? 'border-2 border-red-500/80 shadow-inner' : '';
    div.className = `relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-fp-surface-muted-dark ${borderClass}`;
    
    div.innerHTML = `
        <img src="${url}" loading="lazy" class="w-full h-full object-cover transition-transform ${isMarked ? 'brightness-[30%] grayscale' : 'group-hover:scale-105'}" alt="Portafolio">
        ${isNew ? '<span class="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md z-10 uppercase tracking-wider">Nueva</span>' : ''}
        ${isMarked ? '<span class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md z-10 uppercase tracking-wider flex items-center gap-1"><i class="ph-fill ph-x-circle"></i> Borrar</span>' : ''}
        
        <div class="absolute inset-0 bg-black/55 ${isMarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center justify-center z-20">
            <button type="button" class="btn-action ${isMarked ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5">
                <i class="${isMarked ? 'ph ph-arrow-counter-clockwise' : 'ph ph-trash'} text-sm"></i>
                <span>${isMarked ? 'Deshacer' : 'Eliminar'}</span>
            </button>
        </div>
    `;
    div.querySelector('.btn-action').onclick = onAction;
    return div;
}

// Exportar global para el onClick
window.marcarParaEliminar = function(id) {
    fotosParaEliminar.push(id);
    renderGallery(); // Repintamos
    showTalentoButtons();
    showToast('Foto marcada para eliminar.', 'success');
};

window.desmarcarParaEliminar = function(id) {
    fotosParaEliminar = fotosParaEliminar.filter(x => x !== id);
    renderGallery();
    showToast('Foto recuperada temporalmente.', 'info');
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
    const originalBtnHTML = btn.innerHTML;
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
            const telefonoVal = document.getElementById('input-telefono').value;
            if (!telefonoVal || telefonoVal.trim() === '') {
                throw new Error('El teléfono WhatsApp es obligatorio para crear o actualizar un perfil de talento.');
            }
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
        document.getElementById('input-password').value = ""; // Limpiar password tras éxito
        
        // Recargar con los datos frescos devueltos
        fillFormWithData(resData.data);

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnHTML;
    }
});

/**
 * Calcula y actualiza la pestaña de Estadísticas & Insights
 */
function updateStatsTab(data) {
    const user = data.user;
    const profile = data.talent_profile;

    // 1. Calcular completitud del perfil
    let completeness = 0;
    const checklistItems = {
        avatar: !!user.avatar_url,
        nombre: !!profile?.nombre_artistico,
        precio: !!profile?.precio_base,
        categoria: !!profile?.categoria_id,
        ciudad: !!profile?.ciudad_id,
        biografia: !!profile?.biografia,
        banner: !!profile?.banner_url,
        galeria: !!(profile?.galleries && profile.galleries.length > 0)
    };

    if (checklistItems.avatar) completeness += 15;
    if (checklistItems.nombre) completeness += 15;
    if (checklistItems.precio) completeness += 10;
    if (checklistItems.categoria) completeness += 10;
    if (checklistItems.ciudad) completeness += 10;
    if (checklistItems.biografia) completeness += 15;
    if (checklistItems.banner) completeness += 15;
    if (checklistItems.galeria) completeness += 10;

    // Actualizar porcentaje e interfaz
    const bar = document.getElementById('completeness-bar-fill');
    const text = document.getElementById('completeness-text');
    if (bar) bar.style.width = `${completeness}%`;
    if (text) text.innerText = `${completeness}%`;

    // Sello de verificación condicional
    const verificationContainer = document.getElementById('sidebar-verification-container');
    if (verificationContainer) {
        if (completeness === 100) {
            verificationContainer.classList.remove('hidden');
        } else {
            verificationContainer.classList.add('hidden');
        }
    }

    // Actualizar checklist
    updateChecklistItem('chk-avatar', checklistItems.avatar);
    updateChecklistItem('chk-nombre', checklistItems.nombre);
    updateChecklistItem('chk-precio', checklistItems.precio);
    updateChecklistItem('chk-categoria', checklistItems.categoria);
    updateChecklistItem('chk-ciudad', checklistItems.ciudad);
    updateChecklistItem('chk-biografia', checklistItems.biografia);
    updateChecklistItem('chk-banner', checklistItems.banner);
    updateChecklistItem('chk-galeria', checklistItems.galeria);

    // Actualizar métricas reales del backend
    const vistas = profile?.vistas_perfil || 0;
    const rating = profile?.calificacion_promedio ? Number(profile.calificacion_promedio) : 0;
    const reviews = profile?.comentarios_count || 0;

    const statsVistas = document.getElementById('stats-vistas');
    const statsCalificacion = document.getElementById('stats-calificacion');
    const statsComentarios = document.getElementById('stats-comentarios');
    
    if (statsVistas) statsVistas.innerText = vistas;
    if (statsCalificacion) statsCalificacion.innerText = rating.toFixed(1);
    if (statsComentarios) statsComentarios.innerText = reviews;

    // Renderizar estrellas de reputación
    const starsContainer = document.getElementById('stats-stars');
    if (starsContainer) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalf = (rating - fullStars) >= 0.4;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="ph-fill ph-star text-amber-400"></i>';
            } else if (i === fullStars + 1 && hasHalf) {
                starsHTML += '<i class="ph-fill ph-star-half text-amber-400"></i>';
            } else {
                starsHTML += '<i class="ph ph-star text-slate-300 dark:text-slate-600"></i>';
            }
        }
        starsContainer.innerHTML = starsHTML;
    }

    // Consejo de optimización dinámico
    const tipTitle = document.getElementById('tip-title');
    const tipText = document.getElementById('tip-text');
    const tipIcon = document.getElementById('tip-icon');

    if (tipTitle && tipText) {
        if (!checklistItems.banner) {
            if (tipIcon) tipIcon.className = "ph ph-image text-3xl text-fp-primary-light dark:text-fp-primary-dark";
            tipTitle.innerText = "Sube una foto de portada (Banner)";
            tipText.innerText = "Los perfiles de talento con una portada atractiva reciben hasta un 150% más de visitas y proyectan mayor profesionalismo.";
        } else if (!checklistItems.galeria) {
            if (tipIcon) tipIcon.className = "ph ph-images text-3xl text-fp-primary-light dark:text-fp-primary-dark";
            tipTitle.innerText = "Añade fotos a tu portafolio";
            tipText.innerText = "Un portafolio multimedia con fotos de tus presentaciones reales convence más rápido a los anfitriones de contratarte.";
        } else if (!checklistItems.biografia || (profile?.biografia && profile.biografia.length < 50)) {
            if (tipIcon) tipIcon.className = "ph ph-article text-3xl text-fp-primary-light dark:text-fp-primary-dark";
            tipTitle.innerText = "Amplía tu biografía";
            tipText.innerText = "Describe detalladamente tus shows, repertorio y requerimientos técnicos. Esto ayuda a los anfitriones a conocerte mejor.";
        } else if (completeness < 100) {
            if (tipIcon) tipIcon.className = "ph ph-sparkle text-3xl text-fp-primary-light dark:text-fp-primary-dark";
            tipTitle.innerText = "Completa tu perfil al 100%";
            tipText.innerText = "Falta muy poco. Los perfiles completados tienen prioridad de visibilidad en el catálogo inteligente de FestiPro.";
        } else {
            if (tipIcon) tipIcon.className = "ph ph-rocket-launch text-3xl text-emerald-500";
            tipTitle.innerText = "¡Tu perfil es una obra de arte!";
            tipText.innerText = "Tienes toda la información configurada. Ahora mantén activa tu disponibilidad para recibir ofertas de contratación directas.";
        }
    }
}

function updateChecklistItem(id, completed) {
    const item = document.getElementById(id);
    if (!item) return;
    const icon = item.querySelector('i');
    const text = item.querySelector('span');
    if (completed) {
        if (icon) icon.className = "ph-fill ph-check-circle text-purple-600 dark:text-purple-400 text-lg shrink-0";
        if (text) text.className = "text-xs text-slate-700 dark:text-slate-300 font-semibold";
    } else {
        if (icon) icon.className = "ph ph-circle text-slate-400 dark:text-slate-600 text-lg shrink-0";
        if (text) text.className = "text-xs text-slate-700 dark:text-slate-300 font-medium";
    }
}


