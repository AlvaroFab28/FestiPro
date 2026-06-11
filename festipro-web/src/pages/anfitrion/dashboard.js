import { apiClient } from '../../assets/js/api-client.js';
import { showToast } from '../../assets/js/utils.js';
import { getHeaderHTML } from '../../components/header.js';

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
    // Validar WhatsApp obligatorio para acceder a eventos
    if (tabName === 'eventos') {
        if (originalCuentaData && !originalCuentaData.whatsapp_number) {
            showToast('⚠️ Configura tu número de WhatsApp en "Mi Cuenta" para publicar y administrar eventos.', 'error');
            window.switchTab('cuenta');
            setTimeout(() => {
                const waInput = document.getElementById('cuenta-whatsapp');
                if (waInput) waInput.focus();
            }, 300);
            return;
        }
    }

    const tabs = ['resumen', 'eventos', 'favoritos', 'cuenta'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const btn = document.getElementById(`btn-tab-${tab}`);
        
        if (!section || !btn) return;
        
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

// Actualiza el aspecto de la pestaña Mis Eventos si está bloqueada por falta de WhatsApp
function actualizarEstadoTabEventos() {
    const btnTabEventos = document.getElementById('btn-tab-eventos');
    if (!btnTabEventos) return;
    
    const isBlocked = originalCuentaData && !originalCuentaData.whatsapp_number;
    if (isBlocked) {
        btnTabEventos.classList.add('opacity-50', 'cursor-not-allowed');
        btnTabEventos.title = "Configura tu WhatsApp en 'Mi Cuenta' para habilitar esta pestaña";
    } else {
        btnTabEventos.classList.remove('opacity-50', 'cursor-not-allowed');
        btnTabEventos.removeAttribute('title');
    }
}

// ==========================================
// MODALS LOGIC
// ==========================================
// Abre el modal para crear (vacío) o editar (cargando datos) un evento con animación suave
window.openEventoModal = async function(eventoId = null) {
    // Validar WhatsApp obligatorio para crear/editar eventos
    if (originalCuentaData && !originalCuentaData.whatsapp_number) {
        showToast('⚠️ Configura tu número de WhatsApp en "Mi Cuenta" para poder publicar eventos.', 'error');
        window.switchTab('cuenta');
        setTimeout(() => {
            const waInput = document.getElementById('cuenta-whatsapp');
            if (waInput) waInput.focus();
        }, 300);
        return;
    }

    // Reset form
    formEvento.reset();
    document.getElementById('evento-id').value = '';
    document.getElementById('status-container').classList.add('hidden');
    document.getElementById('modal-evento-title').innerHTML = '<i class="ph ph-calendar-blank text-xl text-white"></i> Publicar Evento';
    
    // Load Catalogs if not loaded
    if (!catalogosCargados) {
        await cargarCatalogos();
    }
    
    // If Editing, fetch data
    if (eventoId) {
        document.getElementById('modal-evento-title').innerHTML = '<i class="ph ph-calendar-blank text-xl text-white"></i> Editar Evento';
        document.getElementById('status-container').classList.remove('hidden');
        cargarDatosEventoParaEdicion(eventoId);
    }
    
    const modalInner = modalEvento.querySelector('.afn-modal-inner');
    modalEvento.classList.remove('hidden');
    
    // Forzar reflow para registrar el cambio de display
    modalEvento.offsetHeight;
    
    modalEvento.classList.remove('opacity-0');
    modalEvento.classList.add('opacity-100');
    
    if (modalInner) {
        modalInner.classList.remove('scale-95', 'opacity-0');
        modalInner.classList.add('scale-100', 'opacity-100');
    }
};

// Cierra el modal de creación/edición de eventos con animación suave
window.closeEventoModal = function() {
    const modalInner = modalEvento.querySelector('.afn-modal-inner');
    
    modalEvento.classList.remove('opacity-100');
    modalEvento.classList.add('opacity-0');
    
    if (modalInner) {
        modalInner.classList.remove('scale-100', 'opacity-100');
        modalInner.classList.add('scale-95', 'opacity-0');
    }
    
    setTimeout(() => {
        if (modalEvento.classList.contains('opacity-0')) {
            modalEvento.classList.add('hidden');
        }
    }, 300);
};

// Abre el modal de confirmación para eliminar un evento con animación suave
window.openConfirmModal = function(id) {
    currentEventoIdToDelete = id;
    const modalInner = modalConfirm.querySelector('.afn-modal-inner');
    
    modalConfirm.classList.remove('hidden');
    
    // Forzar reflow
    modalConfirm.offsetHeight;
    
    modalConfirm.classList.remove('opacity-0');
    modalConfirm.classList.add('opacity-100');
    
    if (modalInner) {
        modalInner.classList.remove('scale-95', 'opacity-0');
        modalInner.classList.add('scale-100', 'opacity-100');
    }
};

// Cierra el modal de confirmación de eliminación con animación suave
window.closeConfirmModal = function() {
    const modalInner = modalConfirm.querySelector('.afn-modal-inner');
    
    modalConfirm.classList.remove('opacity-100');
    modalConfirm.classList.add('opacity-0');
    
    if (modalInner) {
        modalInner.classList.remove('scale-100', 'opacity-100');
        modalInner.classList.add('scale-95', 'opacity-0');
    }
    
    setTimeout(() => {
        if (modalConfirm.classList.contains('opacity-0')) {
            modalConfirm.classList.add('hidden');
            currentEventoIdToDelete = null;
        }
    }, 300);
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
            const fragment = document.createDocumentFragment();
            eventos.forEach(ev => {
                const card = document.createElement('div');
                
                // Color, gradients and styling of the event card based on its status
                let statusText = ev.status;
                let statusBadgeClasses = 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-400/30';
                let statusDotColor = 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse';
                let accentGradient = 'from-emerald-400 to-teal-500';
                let cardStatusClass = 'status-abierto';

                if (ev.status === 'cerrado') {
                    statusText = 'Cerrado';
                    statusBadgeClasses = 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20 dark:border-slate-400/30';
                    statusDotColor = 'bg-slate-500 dark:bg-slate-300';
                    accentGradient = 'from-slate-400 to-slate-500';
                    cardStatusClass = 'status-cerrado';
                } else if (ev.status === 'cancelado') {
                    statusText = 'Cancelado';
                    statusBadgeClasses = 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/20 dark:border-rose-400/30';
                    statusDotColor = 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse';
                    accentGradient = 'from-rose-400 to-red-500';
                    cardStatusClass = 'status-cancelado';
                } else {
                    statusText = 'Abierto';
                }

                card.className = `afn-event-card-horizontal ${cardStatusClass} group relative w-full flex flex-col md:flex-row rounded-3xl transition-all duration-500 overflow-hidden items-stretch border border-slate-200/50 dark:border-fp-border-dark/50`;

                // Format the event date nicely
                const eventDate = new Date(ev.event_date + 'T00:00:00');
                const day = eventDate.getDate();
                const monthShort = eventDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
                const year = eventDate.getFullYear();

                card.innerHTML = `
                    <!-- Left Accent Bar -->
                    <div class="afn-left-accent-bar bg-gradient-to-b ${accentGradient}"></div>
                    
                    <!-- Decorative Orbs/Glow Background -->
                    <div class="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-10 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500 pointer-events-none"></div>
                    <div class="absolute -bottom-16 -left-16 w-36 h-36 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-3xl opacity-5 group-hover:opacity-20 transition-all duration-500 pointer-events-none"></div>

                    <!-- Left Section: Date stub -->
                    <div class="p-5 md:p-6 shrink-0 w-full md:w-36 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 relative z-10 select-none border-b md:border-b-0 border-slate-100 dark:border-fp-border-dark/30">
                        <div class="flex items-center md:flex-col gap-2">
                            <span class="text-4xl md:text-5xl font-black font-display bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent leading-none tracking-tight">
                                ${day}
                            </span>
                            <div class="flex flex-col md:items-center">
                                <span class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 leading-none">
                                    ${monthShort}
                                </span>
                                <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                    ${year}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Status Badge -->
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusBadgeClasses}">
                            <span class="w-1.5 h-1.5 rounded-full ${statusDotColor}"></span>
                            ${statusText}
                        </span>
                    </div>

                    <!-- Ticket Divider Line (desktop only) -->
                    <div class="hidden md:flex flex-col justify-between items-center py-2 w-0.5 shrink-0 relative z-20">
                        <!-- Top Notch -->
                        <div class="afn-notch-top -mt-3 -ml-[11px] left-1/2"></div>
                        <!-- Bottom Notch -->
                        <div class="afn-notch-bottom -mb-3 -ml-[11px] left-1/2"></div>
                        <!-- Line -->
                        <div class="h-full border-l border-dashed border-slate-250 dark:border-fp-border-dark/60"></div>
                    </div>

                    <!-- Middle Section: Content -->
                    <div class="p-5 md:p-6 flex-1 min-w-0 flex flex-col justify-between gap-4 relative z-10">
                        <div class="space-y-2">
                            <!-- Title -->
                            <h3 class="text-lg md:text-xl font-bold font-display text-slate-800 dark:text-white tracking-tight leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">
                                ${ev.title}
                            </h3>
                            <!-- Description -->
                            <p class="text-slate-550 dark:text-slate-400 text-xs font-medium leading-relaxed line-clamp-2">
                                ${ev.description || 'Sin descripción disponible.'}
                            </p>
                        </div>
                        
                        <!-- Minimalist Pills -->
                        <div class="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-indigo-950/20 border border-slate-100 dark:border-indigo-500/10 text-slate-600 dark:text-slate-300">
                                <i class="ph ph-map-pin text-sm text-indigo-500 dark:text-indigo-400 shrink-0"></i> 
                                <span>${ev.city?.name || 'S/D'}</span>
                            </div>
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-indigo-950/20 border border-slate-100 dark:border-indigo-500/10 text-slate-600 dark:text-slate-300">
                                <i class="ph ph-tag text-sm text-indigo-500 dark:text-indigo-400 shrink-0"></i> 
                                <span>${ev.category?.name || 'S/D'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Section: Budget & Actions -->
                    <div class="p-5 md:p-6 shrink-0 w-full md:w-48 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 relative z-10 bg-slate-50/50 dark:bg-indigo-950/10 border-t md:border-t-0 md:border-l border-slate-100 dark:border-fp-border-dark/30">
                        <div class="text-left md:text-right">
                            <span class="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Presupuesto</span>
                            <span class="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-300 drop-shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                                Bs. ${parseFloat(ev.estimated_budget).toLocaleString()}
                            </span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <!-- Edit Button -->
                            <button onclick="openEventoModal('${ev.id}')" class="w-10 h-10 rounded-xl bg-indigo-50 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 text-indigo-600 hover:text-white dark:bg-indigo-950/30 dark:hover:bg-indigo-500 dark:text-indigo-400 dark:hover:text-white transition-all duration-300 hover:shadow-[0_8px_16px_rgba(108,92,231,0.25)] flex items-center justify-center cursor-pointer group-hover:scale-105 active:scale-95" title="Editar Evento">
                                <i class="ph ph-pencil-simple text-lg"></i>
                            </button>
                            <!-- Delete Button -->
                            <button onclick="openConfirmModal('${ev.id}')" class="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-500/10 dark:bg-indigo-950/20 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-xl transition-all duration-300 border border-slate-100 dark:border-indigo-500/10 hover:border-rose-500/20 dark:hover:border-rose-500/30 cursor-pointer group-hover:scale-105 active:scale-95" title="Eliminar Evento">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </div>
                    </div>             `;
                fragment.appendChild(card);
            });
            containerEventos.appendChild(fragment);
            containerEventos.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        showToast('Error cargando los eventos', 'error');
    } finally {
        loaderEventos.classList.add('hidden');
        if (typeof updateResumenTab === 'function') {
            updateResumenTab();
        }
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

// Rellena los inputs del formulario con los datos de cuenta y actualiza el header
function fillCuentaFormWithData(user) {
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    
    // Actualizar localStorage para el header
    localStorage.setItem('user_name', user.name || '');
    if (user.avatar_url) {
        localStorage.setItem('user_avatar', user.avatar_url);
    } else {
        localStorage.removeItem('user_avatar');
    }
    
    // Actualizar el header dinámicamente al instante
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
    }
    
    // Llenar form avatar
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    if (user.avatar_url) {
        const avatarFullUrl = `${baseUrl}${user.avatar_url}`;
        
        // Llenar form avatar
        document.getElementById('cuenta-avatar-preview').src = avatarFullUrl;
        document.getElementById('cuenta-avatar-preview').classList.remove('hidden');
        document.getElementById('cuenta-avatar-placeholder').classList.add('hidden');
    } else {
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
        actualizarEstadoTabEventos();
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
        actualizarEstadoTabEventos();
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
        const fragment = document.createDocumentFragment();
        
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
            // Premium layout con spotlight, borde neon en hover y degradado de fondo en modo oscuro
            card.className = 'spotlight-card bg-white dark:bg-[#0c0914] rounded-[2rem] border border-slate-200/80 dark:border-purple-500/50 overflow-hidden relative group flex flex-col transform translate-y-0 shadow-xl dark:shadow-[0_8px_25px_rgba(168,85,247,0.15)] hover:shadow-2xl hover:-translate-y-1.5 dark:hover:shadow-[0_12px_40px_rgba(168,85,247,0.45)] dark:hover:border-purple-400/80 !transition-all !duration-[350ms] !ease-out';
            
            const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
            const coverImg = profile.banner_url ? `${baseUrl}${profile.banner_url}` : 'https://placehold.co/600x400/1e293b/ffffff?text=Sin+Portada';
            const avatarImg = user.avatar_url ? `${baseUrl}${user.avatar_url}` : null;
            const display_name = profile.artistic_name || user.name;
            
            const initial = display_name.charAt(0).toUpperCase();
            const colors = ['from-purple-500 to-indigo-600', 'from-blue-500 to-teal-600', 'from-pink-500 to-rose-600', 'from-orange-500 to-amber-600', 'from-emerald-500 to-teal-600'];
            let sum = 0;
            for (let i = 0; i < display_name.length; i++) sum += display_name.charCodeAt(i);
            const colorClass = colors[sum % colors.length];

            card.innerHTML = `
                <!-- Delete Button (Glassmorphism Pill con resplandor) -->
                <button onclick="removerFavorito('${profile.id}', this)" class="absolute top-3 right-3 z-30 w-9 h-9 bg-white/90 dark:bg-[#1a162b]/80 backdrop-blur-md border border-slate-200/50 dark:border-indigo-500/20 rounded-full flex items-center justify-center text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all duration-300 shadow-md cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:-translate-y-2 md:group-hover:translate-y-0" title="Eliminar de favoritos">
                    <i class="ph ph-trash text-base"></i>
                </button>
                
                <!-- Banner Area (h-44 para dar mayor profundidad) -->
                <div class="h-44 w-full overflow-hidden relative z-0 bg-slate-100 dark:bg-[#161226] flex items-center justify-center">
                    ${profile.banner_url 
                        ? `<img src="${coverImg}" alt="Cover" class="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-out" loading="lazy">`
                        : `<div class="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center"><i class="ph-fill ph-image text-4xl text-indigo-500/30"></i></div>`
                    }
                    <!-- Overlays de degradado para fusionar el banner con el cuerpo -->
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                    <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#0c0914] to-transparent pointer-events-none"></div>
                </div>

                <!-- Body Area con cristaleria en modo claro y fondo profundo en modo oscuro -->
                <div class="px-4 pb-4 flex-grow flex flex-col justify-between relative z-10 bg-white dark:bg-[#0c0914]">
                    <!-- Floating Avatar con anillo de luz neon en hover (proporciones reducidas a w-16/w-20 y mayor margen negativo para superposición) -->
                    <div class="flex justify-center -mt-14 mb-2 relative z-20">
                        <div class="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-indigo-500/30 dark:bg-purple-500/50 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] border-4 border-white dark:border-[#0c0914] shadow-xl overflow-hidden bg-slate-100 dark:bg-[#161226] flex items-center justify-center text-xl sm:text-2xl font-black text-white transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 ring-2 ring-transparent dark:group-hover:ring-purple-500/40 relative z-10">
                            ${avatarImg 
                                ? `<img src="${avatarImg}" alt="Avatar" class="w-full h-full object-cover" loading="lazy">` 
                                : `<div class="w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center">${initial}</div>`
                            }
                        </div>
                    </div>
                    
                    <div class="text-center flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-display font-black text-lg text-slate-800 dark:text-white line-clamp-1 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">${display_name}</h3>
                            
                            <div class="flex items-center justify-center gap-1.5 mt-2 mb-2.5">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                                    <i class="ph-fill ph-star text-amber-500"></i> ${category ? category.name : 'Talento'}
                                </span>
                            </div>
                            
                            <p class="text-xs text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1.5 px-1 min-h-[36px]">${profile.bio || 'Explora mi perfil para conocer más sobre mi portafolio.'}</p>
                        </div>
                        
                        <!-- Linea Divisoria Neon sutil -->
                        <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-indigo-500/20 to-transparent my-3.5"></div>
                        
                        <div>
                            <a href="/src/pages/publico/perfil/perfil-talento.html?id=${profile.id}" class="shimmer-btn flex items-center justify-center gap-2 w-full bg-gradient-to-r from-fp-primary-light to-purple-600 hover:from-purple-600 hover:to-fp-primary-light dark:from-indigo-600 dark:to-purple-600 text-white font-extrabold py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-indigo-500/25 active:scale-95 text-xs sm:text-sm group/btn relative overflow-hidden">
                                <span>Ver perfil</span>
                                <i class="ph ph-arrow-right text-sm transition-transform duration-300 group-hover/btn:translate-x-1.5"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        containerFavoritos.appendChild(fragment);
        
        window.favoritosCargadosData = favoritos;
        if (typeof updateResumenTab === 'function') {
            updateResumenTab();
        }
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
    
    // Guardar estado original para poder restaurar en caso de fallo
    const originalFavoritos = window.favoritosCargadosData ? [...window.favoritosCargadosData] : [];
    
    // Actualizar localmente el array y sincronizar las métricas en la pestaña de Resumen
    if (window.favoritosCargadosData) {
        window.favoritosCargadosData = window.favoritosCargadosData.filter(fav => fav.talent_profile && fav.talent_profile.id !== talentoId);
    }
    if (typeof updateResumenTab === 'function') {
        updateResumenTab();
    }
    
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
        
        // Restaurar estado local si falla la llamada
        window.favoritosCargadosData = originalFavoritos;
        if (typeof updateResumenTab === 'function') {
            updateResumenTab();
        }
    }
}

// Lógica para actualizar las métricas en la pestaña de Resumen
function updateResumenTab() {
    const totalEventosEl = document.getElementById('resumen-total-eventos');
    const eventosActivosEl = document.getElementById('resumen-eventos-activos');
    const presupuestoTotalEl = document.getElementById('resumen-presupuesto-total');
    const totalFavoritosEl = document.getElementById('resumen-total-favoritos');
    const proximoEventoContainer = document.getElementById('resumen-proximo-evento-container');
    const tipContentEl = document.getElementById('resumen-tip-content');
    
    if (!totalEventosEl) return;
    
    const eventos = window.eventosCargadosData || [];
    const favoritos = window.favoritosCargadosData || [];
    
    const totalEventos = eventos.length;
    const eventosActivos = eventos.filter(ev => ev.status === 'abierto').length;
    const presupuestoTotal = eventos.reduce((sum, ev) => sum + parseFloat(ev.estimated_budget || 0), 0);
    const totalFavoritos = favoritos.length;
    
    totalEventosEl.textContent = totalEventos;
    eventosActivosEl.textContent = eventosActivos;
    presupuestoTotalEl.textContent = `Bs. ${presupuestoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    totalFavoritosEl.textContent = totalFavoritos;
    
    // Arrays de sugerencias dinámicas para evitar repetición
    const tipsSinEventos = [
        {
            title: "¡Empieza a planificar!",
            desc: `Publica tu primer evento haciendo clic en <strong>"Mis Eventos"</strong> y luego en <strong>"Nuevo Evento"</strong>. Define la categoría, ciudad y presupuesto para que los artistas de FestiPro puedan postularse.`
        },
        {
            title: "¡Encuentra el show ideal!",
            desc: `Crea tu primer evento para recibir propuestas personalizadas de talentos y bandas locales listas para tocar en tu próximo show.`
        },
        {
            title: "¡El escenario te espera!",
            desc: `Define tus requerimientos creando un evento. Podrás ver postulaciones, cotizaciones y elegir el espectáculo perfecto para tus invitados.`
        }
    ];

    const tipsSinFavoritos = [
        {
            title: "Sugerencia de Organización",
            desc: `¿Ya viste a algún artista que te llame la atención? Explora el <a href="/src/pages/publico/catalogo/catalogo.html" class="underline hover:text-amber-600 dark:hover:text-amber-400 font-semibold">Catálogo Público</a> y haz clic en el corazón para guardarlo en tus favoritos.`
        },
        {
            title: "Crea tu lista de talentos",
            desc: `Visita el <a href="/src/pages/publico/catalogo/catalogo.html" class="underline hover:text-amber-600 dark:hover:text-amber-400 font-semibold">Catálogo de Artistas</a> y guarda tus favoritos para tenerlos a mano al organizar futuros shows.`
        },
        {
            title: "Planificación Inteligente",
            desc: `Guarda perfiles destacados en tus favoritos desde el catálogo. Te facilitará convocarlos directamente cuando abras nuevas fechas.`
        }
    ];

    const tipsConEventosActivos = (activos) => [
        {
            title: "Eventos en curso",
            desc: `Tienes <strong>${activos}</strong> evento(s) abierto(s) buscando talento. Puedes ver perfiles de artistas recomendados en la pestaña Favoritos o compartir el link del evento para recibir postulaciones.`
        },
        {
            title: "Atrae al mejor talento",
            desc: `Con <strong>${activos}</strong> evento(s) activo(s), recuerda compartir el enlace público de tu publicación para captar más postulaciones.`
        },
        {
            title: "Revisa tus postulaciones",
            desc: `Tienes <strong>${activos}</strong> evento(s) recibiendo propuestas. Revisa regularmente las cotizaciones enviadas por los artistas para no perderte ninguna.`
        }
    ];

    const tipsTodoEnOrden = [
        {
            title: "¡Todo en orden!",
            desc: `No tienes eventos abiertos buscando talento actualmente. Crea un nuevo evento cuando necesites contratar artistas para tu próxima fiesta o show.`
        },
        {
            title: "Planifica el próximo show",
            desc: `¿Pensando en tu siguiente producción? Crea un evento con anticipación para darle tiempo a los artistas de preparar sus mejores ofertas.`
        },
        {
            title: "Explora y planifica",
            desc: `Aprovecha este momento sin búsquedas activas para repasar favoritos o buscar nuevos talentos en el catálogo público.`
        }
    ];

    const getRandomTip = (tipsArray) => {
        const randomIndex = Math.floor(Math.random() * tipsArray.length);
        return tipsArray[randomIndex];
    };

    let selectedTip = null;

    if (totalEventos === 0) {
        selectedTip = getRandomTip(tipsSinEventos);
    } else if (totalFavoritos === 0) {
        selectedTip = getRandomTip(tipsSinFavoritos);
    } else if (eventosActivos > 0) {
        selectedTip = getRandomTip(tipsConEventosActivos(eventosActivos));
    } else {
        selectedTip = getRandomTip(tipsTodoEnOrden);
    }

    tipContentEl.innerHTML = `
        <div class="flex gap-3 items-start text-sm text-amber-800/95 dark:text-amber-200/80">
            <i class="ph-fill ph-lightbulb text-xl shrink-0 mt-0.5 text-amber-500 dark:text-amber-400"></i>
            <div>
                <span class="font-bold block mb-0.5">${selectedTip.title}</span>
                ${selectedTip.desc}
            </div>
        </div>
    `;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEventos = eventos
        .filter(ev => ev.event_date >= todayStr && ev.status !== 'cancelado')
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
        
    if (upcomingEventos.length > 0) {
        const nextEv = upcomingEventos[0];
        const eventDate = new Date(nextEv.event_date + 'T00:00:00');
        const day = eventDate.getDate();
        const monthShort = eventDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
        const weekdayLong = eventDate.toLocaleDateString('es-ES', { weekday: 'long' });
        const year = eventDate.getFullYear();
        const formattedFullDate = eventDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const categoryName = nextEv.category?.name || 'Categoría no especificada';
        const cityName = nextEv.city?.name || 'Ciudad no especificada';
        
        const isClosed = nextEv.status === 'cerrado';
        const cardStatusClass = isClosed ? 'status-cerrado' : 'status-abierto';
        
        const badgeColorClass = isClosed ? 'text-slate-500 dark:text-slate-400' : 'text-emerald-600 dark:text-emerald-400';
        const pingBgClass = isClosed ? 'bg-slate-400 dark:bg-slate-500' : 'bg-emerald-400';
        const pingEffect = isClosed ? '' : 'animate-ping';
        const iconColorClass = isClosed ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-500';
        const titleHoverColorClass = isClosed
            ? 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
            : 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400';
        const glowOrbColor = isClosed
            ? 'from-slate-500 to-slate-600'
            : 'from-emerald-500 to-teal-500';

        proximoEventoContainer.innerHTML = `
            <div class="afn-next-event-card ${cardStatusClass} rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-stretch justify-between gap-6 overflow-hidden relative group">
                <!-- Left Accent Bar -->
                <div class="afn-next-event-accent-bar"></div>

                <!-- Glow Background Orb -->
                <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr ${glowOrbColor} rounded-full blur-3xl opacity-10 dark:opacity-20 group-hover:opacity-35 transition-all duration-500 pointer-events-none"></div>
                
                <!-- Left Section (Calendar Widget & Details) -->
                <div class="flex items-center gap-4 flex-1 pl-2">
                    <!-- Calendar Widget -->
                    <div class="afn-calendar-widget w-16 h-20 rounded-2xl flex flex-col items-center justify-between overflow-hidden shrink-0">
                        <div class="afn-calendar-widget-header w-full text-center py-1 text-[10px] font-black uppercase tracking-wider">
                            ${monthShort}
                        </div>
                        <div class="flex-1 flex flex-col items-center justify-center bg-white dark:bg-transparent">
                            <span class="text-2xl font-black font-display text-slate-800 dark:text-white leading-none">${day}</span>
                            <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">${year}</span>
                        </div>
                    </div>
                    
                    <!-- Details -->
                    <div class="space-y-1.5 min-w-0">
                        <span class="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${badgeColorClass}">
                            <span class="w-1.5 h-1.5 rounded-full ${pingBgClass} ${pingEffect}"></span>
                            ${isClosed ? 'Próximo Evento Confirmado' : 'Próximo Evento (Buscando Talento)'}
                        </span>
                        <h4 class="text-xl font-bold font-display text-slate-800 dark:text-white truncate leading-tight ${titleHoverColorClass} transition-colors duration-300">
                            ${nextEv.title}
                        </h4>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span class="capitalize flex items-center gap-1">
                                <i class="ph ph-calendar-blank ${iconColorClass}"></i> ${weekdayLong}, ${formattedFullDate}
                            </span>
                            <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                            <span class="flex items-center gap-1">
                                <i class="ph ph-map-pin ${iconColorClass}"></i> ${cityName}
                            </span>
                            <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                            <span class="flex items-center gap-1">
                                <i class="ph ph-tag ${iconColorClass}"></i> ${categoryName}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Section (Budget & Action) -->
                <div class="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-4 shrink-0 border-t border-slate-100 dark:border-fp-border-dark/30 md:border-t-0 pt-4 md:pt-0">
                    <div class="text-left md:text-right">
                        <span class="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Presupuesto Estimado</span>
                        <span class="text-3xl font-black bg-gradient-to-r from-fp-primary-light to-fp-accent-light dark:from-fp-primary-dark dark:to-fp-accent-dark bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,118,117,0.15)] tracking-tight">
                            Bs. ${parseFloat(nextEv.estimated_budget).toLocaleString()}
                        </span>
                    </div>
                    <button onclick="window.switchTab('eventos')" class="shimmer-btn bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer">
                        Administrar Evento <i class="ph ph-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        proximoEventoContainer.innerHTML = `
            <div class="afn-empty-calendar-card rounded-2xl p-6 text-center transition-all duration-300">
                <div class="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-3 text-indigo-500 dark:text-indigo-400 animate-bounce-subtle">
                    <i class="ph ph-calendar-blank text-2xl"></i>
                </div>
                <h5 class="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin eventos próximos programados</h5>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">No tienes eventos en tu agenda de las próximas fechas. ¡Publica uno nuevo para reanudar la agenda!</p>
                <button onclick="openEventoModal()" class="inline-flex items-center gap-1.5 text-xs text-fp-primary-light dark:text-fp-primary-dark font-extrabold hover:underline transition-all cursor-pointer">
                    Crear Nuevo Evento <i class="ph ph-plus-circle text-sm"></i>
                </button>
            </div>
        `;
    }
}

// Inicialización de datos principales en el evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarDatosCuenta();
    cargarFavoritos();
});
