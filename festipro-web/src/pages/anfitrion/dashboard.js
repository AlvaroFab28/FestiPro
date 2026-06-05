import { apiClient } from '../../assets/js/api-client.js';
import { showToast } from '../../assets/js/utils.js';

let currentEventoIdToDelete = null;
let catalogosCargados = false;
let originalCuentaData = null;

// DOM Elements
const formEvento = document.getElementById('form-evento');
const modalEvento = document.getElementById('modal-evento');
const modalConfirm = document.getElementById('modal-confirm');
const containerEventos = document.getElementById('eventos-container');
const emptyEventos = document.getElementById('eventos-empty');
const loaderEventos = document.getElementById('eventos-loader');

// ==========================================
// TABS & UI LOGIC
// ==========================================
// Cambia entre las pestañas del panel y actualiza los botones de navegación
window.switchTab = function(tabName) {
    const tabs = ['eventos', 'favoritos', 'cuenta'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const btn = document.getElementById(`btn-tab-${tab}`);
        
        if (tab === tabName) {
            section.classList.remove('hidden');
            section.classList.add('block');
            btn.classList.add('bg-fp-primary-light/10', 'text-fp-primary-light');
            btn.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
            section.classList.remove('block');
            section.classList.add('hidden');
            btn.classList.remove('bg-fp-primary-light/10', 'text-fp-primary-light');
            btn.classList.add('text-slate-600', 'dark:text-slate-400');
        }
    });
};

// ==========================================
// MODALS LOGIC
// ==========================================
// Abre el modal para crear (vacío) o editar (cargando datos) un evento
window.openEventoModal = async function(eventoId = null) {
    // Reset form
    formEvento.reset();
    document.getElementById('evento-id').value = '';
    document.getElementById('status-container').classList.add('hidden');
    document.getElementById('modal-evento-title').innerText = 'Publicar Evento';
    
    // Load Catalogs if not loaded
    if (!catalogosCargados) {
        await cargarCatalogos();
    }
    
    // If Editing, fetch data
    if (eventoId) {
        document.getElementById('modal-evento-title').innerText = 'Editar Evento';
        document.getElementById('status-container').classList.remove('hidden');
        cargarDatosEventoParaEdicion(eventoId);
    }
    
    modalEvento.classList.remove('hidden');
};

// Cierra el modal de creación/edición de eventos
window.closeEventoModal = function() {
    modalEvento.classList.add('hidden');
};

// Abre el modal de confirmación para eliminar un evento
window.openConfirmModal = function(id) {
    currentEventoIdToDelete = id;
    modalConfirm.classList.remove('hidden');
};

// Cierra el modal de confirmación de eliminación
window.closeConfirmModal = function() {
    currentEventoIdToDelete = null;
    modalConfirm.classList.add('hidden');
};

// ==========================================
// API LOGIC
// ==========================================



// Obtiene categorías y ciudades desde la API para rellenar los selects del formulario
async function cargarCatalogos() {
    try {
        const [catRes, cityRes] = await Promise.all([
            apiClient.get('/categorias'),
            apiClient.get('/ciudades')
        ]);
        
        const catSelect = document.getElementById('ev-category');
        catRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            catSelect.appendChild(opt);
        });
        
        const citySelect = document.getElementById('ev-city');
        cityRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.ciudad}, ${c.departamento}`;
            citySelect.appendChild(opt);
        });
        
        catalogosCargados = true;
    } catch (error) {
        console.error("Error cargando catálogos:", error);
        showToast('Error cargando categorías o ciudades', 'error');
    }
}

// Carga la lista de eventos creados por el anfitrión y los pinta en tarjetas optimizadas
async function cargarEventos() {
    loaderEventos.classList.remove('hidden');
    containerEventos.classList.add('hidden');
    emptyEventos.classList.add('hidden');
    
    try {
        const response = await apiClient.get('/anfitrion/eventos');
        const eventos = response.data;
        
        window.eventosCargadosData = eventos; // Guardar datos de manera global para edición rápida
        
        if (eventos.length === 0) {
            emptyEventos.classList.remove('hidden');
        } else {
            containerEventos.innerHTML = '';
            eventos.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'group relative w-full flex flex-col h-full rounded-[2rem] bg-white dark:bg-fp-surface-dark p-5 border border-slate-100 dark:border-fp-border-dark shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_-15px_rgba(124,58,237,0.3)] overflow-hidden';
                
                // Color y animación del punto de estado según el estado del evento
                let statusText = ev.status;
                let statusTextColor = 'text-emerald-600 dark:text-emerald-400';
                let dotColor = 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_3px_rgba(16,185,129,0.5)] dark:shadow-[0_0_12px_4px_rgba(52,211,153,0.6)] animate-pulse';

                if (ev.status === 'cerrado') {
                    statusText = 'Cerrado';
                    statusTextColor = 'text-slate-500 dark:text-zinc-400';
                    dotColor = 'bg-slate-500 dark:bg-slate-300 shadow-[0_0_10px_3px_rgba(100,116,139,0.5)] dark:shadow-[0_0_12px_4px_rgba(203,213,225,0.6)] animate-pulse';
                } else if (ev.status === 'cancelado') {
                    statusText = 'Cancelado';
                    statusTextColor = 'text-rose-600 dark:text-rose-400';
                    dotColor = 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_10px_3px_rgba(244,63,94,0.5)] dark:shadow-[0_0_12px_4px_rgba(248,113,113,0.6)] animate-pulse';
                } else {
                    statusText = 'Abierto';
                }

                // Tarjeta de evento tuneada del usuario
                card.innerHTML = `
                    <div class="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-10 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500 pointer-events-none"></div>

                    <div class="flex flex-col h-full justify-between gap-4 relative z-10">
                        <div class="flex justify-between items-start gap-3">
                            <div class="min-w-0 flex-1">
                                <span class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${statusTextColor} mb-1">
                                    <span class="w-2.5 h-2.5 rounded-full ${dotColor}"></span>
                                    ${statusText}
                                </span>
                                <h3 class="text-2xl font-semibold text-slate-950 dark:text-white tracking-tight leading-tight group-hover:text-indigo-500 transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
                                    ${ev.title}
                                </h3>
                                <p class="text-slate-500 dark:text-zinc-400 text-xs font-semibold line-clamp-2 mt-3">
                                    ${ev.description}
                                </p>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="text-3xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                                    Bs. ${parseFloat(ev.estimated_budget).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400">
                            <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-fp-surface-muted-dark border border-slate-100 dark:border-fp-border-dark">
                                <i class="ph ph-calendar text-sm text-indigo-500 dark:text-indigo-400 shrink-0"></i> 
                                ${new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </div>
                            <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-fp-surface-muted-dark border border-slate-100 dark:border-fp-border-dark">
                                <i class="ph ph-map-pin text-sm text-indigo-500 dark:text-indigo-400 shrink-0"></i> 
                                ${ev.city?.name || 'S/D'}
                            </div>
                            <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                <i class="ph ph-tag text-sm shrink-0"></i> 
                                ${ev.category?.name || 'S/D'}
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button onclick="openEventoModal('${ev.id}')" class="flex-1 bg-indigo-600/10 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-[#8c7ae6] text-indigo-600 hover:text-white font-extrabold text-sm py-2.5 rounded-xl transition-all duration-300 active:scale-[0.98] border border-indigo-600/20 hover:border-transparent hover:shadow-[0_8px_20px_-6px_rgba(108,92,231,0.6)]">
                                Editar Evento
                            </button>
                            <button onclick="openConfirmModal('${ev.id}')" class="px-3.5 bg-rose-50 hover:bg-rose-500 dark:bg-fp-surface-dark dark:hover:bg-rose-600 text-rose-500 hover:text-white dark:text-rose-400 rounded-xl transition-colors" aria-label="Eliminar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
                containerEventos.appendChild(card);
            });
            containerEventos.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        showToast('Error cargando los eventos', 'error');
    } finally {
        loaderEventos.classList.add('hidden');
    }
}


// Rellena el formulario del modal con los datos cargados de un evento para su edición
function cargarDatosEventoParaEdicion(id) {
    if (!window.eventosCargadosData) return;
    
    const ev = window.eventosCargadosData.find(e => e.id === id);
    if (ev) {
        document.getElementById('evento-id').value = ev.id;
        document.getElementById('ev-title').value = ev.title;
        document.getElementById('ev-category').value = ev.category_id;
        document.getElementById('ev-city').value = ev.city_id;
        document.getElementById('ev-date').value = ev.event_date;
        document.getElementById('ev-budget').value = ev.estimated_budget;
        document.getElementById('ev-description').value = ev.description;
        document.getElementById('ev-status').value = ev.status;
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Form Submission
// Maneja el envío del formulario para crear o actualizar un evento
formEvento.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-evento');
    const originalText = btn.innerText;
    btn.innerHTML = 'Guardando...';
    btn.disabled = true;
    
    const id = document.getElementById('evento-id').value;
    
    const payload = {
        title: document.getElementById('ev-title').value,
        category_id: document.getElementById('ev-category').value,
        city_id: document.getElementById('ev-city').value,
        event_date: document.getElementById('ev-date').value,
        estimated_budget: document.getElementById('ev-budget').value,
        description: document.getElementById('ev-description').value,
    };
    
    if (id) {
        payload.status = document.getElementById('ev-status').value;
    }

    try {
        if (id) {
            await apiClient.put(`/anfitrion/eventos/${id}`, payload);
            showToast('Evento actualizado correctamente.');
        } else {
            await apiClient.post('/anfitrion/eventos', payload);
            showToast('Evento publicado exitosamente.');
        }
        closeEventoModal();
        cargarEventos();
    } catch (error) {
        console.error(error);
        if (error.status === 422) {
            showToast('Revisa los datos ingresados. Tienen errores.', 'error');
        } else {
            showToast('Ocurrió un error al guardar el evento.', 'error');
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Maneja la acción definitiva de eliminar un evento seleccionado
document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (!currentEventoIdToDelete) return;
    
    const btn = document.getElementById('btn-confirm-delete');
    btn.innerHTML = 'Eliminando...';
    btn.disabled = true;
    
    try {
        await apiClient.delete(`/anfitrion/eventos/${currentEventoIdToDelete}`);
        showToast('Evento eliminado permanentemente.');
        closeConfirmModal();
        cargarEventos();
    } catch (error) {
        console.error(error);
        showToast('Error al eliminar el evento.', 'error');
    } finally {
        btn.innerHTML = 'Eliminar';
        btn.disabled = false;
    }
});

// ==========================================
// CUENTA & FAVORITOS LOGIC
// ==========================================

const formCuenta = document.getElementById('form-cuenta');
const btnSubmitCuenta = document.getElementById('btn-submit-cuenta');
const btnCancelarCuenta = document.getElementById('btn-cancelar-cuenta');
const avatarInput = document.getElementById('cuenta-avatar');

// Muestra los botones de Guardar y Cancelar del formulario de cuenta con animación suave
function showCuentaButtons() {
    const container = document.getElementById('cuenta-action-buttons-container');
    if (container) {
        container.classList.remove('opacity-0', 'max-h-0', 'overflow-hidden', 'pointer-events-none', 'translate-y-4', 'scale-95');
        container.classList.add('opacity-100', 'max-h-24', 'translate-y-0', 'scale-100');
    }
}

// Oculta los botones de Guardar y Cancelar del formulario de cuenta con animación suave
function hideCuentaButtons() {
    const container = document.getElementById('cuenta-action-buttons-container');
    if (container) {
        container.classList.add('opacity-0', 'max-h-0', 'overflow-hidden', 'pointer-events-none', 'translate-y-4', 'scale-95');
        container.classList.remove('opacity-100', 'max-h-24', 'translate-y-0', 'scale-100');
    }
}

// Mostrar preview de avatar y habilitar botón de guardar
avatarInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('cuenta-avatar-preview').src = e.target.result;
            document.getElementById('cuenta-avatar-preview').classList.remove('hidden');
            document.getElementById('cuenta-avatar-placeholder').classList.add('hidden');
        }
        reader.readAsDataURL(this.files[0]);
        showCuentaButtons();
    }
});

// Mostrar botón de guardar si se editan inputs
const cuentaInputs = formCuenta.querySelectorAll('input');
cuentaInputs.forEach(input => {
    input.addEventListener('input', showCuentaButtons);
    input.addEventListener('change', showCuentaButtons);
});

// Rellena la barra lateral y los inputs del formulario con los datos de cuenta y los cachea
function fillCuentaFormWithData(user) {
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    
    // Guardar en caché local para evitar FOUC
    localStorage.setItem('cached_host_name', user.name || '');
    
    // Llenar Sidebar
    document.getElementById('sidebar-name').innerText = user.name;
    if (user.avatar_url) {
        const avatarFullUrl = `${baseUrl}${user.avatar_url}`;
        localStorage.setItem('cached_host_avatar_full', avatarFullUrl);
        document.getElementById('sidebar-avatar').src = avatarFullUrl;
        document.getElementById('sidebar-avatar').classList.remove('hidden');
        document.getElementById('sidebar-avatar-placeholder').classList.add('hidden');
        
        // Llenar form avatar
        document.getElementById('cuenta-avatar-preview').src = avatarFullUrl;
        document.getElementById('cuenta-avatar-preview').classList.remove('hidden');
        document.getElementById('cuenta-avatar-placeholder').classList.add('hidden');
    } else {
        localStorage.removeItem('cached_host_avatar_full');
        const initial = user.name.charAt(0).toUpperCase();
        
        document.getElementById('sidebar-avatar-placeholder').innerText = initial;
        document.getElementById('sidebar-avatar').classList.add('hidden');
        document.getElementById('sidebar-avatar-placeholder').classList.remove('hidden');
        
        document.getElementById('cuenta-avatar-placeholder').innerText = initial;
        document.getElementById('cuenta-avatar-preview').classList.add('hidden');
        document.getElementById('cuenta-avatar-placeholder').classList.remove('hidden');
    }
    
    // Llenar form text inputs
    document.getElementById('cuenta-name').value = user.name || '';
    document.getElementById('cuenta-email').value = user.email || '';
    document.getElementById('cuenta-whatsapp').value = user.whatsapp_number || '';
    document.getElementById('cuenta-password').value = ''; // Limpiar pass
    avatarInput.value = ''; // Reset file input
}

// Hace la consulta a la API para obtener el perfil del usuario autenticado actual
async function cargarDatosCuenta() {
    try {
        const response = await apiClient.get('/me');
        const user = response.data;
        originalCuentaData = JSON.parse(JSON.stringify(user));
        fillCuentaFormWithData(user);
    } catch (error) {
        console.error('Error cargando datos de cuenta:', error);
    }
}

// Botón cancelar: descarta los cambios temporales realizados en la cuenta
btnCancelarCuenta.addEventListener('click', () => {
    if (originalCuentaData) {
        fillCuentaFormWithData(originalCuentaData);
    }
    hideCuentaButtons();
    showToast('Cambios descartados');
});

// Maneja la actualización de datos y avatar de la cuenta con validación visual
formCuenta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalContent = btnSubmitCuenta.innerHTML;
    btnSubmitCuenta.innerHTML = '<i class="ph ph-circle-notch animate-spin text-xl"></i> Guardando...';
    btnSubmitCuenta.disabled = true;
    
    const formData = new FormData();
    formData.append('name', document.getElementById('cuenta-name').value);
    formData.append('email', document.getElementById('cuenta-email').value);
    formData.append('whatsapp_number', document.getElementById('cuenta-whatsapp').value);
    
    const pwd = document.getElementById('cuenta-password').value;
    if (pwd) formData.append('password', pwd);
    
    if (avatarInput.files[0]) {
        formData.append('avatar', avatarInput.files[0]);
    }

    try {
        const response = await apiClient.post('/anfitrion/cuenta', formData);
        showToast('Cuenta actualizada exitosamente.');
        hideCuentaButtons();
        
        const updatedUser = response.data;
        originalCuentaData = JSON.parse(JSON.stringify(updatedUser));
        fillCuentaFormWithData(updatedUser);
    } catch (error) {
        console.error(error);
        if (error.status === 422) {
            showToast('Verifica los datos ingresados.', 'error');
        } else {
            showToast('Ocurrió un error al actualizar tu cuenta.', 'error');
        }
    } finally {
        btnSubmitCuenta.innerHTML = originalContent;
        btnSubmitCuenta.disabled = false;
    }
});

// FAVORITOS
const containerFavoritos = document.getElementById('favoritos-container');

// Carga los talentos que el anfitrión marcó como favoritos y los renderiza en un listado
async function cargarFavoritos() {
    try {
        const response = await apiClient.get('/anfitrion/favoritos');
        const favoritos = response.data;
        
        containerFavoritos.innerHTML = '';
        
        if (favoritos.length === 0) {
            containerFavoritos.innerHTML = `
                <div class="col-span-full bg-slate-50 dark:bg-fp-surface-muted-dark rounded-2xl p-12 text-center text-slate-500">
                    <i class="ph ph-heart-break text-4xl mx-auto mb-4 text-red-500 block"></i>
                    Aún no tienes talentos favoritos guardados.
                </div>
            `;
            return;
        }
        
        favoritos.forEach(fav => {
            const profile = fav.talent_profile;
            if(!profile) return;
            const user = profile.user;
            const category = profile.category;
            
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-fp-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-fp-border-dark overflow-hidden relative group animate-fade-in flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300';
            
            const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
            const coverImg = profile.banner_url ? `${baseUrl}${profile.banner_url}` : 'https://placehold.co/600x400/1e293b/ffffff?text=Sin+Portada';
            const avatarImg = user.avatar_url ? `${baseUrl}${user.avatar_url}` : null;
            const display_name = profile.artistic_name || user.name;
            
            card.innerHTML = `
                <button onclick="removerFavorito('${profile.id}', this)" class="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-fp-surface-dark/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/50 transition-colors shadow-sm cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 duration-200" title="Eliminar de favoritos">
                    <i class="ph ph-trash text-lg"></i>
                </button>
                <div class="h-32 w-full overflow-hidden relative z-0">
                    <img src="${coverImg}" alt="Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="px-6 pt-0 pb-6 flex-1 flex flex-col relative z-10 bg-white dark:bg-fp-surface-dark">
                    <div class="flex justify-center -mt-10 mb-3">
                        <div class="w-20 h-20 rounded-full border-4 border-white dark:border-fp-surface-dark overflow-hidden bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                            ${avatarImg ? `<img src="${avatarImg}" alt="Avatar" class="w-full h-full object-cover">` : display_name.charAt(0)}
                        </div>
                    </div>
                    <div class="text-center flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">${display_name}</h3>
                            <p class="text-sm text-fp-primary-light font-medium mb-1">${category ? category.name : 'Talento'}</p>
                            <p class="text-xs text-slate-500 line-clamp-2">${profile.bio || 'Sin biografía disponible'}</p>
                        </div>
                        
                        <div class="mt-4 pt-4 border-t border-slate-100 dark:border-fp-border-dark">
                            <a href="/src/pages/publico/perfil/perfil-talento.html?id=${profile.id}" class="inline-block w-full bg-slate-50 hover:bg-fp-primary-light/10 dark:bg-fp-surface-dark dark:hover:bg-fp-primary-dark/20 text-fp-primary-light dark:text-fp-primary-dark font-bold py-2 rounded-xl transition-colors text-sm">
                                Ver Perfil
                            </a>
                        </div>
                    </div>
                </div>
            `;
            containerFavoritos.appendChild(card);
        });
        
    } catch (error) {
        console.error(error);
        showToast('Error cargando favoritos.', 'error');
    }
}

// Remueve un talento de favoritos con feedback de UI optimista instantáneo
window.removerFavorito = async function(talentoId, btnElement) {
    // Optimistic UI update
    const card = btnElement.closest('.group');
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
    
    try {
        await apiClient.delete(`/anfitrion/favoritos/${talentoId}`);
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.remove(), 200);
        showToast('Talento removido de favoritos.');
        
        // Si no quedan tarjetas, mostrar empty state simulando el fetch
        setTimeout(() => {
            if(containerFavoritos.children.length === 0) {
                cargarFavoritos();
            }
        }, 250);
        
    } catch (error) {
        console.error(error);
        showToast('Error al remover el favorito.', 'error');
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
    }
}

// Inicialización de datos principales en el evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarDatosCuenta();
    cargarFavoritos();
});
