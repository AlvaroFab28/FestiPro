import { apiClient } from '../../assets/js/api-client.js';
import { showToast } from '../../assets/js/utils.js';

// Base URL para renderizar recursos cargados (íconos, etc.)
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');

// Caching flags to prevent layout and api lag when changing tabs
let isStatsLoaded = false;
let isUsuariosLoaded = false;
let isContenidoTalentosLoaded = false;
let isContenidoEventosLoaded = false;
let isCategoriasLoaded = false;
let isActividadPublicaLoaded = false;
let isAdminLogsLoaded = false;

function invalidateStats() {
    isStatsLoaded = false;
    isActividadPublicaLoaded = false;
    isAdminLogsLoaded = false;
}


// ==========================================
// TABS & UI NAVIGATION
// ==========================================
function switchTab(tabName) {
    const tabs = ['resumen', 'usuarios', 'contenido', 'categorias', 'actividad'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const btn = document.getElementById(`btn-tab-${tab}`);
        
        if (!section || !btn) return;
        
        if (tab === tabName) {
            section.classList.remove('hidden');
            section.classList.add('block');
            btn.classList.add('text-fp-primary-light', 'active-admin-tab');
            btn.classList.remove('text-slate-600', 'dark:text-gray-300');
        } else {
            section.classList.remove('block');
            section.classList.add('hidden');
            btn.classList.remove('text-fp-primary-light', 'active-admin-tab');
            btn.classList.add('text-slate-600', 'dark:text-gray-300');
        }
    });

    if (tabName === 'resumen') {
        cargarStats();
    } else if (tabName === 'usuarios') {
        cargarUsuarios();
    } else if (tabName === 'contenido') {
        cargarContenido();
    } else if (tabName === 'categorias') {
        cargarCategorias();
    } else if (tabName === 'actividad') {
        cargarActividad();
    }
}
window.switchTab = switchTab;

// ==========================================
// ACTION CONFIRMATION MODAL (HU 19)
// ==========================================
let onConfirmProceedCallback = null;

function confirmAction(title, message, proceedCallback) {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    onConfirmProceedCallback = () => {
        proceedCallback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('modal-confirm');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    onConfirmProceedCallback = null;
}

// Bind confirmation buttons
document.getElementById('btn-confirm-cancel').addEventListener('click', closeConfirmModal);
document.getElementById('btn-confirm-proceed').addEventListener('click', () => {
    if (typeof onConfirmProceedCallback === 'function') {
        onConfirmProceedCallback();
    }
});

// ==========================================
// TAB 1: CONTROL CENTRAL (ESTADÍSTICAS)
// ==========================================
async function cargarStats(forceRefresh = false) {
    if (isStatsLoaded && !forceRefresh) return;
    try {
        const response = await apiClient.get('/admin/stats');
        const stats = response.data;

        document.getElementById('stat-total-usuarios').textContent = stats.total_usuarios;
        document.getElementById('stat-talentos-publicados').textContent = stats.talentos_publicados;
        document.getElementById('stat-eventos-abiertos').textContent = stats.eventos_abiertos;
        document.getElementById('stat-categorias-activas').textContent = stats.categorias_activas;
        if (document.getElementById('stat-reviews-totales')) {
            document.getElementById('stat-reviews-totales').textContent = stats.reviews_totales || 0;
        }
        document.getElementById('stat-usuarios-suspendidos').textContent = stats.usuarios_suspendidos;

        // Distribución de Roles
        const total = stats.total_usuarios || 1;
        const pctTalentos = Math.round((stats.distribution.talentos / total) * 100);
        const pctAnfitriones = Math.round((stats.distribution.anfitriones / total) * 100);
        const pctAdmins = Math.round((stats.distribution.administradores / total) * 100);

        document.getElementById('role-pct-talentos').textContent = `${pctTalentos}% (${stats.distribution.talentos})`;
        document.getElementById('role-bar-talentos').style.width = `${pctTalentos}%`;

        document.getElementById('role-pct-anfitriones').textContent = `${pctAnfitriones}% (${stats.distribution.anfitriones})`;
        document.getElementById('role-bar-anfitriones').style.width = `${pctAnfitriones}%`;

        document.getElementById('role-pct-admins').textContent = `${pctAdmins}% (${stats.distribution.administradores})`;
        document.getElementById('role-bar-admins').style.width = `${pctAdmins}%`;
        isStatsLoaded = true;
    } catch (error) {
        console.error(error);
        showToast('Error al cargar estadísticas globales.', 'error');
    }
}

// ==========================================
// TAB 2: USUARIOS REGISTRADOS
// ==========================================
let allUsuarios = [];
let currentUsrFilter = 'todos';

window.filterUsuarios = function(filterType) {
    currentUsrFilter = filterType;
    
    const filters = ['todos', 'talentos', 'anfitriones', 'admins', 'baneados'];
    filters.forEach(f => {
        const pill = document.getElementById(`pill-usr-${f}`);
        if (pill) {
            if (f === filterType) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        }
    });
    
    applyUsuariosFilter();
};

function applyUsuariosFilter() {
    const searchInput = document.getElementById('search-usuarios');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filtered = allUsuarios;
    
    // Filtro por buscador
    if (query) {
        filtered = filtered.filter(user => 
            (user.name && user.name.toLowerCase().includes(query)) || 
            (user.email && user.email.toLowerCase().includes(query))
        );
    }
    
    // Filtro por pill
    if (currentUsrFilter === 'talentos') {
        filtered = filtered.filter(u => u.role === 'talento');
    } else if (currentUsrFilter === 'anfitriones') {
        filtered = filtered.filter(u => u.role === 'anfitrion');
    } else if (currentUsrFilter === 'admins') {
        filtered = filtered.filter(u => u.is_admin);
    } else if (currentUsrFilter === 'baneados') {
        filtered = filtered.filter(u => u.banned_at !== null);
    }
    
    renderUsuariosTable(filtered);
}

function renderUsuariosTable(usuarios) {
    const tableBody = document.getElementById('usuarios-table-body');
    tableBody.innerHTML = '';
    
    if (usuarios.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No se encontraron usuarios que coincidan con la búsqueda.
            </td>
        `;
        tableBody.appendChild(tr);
        return;
    }
    
    const fragment = document.createDocumentFragment();
    usuarios.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors adm-row-animate';
        tr.style.animationDelay = `${index * 0.02}s`;
        
        const initials = user.name ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'U';
        const profile = user.talent_profile || user.talentProfile;
        
        let actionButtons = '';
        if (user.is_super_admin) {
            actionButtons = `
                <span class="text-[10px] bg-slate-100 dark:bg-fp-surface-muted-dark text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-lg font-medium italic">Súper Admin Protegido</span>
            `;
        } else {
            const adminBtnText = user.is_admin ? 'Quitar Admin' : 'Hacer Admin';
            const adminBtnIcon = user.is_admin ? 'ph-crown-simple' : 'ph-crown';
            const adminBtnColor = user.is_admin ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-fp-primary-light hover:bg-fp-primary-light/10 dark:text-fp-primary-dark';
            
            const banBtnText = user.banned_at ? 'Reactivar' : 'Suspender';
            const banBtnIcon = user.banned_at ? 'ph-check-circle' : 'ph-prohibit';
            const banBtnColor = user.banned_at ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20';
            
            let viewProfileBtn = '';
            if (user.role === 'talento' && profile) {
                viewProfileBtn = `
                    <a href="/src/pages/publico/perfil/perfil-talento.html?id=${profile.id}" target="_blank" class="w-[72px] py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap" title="Ver Perfil Público">
                        <i class="ph ph-arrow-square-out text-xs text-fp-primary-light"></i> Perfil
                    </a>
                `;
            } else {
                viewProfileBtn = `
                    <span class="w-[72px] py-1.5 rounded-lg text-[10px] font-bold text-slate-300 dark:text-slate-600 inline-flex items-center justify-center gap-1 whitespace-nowrap" title="Sin perfil público">
                        <i class="ph ph-minus text-xs"></i>
                    </span>
                `;
            }

            actionButtons = `
                <div class="flex justify-end gap-1.5">
                    <button onclick="toggleAdminUser('${user.id}', ${user.is_admin})" class="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${adminBtnColor}" title="${adminBtnText}">
                        <i class="ph ${adminBtnIcon} text-xs"></i> ${adminBtnText}
                    </button>
                    <button onclick="toggleBanUser('${user.id}', ${!!user.banned_at})" class="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${banBtnColor}" title="${banBtnText}">
                        <i class="ph ${banBtnIcon} text-xs"></i> ${banBtnText}
                    </button>
                    ${viewProfileBtn}
                </div>
            `;
        }

        // Estado visual
        let estadoBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Activo</span>';
        if (user.banned_at) {
            const bannedUntil = user.banned_until ? ` (Hasta ${new Date(user.banned_until).toLocaleDateString()})` : ' (Indefinido)';
            estadoBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400" title="Suspendido${bannedUntil}">Suspendido</span>`;
        }

        const rolAdminBadge = user.is_admin
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">Admin</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-fp-surface-muted-dark text-slate-500 dark:text-slate-400">Usuario</span>';

        const userRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Sin Rol';
        const registrationDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

        // Alias visual
        const aliasVal = (user.role === 'talento' && profile && profile.artistic_name)
            ? `<span class="font-semibold text-slate-800 dark:text-white">${profile.artistic_name}</span>`
            : `<span class="text-slate-400 dark:text-slate-500 font-medium">-</span>`;

        tr.innerHTML = `
            <td class="px-5 py-3 flex items-center space-x-3">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-fp-primary-light to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                    ${user.avatar_url ? `<img src="${BASE_URL}${user.avatar_url}" alt="Avatar" class="w-full h-full rounded-full object-cover">` : initials}
                </div>
                <div class="min-w-0">
                    <span class="font-bold text-slate-800 dark:text-white text-xs block truncate">${user.name}</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5" title="Fecha de Registro">Reg: ${registrationDate}</span>
                </div>
            </td>
            <td class="px-5 py-3 text-xs text-center">${aliasVal}</td>
            <td class="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">${user.email}</td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-500">${userRole}</td>
            <td class="px-5 py-3">${rolAdminBadge}</td>
            <td class="px-5 py-3">${estadoBadge}</td>
            <td class="px-5 py-3 text-right">${actionButtons}</td>
        `;
        fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
}

async function cargarUsuarios(forceRefresh = false) {
    if (isUsuariosLoaded && !forceRefresh) return;
    const loader = document.getElementById('usuarios-loader');
    const container = document.getElementById('usuarios-container');
    
    loader.classList.remove('hidden');
    container.classList.add('hidden');
    
    try {
        const response = await apiClient.get('/admin/usuarios');
        allUsuarios = response.data;
        applyUsuariosFilter();
        isUsuariosLoaded = true;
    } catch (error) {
        console.error(error);
        showToast('Error cargando usuarios registrados.', 'error');
    } finally {
        loader.classList.add('hidden');
        container.classList.remove('hidden');
    }
}

// ==========================================
// BAN MODAL AND SELECTION (🕐 BAN DURACIÓN)
// ==========================================
let currentBanUserId = null;
let selectedBanDurationDays = 0; // 0 = Indefinido

window.openBanModal = function(userId) {
    currentBanUserId = userId;
    selectedBanDurationDays = 0;
    
    // Set Indefinido active
    const durations = [0, 1, 7, 30];
    durations.forEach(d => {
        const pill = document.getElementById(`ban-p-${d}`);
        if (d === 0) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    const modal = document.getElementById('modal-ban-duration');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeBanModal = function() {
    const modal = document.getElementById('modal-ban-duration');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    currentBanUserId = null;
};

window.selectBanDuration = function(days) {
    selectedBanDurationDays = days;
    const durations = [0, 1, 7, 30];
    durations.forEach(d => {
        const pill = document.getElementById(`ban-p-${d}`);
        if (d === days) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
};

document.getElementById('btn-ban-proceed').addEventListener('click', async () => {
    if (!currentBanUserId) return;
    const proceedBtn = document.getElementById('btn-ban-proceed');
    proceedBtn.disabled = true;
    proceedBtn.textContent = 'Procesando...';

    try {
        const response = await apiClient.patch(`/admin/usuarios/${currentBanUserId}/ban`, {
            duration_days: selectedBanDurationDays
        });
        showToast(response.message || 'Usuario suspendido con éxito.');
        closeBanModal();
        cargarUsuarios(true);
        invalidateStats();
    } catch (error) {
        console.error(error);
        showToast(error.data?.message || 'Error al suspender usuario.', 'error');
    } finally {
        proceedBtn.disabled = false;
        proceedBtn.textContent = 'Confirmar Suspensión';
    }
});

window.toggleBanUser = function(userId, isBanned) {
    if (isBanned) {
        confirmAction(
            '¿Levantar suspensión al usuario?',
            'El usuario recuperará el acceso inmediato a la plataforma.',
            async () => {
                try {
                    const response = await apiClient.patch(`/admin/usuarios/${userId}/ban`);
                    showToast(response.message || 'Suspensión levantada con éxito.');
                    cargarUsuarios(true);
                    invalidateStats();
                } catch (error) {
                    console.error(error);
                    showToast(error.data?.message || 'Error al reactivar el usuario.', 'error');
                }
            }
        );
    } else {
        openBanModal(userId);
    }
};

window.toggleAdminUser = function(userId, isAdmin) {
    const actionText = isAdmin ? 'revocar el rol de administrador' : 'conceder el rol de administrador';
    const warningText = isAdmin 
        ? 'Este usuario ya no tendrá acceso al panel de administración interna.' 
        : 'Este usuario tendrá privilegios completos para gestionar la plataforma.';

    confirmAction(
        `¿Confirmas ${actionText}?`,
        warningText,
        async () => {
            try {
                const response = await apiClient.patch(`/admin/usuarios/${userId}/rol`);
                showToast(response.message || 'Rol de usuario actualizado correctamente.');
                cargarUsuarios(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                const msg = error.data?.message || 'Error al cambiar rol del usuario.';
                showToast(msg, 'error');
            }
        }
    );
};

// ==========================================
// TAB 3: MODERACIÓN DE CONTENIDO
// ==========================================
function switchSubTab(subTabName) {
    const subTalentos = document.getElementById('sub-panel-talentos');
    const subEventos = document.getElementById('sub-panel-eventos');
    const btnTalentos = document.getElementById('btn-sub-talentos');
    const btnEventos = document.getElementById('btn-sub-eventos');

    if (subTabName === 'talentos') {
        subTalentos.classList.remove('hidden');
        subEventos.classList.add('hidden');
        btnTalentos.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg bg-white dark:bg-fp-surface-dark text-fp-primary-light dark:text-white shadow-sm';
        btnEventos.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
        cargarContenidoTalentos();
    } else {
        subTalentos.classList.add('hidden');
        subEventos.classList.remove('hidden');
        btnTalentos.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
        btnEventos.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg bg-white dark:bg-fp-surface-dark text-fp-primary-light dark:text-white shadow-sm';
        cargarContenidoEventos();
    }
}
window.switchSubTab = switchSubTab;

function cargarContenido() {
    const subTalentos = document.getElementById('sub-panel-talentos');
    if (subTalentos.classList.contains('hidden')) {
        cargarContenidoEventos();
    } else {
        cargarContenidoTalentos();
    }
}

let allTalentos = [];
let allEventos = [];
let hasLoadedModeracionCategories = false;

async function popularModeracionCategorias() {
    if (hasLoadedModeracionCategories) return;
    try {
        const response = await apiClient.get('/categorias');
        const categories = response.data;
        const select = document.getElementById('filter-moderacion-categoria');
        if (select) {
            select.innerHTML = '<option value="todas">Todas las Categorías</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre || cat.name;
                select.appendChild(opt);
            });
            hasLoadedModeracionCategories = true;
        }
    } catch (error) {
        console.error('Error al popular categorías en moderación:', error);
    }
}

async function cargarContenidoTalentos(forceRefresh = false) {
    if (isContenidoTalentosLoaded && !forceRefresh) return;
    const tbody = document.getElementById('talentos-moderacion-body');
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">Cargando perfiles...</td></tr>';
    try {
        const [_, response] = await Promise.all([
            popularModeracionCategorias(),
            apiClient.get('/admin/contenido/talentos')
        ]);
        allTalentos = response.data;
        applyModeracionTalentosFilter();
        isContenidoTalentosLoaded = true;
    } catch (error) {
        console.error(error);
        showToast('Error al cargar perfiles de talentos.', 'error');
    }
}

function applyModeracionTalentosFilter() {
    const searchInput = document.getElementById('search-moderacion-talentos');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const filterCat = document.getElementById('filter-moderacion-categoria');
    const selectedCat = filterCat ? filterCat.value : 'todas';
    
    let filtered = allTalentos;
    
    if (query) {
        filtered = filtered.filter(t => 
            t.artistic_name && t.artistic_name.toLowerCase().includes(query)
        );
    }
    
    if (selectedCat !== 'todas') {
        filtered = filtered.filter(t => String(t.category_id) === selectedCat);
    }
    
    renderTalentosTable(filtered);
};

function renderTalentosTable(talentos) {
    const tbody = document.getElementById('talentos-moderacion-body');
    tbody.innerHTML = '';
    if (talentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">No se encontraron perfiles de talento.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    talentos.forEach((t, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors adm-row-animate';
        tr.style.animationDelay = `${index * 0.02}s`;
        
        const avatarChar = t.artistic_name ? t.artistic_name.charAt(0).toUpperCase() : 'T';
        const avatarHtml = t.user?.avatar_url 
            ? `<img src="${BASE_URL}${t.user.avatar_url}" alt="Avatar" class="w-full h-full rounded-full object-cover">` 
            : avatarChar;

        const isComplete = t.user?.avatar_url && t.bio && t.base_price && parseFloat(t.base_price) > 0 && t.city_id;
        const completenessBadge = isComplete 
            ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Completo</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">Incompleto</span>';

        tr.innerHTML = `
            <td class="px-5 py-3 flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-fp-surface-dark text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    ${avatarHtml}
                </div>
                <div class="min-w-0">
                    <span class="font-bold text-slate-800 dark:text-white text-xs block truncate">${t.artistic_name}</span>
                    <span class="block mt-1">${completenessBadge}</span>
                </div>
            </td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-500">${t.category?.name || 'N/A'}</td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-500">${t.city?.name || 'N/A'}</td>
            <td class="px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">Bs. ${parseFloat(t.base_price).toLocaleString()}</td>
            <td class="px-5 py-3 text-xs font-semibold text-amber-500">★ ${t.average_rating || '0.0'}</td>
            <td class="px-5 py-3 text-right">
                <button onclick="abrirModalModerarTalento('${t.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-fp-surface-muted-dark dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1">
                    <i class="ph ph-shield-check text-xs text-fp-primary-light"></i> Moderar
                </button>
            </td>
        `;
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
}

async function cargarContenidoEventos(forceRefresh = false) {
    if (isContenidoEventosLoaded && !forceRefresh) return;
    const tbody = document.getElementById('eventos-moderacion-body');
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">Cargando eventos...</td></tr>';
    try {
        const response = await apiClient.get('/admin/contenido/eventos');
        allEventos = response.data;

        const searchInput = document.getElementById('search-moderacion-eventos');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (query) {
            const filtered = allEventos.filter(ev => 
                (ev.title && ev.title.toLowerCase().includes(query)) ||
                (ev.host?.name && ev.host.name.toLowerCase().includes(query))
            );
            renderEventosTable(filtered);
        } else {
            renderEventosTable(allEventos);
        }
        isContenidoEventosLoaded = true;
    } catch (error) {
        console.error(error);
        showToast('Error al cargar eventos.', 'error');
    }
}

function renderEventosTable(eventos) {
    const tbody = document.getElementById('eventos-moderacion-body');
    tbody.innerHTML = '';
    if (eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400">No se encontraron eventos.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    eventos.forEach((ev, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors adm-row-animate';
        tr.style.animationDelay = `${index * 0.02}s`;

        const formattedDate = ev.event_date ? new Date(ev.event_date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';

        tr.innerHTML = `
            <td class="px-5 py-3 min-w-[150px]">
                <span class="font-semibold text-slate-800 dark:text-white block truncate text-xs" title="${ev.title}">${ev.title}</span>
            </td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-500">${ev.host?.name || 'N/A'}</td>
            <td class="px-5 py-3 text-xs font-semibold text-slate-500">${ev.category?.name || 'N/A'}</td>
            <td class="px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">Bs. ${parseFloat(ev.estimated_budget).toLocaleString()}</td>
            <td class="px-5 py-3 text-xs text-slate-400 font-semibold">${formattedDate}</td>
            <td class="px-5 py-3 text-right">
                <button onclick="abrirModalVerEvento('${ev.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-fp-surface-muted-dark/50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1">
                    <i class="ph ph-calendar text-xs text-fp-primary-light"></i> Ver Evento
                </button>
            </td>
        `;
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
}

async function eliminarTalento(id) {
    confirmAction(
        '¿Eliminar este perfil de talento?',
        'El perfil artístico del talento se eliminará permanentemente. Su cuenta de usuario será dada de baja en consecuencia.',
        async () => {
            try {
                const response = await apiClient.delete(`/admin/contenido/talentos/${id}`);
                showToast(response.message || 'Perfil de talento eliminado.');
                cargarContenidoTalentos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast(error.data?.message || 'Error al eliminar el talento.', 'error');
            }
        }
    );
}

async function eliminarEvento(id) {
    confirmAction(
        '¿Eliminar este evento?',
        'El evento de anfitrión se eliminará permanentemente del catálogo.',
        async () => {
            try {
                const response = await apiClient.delete(`/admin/contenido/eventos/${id}`);
                showToast(response.message || 'Evento eliminado.');
                cargarContenidoEventos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast(error.data?.message || 'Error al eliminar el evento.', 'error');
            }
        }
    );
}

// ==========================================
// DETALLE Y MODERACIÓN GRANULAR DE TALENTO
// ==========================================
window.abrirModalModerarTalento = async function(id) {
    const modal = document.getElementById('modal-moderar-talento');
    const loadingEl = document.getElementById('modal-moderar-loading');
    const bodyEl = document.getElementById('modal-moderar-body');
    const footerEl = document.getElementById('modal-moderar-footer');

    // Usamos el cache local para poner el nombre del talento de forma instantánea
    const cachedTalent = allTalentos.find(t => t.id === id);
    document.getElementById('mod-artistic-name').textContent = cachedTalent ? cachedTalent.artistic_name : 'Cargando...';

    // Mostrar modal inmediatamente
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Mostrar estado de carga y ocultar contenido temporalmente
    loadingEl.classList.remove('hidden');
    bodyEl.classList.add('hidden');
    footerEl.classList.add('hidden');

    try {
        const response = await apiClient.get(`/admin/contenido/talentos/${id}`);
        const talent = response.data;
        
        document.getElementById('mod-artistic-name').textContent = talent.artistic_name || 'Talento';
        document.getElementById('mod-category').textContent = talent.category?.name || 'N/A';
        document.getElementById('mod-city').textContent = talent.city?.name || 'N/A';
        document.getElementById('mod-price').textContent = talent.base_price ? `Bs. ${parseFloat(talent.base_price).toLocaleString()}` : '-';
        
        // Render Bio
        const bioEl = document.getElementById('mod-bio');
        bioEl.textContent = talent.bio || 'Sin biografía';
        
        // Render Avatar
        const avatarContainer = document.getElementById('mod-avatar-container');
        const nameChar = talent.artistic_name ? talent.artistic_name.charAt(0).toUpperCase() : 'T';
        if (talent.user?.avatar_url) {
            avatarContainer.innerHTML = `<img src="${BASE_URL}${talent.user.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
        } else {
            avatarContainer.innerHTML = nameChar;
        }

        // Render Banner
        const bannerContainer = document.getElementById('mod-banner-container');
        if (talent.banner_url) {
            bannerContainer.innerHTML = `<img src="${BASE_URL}${talent.banner_url}" alt="Banner" class="w-full h-full object-cover rounded-xl">`;
        } else {
            bannerContainer.innerHTML = `<div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center p-2">Sin Portada</div>`;
        }
        
        // Render Gallery
        const galleryGrid = document.getElementById('mod-gallery-grid');
        galleryGrid.innerHTML = '';
        const galleries = talent.galleries || [];
        document.getElementById('mod-gallery-count').textContent = galleries.length;
        
        if (galleries.length === 0) {
            galleryGrid.innerHTML = `<p class="col-span-full text-xs text-slate-400 italic text-center py-4">No hay fotos en la galería.</p>`;
        } else {
            galleries.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'relative group aspect-square rounded-lg overflow-hidden border border-slate-200/50 dark:border-fp-border-dark/50 bg-slate-100 dark:bg-slate-800';
                item.innerHTML = `
                    <img src="${BASE_URL}${photo.image_url}" alt="Foto Galería" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onclick="eliminarFotoTalento('${talent.id}', '${photo.id}')" class="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer shadow-md" title="Eliminar Foto">
                            <i class="ph ph-trash text-base"></i>
                        </button>
                    </div>
                `;
                galleryGrid.appendChild(item);
            });
        }
        
        // Configure actions
        const btnAvatar = document.getElementById('btn-mod-delete-avatar');
        btnAvatar.onclick = () => borrarAvatarTalento(talent.id);
        if (!talent.user?.avatar_url) {
            btnAvatar.disabled = true;
            btnAvatar.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnAvatar.disabled = false;
            btnAvatar.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        const btnBanner = document.getElementById('btn-mod-delete-banner');
        btnBanner.onclick = () => borrarBannerTalento(talent.id);
        if (!talent.banner_url) {
            btnBanner.disabled = true;
            btnBanner.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnBanner.disabled = false;
            btnBanner.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        const btnBio = document.getElementById('btn-mod-delete-bio');
        btnBio.onclick = () => borrarDescripcionTalento(talent.id);
        if (!talent.bio) {
            btnBio.disabled = true;
            btnBio.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnBio.disabled = false;
            btnBio.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        const btnProfile = document.getElementById('btn-mod-delete-profile');
        btnProfile.onclick = () => {
            closeModerarTalentoModal();
            eliminarTalento(talent.id);
        };

        const btnSuspend = document.getElementById('btn-mod-suspend-user');
        if (btnSuspend) {
            btnSuspend.onclick = () => {
                closeModerarTalentoModal();
                toggleBanUser(talent.user_id, talent.user?.banned_at !== null && talent.user?.banned_at !== undefined);
            };
        }

        // Ocultar loader y revelar contenido
        loadingEl.classList.add('hidden');
        bodyEl.classList.remove('hidden');
        footerEl.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        showToast('Error al obtener los detalles del talento.', 'error');
        closeModerarTalentoModal();
    }
};

window.closeModerarTalentoModal = function() {
    const modal = document.getElementById('modal-moderar-talento');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
};

window.eliminarFotoTalento = function(talentoId, fotoId) {
    confirmAction(
        '¿Eliminar esta foto de la galería?',
        'La foto se borrará permanentemente del servidor y del perfil del talento.',
        async () => {
            try {
                await apiClient.delete(`/admin/contenido/talentos/${talentoId}/fotos/${fotoId}`);
                showToast('Foto registrada como eliminada.');
                abrirModalModerarTalento(talentoId);
                cargarContenidoTalentos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al eliminar la foto de galería.', 'error');
            }
        }
    );
};

async function borrarDescripcionTalento(id) {
    confirmAction(
        '¿Borrar la biografía?',
        'La biografía del talento se borrará y quedará vacía.',
        async () => {
            try {
                await apiClient.patch(`/admin/contenido/talentos/${id}/descripcion`);
                showToast('Biografía borrada correctamente.');
                abrirModalModerarTalento(id);
                cargarContenidoTalentos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al borrar la biografía.', 'error');
            }
        }
    );
}

async function borrarAvatarTalento(id) {
    confirmAction(
        '¿Borrar la foto de perfil?',
        'El avatar se eliminará. Volverá a mostrar las iniciales del talento.',
        async () => {
            try {
                await apiClient.patch(`/admin/contenido/talentos/${id}/avatar`);
                showToast('Foto de perfil borrada correctamente.');
                abrirModalModerarTalento(id);
                cargarContenidoTalentos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al borrar la foto de perfil.', 'error');
            }
        }
    );
}

async function borrarBannerTalento(id) {
    confirmAction(
        '¿Borrar la foto de portada / banner?',
        'El banner se eliminará del perfil y volverá a mostrar el color degradado por defecto en la vista pública.',
        async () => {
            try {
                await apiClient.patch(`/admin/contenido/talentos/${id}/banner`);
                showToast('Banner borrado correctamente.');
                abrirModalModerarTalento(id);
                cargarContenidoTalentos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al borrar el banner.', 'error');
            }
        }
    );
}

// ==========================================
// MODAL DE DETALLE DE EVENTO
// ==========================================
window.abrirModalVerEvento = async function(id) {
    try {
        const response = await apiClient.get(`/admin/contenido/eventos/${id}`);
        const event = response.data;
        
        document.getElementById('evt-title').textContent = event.title || 'Evento';
        document.getElementById('evt-category').textContent = event.category?.name || 'N/A';
        document.getElementById('evt-city').textContent = event.city?.name || 'N/A';
        document.getElementById('evt-budget').textContent = event.estimated_budget ? `Bs. ${parseFloat(event.estimated_budget).toLocaleString()}` : '-';
        
        const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '-';
        document.getElementById('evt-date').textContent = eventDate;
        document.getElementById('evt-description').textContent = event.description || 'Sin descripción';
        
        // Render status
        const statusBadge = document.getElementById('evt-status-badge');
        if (event.status === 'abierto') {
            statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
            statusBadge.textContent = 'abierto';
            
            const btnClose = document.getElementById('btn-evt-close');
            btnClose.disabled = false;
            btnClose.classList.remove('opacity-50', 'cursor-not-allowed');
            btnClose.onclick = () => cerrarEvento(event.id);
        } else {
            statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-fp-surface-muted-dark text-slate-500 dark:text-slate-400';
            statusBadge.textContent = 'cerrado';
            
            const btnClose = document.getElementById('btn-evt-close');
            btnClose.disabled = true;
            btnClose.classList.add('opacity-50', 'cursor-not-allowed');
            btnClose.onclick = null;
        }

        // Render Host
        const hostAvatar = document.getElementById('evt-host-avatar');
        const initials = event.host?.name ? event.host.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'H';
        if (event.host?.avatar_url) {
            hostAvatar.innerHTML = `<img src="${BASE_URL}${event.host.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
        } else {
            hostAvatar.innerHTML = initials;
        }
        document.getElementById('evt-host-name').textContent = event.host?.name || 'N/A';
        document.getElementById('evt-host-email').textContent = event.host?.email || 'N/A';
        
        // Configure actions
        const btnDelete = document.getElementById('btn-evt-delete');
        btnDelete.onclick = () => {
            closeVerEventoModal();
            eliminarEvento(event.id);
        };
        
        const modal = document.getElementById('modal-ver-evento');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error(error);
        showToast('Error al obtener los detalles del evento.', 'error');
    }
};

window.closeVerEventoModal = function() {
    const modal = document.getElementById('modal-ver-evento');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
};

async function cerrarEvento(id) {
    confirmAction(
        '¿Cerrar este evento?',
        'El evento cambiará su estado a "cerrado" y no recibirá más postulaciones.',
        async () => {
            try {
                await apiClient.patch(`/admin/contenido/eventos/${id}/cerrar`);
                showToast('Evento cerrado correctamente.');
                closeVerEventoModal();
                cargarContenidoEventos(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al cerrar el evento.', 'error');
            }
        }
    );
}

// ==========================================
// TAB 4: GESTIÓN DE CATEGORÍAS
// ==========================================
const PHOSPHOR_ICONS = [
    'ph-sparkle', 'ph-disc', 'ph-music-note', 'ph-music-notes', 'ph-guitar', 'ph-piano-keys', 'ph-microphone', 'ph-microphone-stage', 
    'ph-speaker-hifi', 'ph-playlist', 'ph-mask-happy', 'ph-magic-wand', 'ph-balloon', 'ph-confetti', 'ph-crown', 'ph-sneaker', 
    'ph-popcorn', 'ph-camera', 'ph-video-camera', 'ph-film-strip', 'ph-projector-screen', 'ph-lightbulb', 'ph-flashlight', 
    'ph-flame', 'ph-star', 'ph-compass', 'ph-globe', 'ph-ticket', 'ph-beer-bottle', 'ph-wine', 'ph-martini', 'ph-cake', 
    'ph-gift', 'ph-bell', 'ph-cards', 'ph-dice-five', 'ph-game-controller', 'ph-smiley', 'ph-paint-brush', 'ph-trophy', 
    'ph-medal', 'ph-users', 'ph-detective', 'ph-flower-tulip', 'ph-cassette-tape', 'ph-radio', 'ph-vinyl-record'
];

function initIconPicker() {
    const grid = document.getElementById('cat-icon-grid');
    if (!grid || grid.children.length > 0) return; // Only init once
    
    grid.innerHTML = '';
    PHOSPHOR_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-picker-btn p-2 rounded-lg bg-white dark:bg-fp-surface-dark border border-slate-200 dark:border-fp-border-dark flex items-center justify-center text-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-fp-primary-light transition-all cursor-pointer w-10 h-10';
        btn.innerHTML = `<i class="ph ${icon}"></i>`;
        btn.title = icon;
        btn.onclick = () => selectIcon(icon);
        grid.appendChild(btn);
    });
}

function selectIcon(iconClass) {
    // Deselect previous
    const buttons = document.querySelectorAll('.icon-picker-btn');
    buttons.forEach(btn => {
        btn.classList.remove('border-fp-primary-light', 'ring-2', 'ring-fp-primary-light/30', 'bg-fp-primary-light/5', 'dark:bg-fp-primary-dark/10');
        btn.classList.add('border-slate-200', 'dark:border-fp-border-dark');
    });
    
    // Select clicked
    const clickedBtn = Array.from(buttons).find(btn => btn.title === iconClass);
    if (clickedBtn) {
        clickedBtn.classList.remove('border-slate-200', 'dark:border-fp-border-dark');
        clickedBtn.classList.add('border-fp-primary-light', 'ring-2', 'ring-fp-primary-light/30', 'bg-fp-primary-light/5', 'dark:bg-fp-primary-dark/10');
    }
    
    // Update input and preview
    document.getElementById('cat-icon-class').value = iconClass;
    
    const preview = document.getElementById('selected-icon-preview');
    if (preview) {
        preview.innerHTML = `<i class="ph ${iconClass} text-fp-primary-light text-lg"></i>`;
    }
    
    const nameLabel = document.getElementById('selected-icon-name');
    if (nameLabel) {
        nameLabel.textContent = iconClass;
    }
}

async function cargarCategorias(forceRefresh = false) {
    if (isCategoriasLoaded && !forceRefresh) return;
    const loader = document.getElementById('categorias-loader');
    const container = document.getElementById('categorias-container');
    const tableBody = document.getElementById('categorias-table-body');
    
    loader.classList.remove('hidden');
    container.classList.add('hidden');
    tableBody.innerHTML = '';
    
    try {
        const response = await apiClient.get('/admin/categorias');
        const categorias = response.data;
        
        const fragment = document.createDocumentFragment();
        categorias.forEach((cat, index) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors adm-row-animate';
            tr.style.animationDelay = `${index * 0.02}s`;
            
            const estadoBadge = cat.is_active
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Activa</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-fp-surface-muted-dark text-slate-500 dark:text-slate-400">Inactiva</span>';

            const toggleBtnText = cat.is_active ? 'Desactivar' : 'Activar';
            const toggleBtnColor = cat.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20';

            const iconClass = cat.icon_class || 'ph-sparkle';
            const escName = cat.name.replace(/'/g, "\\'");
            const escIcon = iconClass.replace(/'/g, "\\'");

            const talentCount = cat.talent_profiles_count || 0;

            tr.innerHTML = `
                <td class="px-5 py-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-fp-surface-muted-dark/50 flex items-center justify-center border border-slate-100 dark:border-fp-border-dark/30 shadow-sm transition-all duration-300 hover:scale-105">
                        <i class="ph ${iconClass} text-xl bg-clip-text text-transparent bg-gradient-to-r from-fp-primary-light to-purple-600 dark:from-fp-primary-dark dark:to-purple-400"></i>
                    </div>
                </td>
                <td class="px-5 py-3 font-semibold text-slate-800 dark:text-white text-xs">${cat.name}</td>
                <td class="px-5 py-3 text-xs font-semibold text-slate-500">${talentCount}</td>
                <td class="px-5 py-3">${estadoBadge}</td>
                <td class="px-5 py-3 text-right">
                    <div class="flex justify-end gap-1.5">
                        <button onclick="openCategoryModal({id: '${cat.id}', name: '${escName}', icon_class: '${escIcon}'})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-fp-surface-muted-dark dark:hover:bg-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1" title="Editar Categoría">
                            <i class="ph ph-pencil-simple text-xs"></i> Editar
                        </button>
                        <button onclick="toggleCategoryActive('${cat.id}', ${cat.is_active})" class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${toggleBtnColor}" title="${toggleBtnText}">
                            <i class="ph ${cat.is_active ? 'ph-eye-slash' : 'ph-eye'} text-xs"></i> ${toggleBtnText}
                        </button>
                        <button onclick="eliminarCategoria('${cat.id}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-rose-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1" title="Eliminar Categoría">
                            <i class="ph ph-trash text-xs"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            fragment.appendChild(tr);
        });
        tableBody.appendChild(fragment);
        isCategoriasLoaded = true;
    } catch (error) {
        console.error(error);
        showToast('Error cargando categorías.', 'error');
    } finally {
        loader.classList.add('hidden');
        container.classList.remove('hidden');
    }
}

window.eliminarCategoria = function(catId) {
    confirmAction(
        '¿Eliminar esta categoría?',
        'Esta acción no se puede deshacer. Los talentos asociados a esta categoría podrían quedar sin clasificación.',
        async () => {
            try {
                await apiClient.delete(`/admin/categorias/${catId}`);
                showToast('Categoría eliminada exitosamente.');
                cargarCategorias(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast(error.data?.message || 'Error al eliminar la categoría.', 'error');
            }
        }
    );
};

window.toggleCategoryActive = function(catId, isActive) {
    const actionText = isActive ? 'desactivar' : 'activar';
    const warningText = isActive 
        ? 'La categoría no aparecerá disponible para los filtros públicos del catálogo.' 
        : 'La categoría volverá a estar disponible para búsquedas y clasificaciones públicas.';

    confirmAction(
        `¿Confirmas ${actionText} la categoría?`,
        warningText,
        async () => {
            try {
                const response = await apiClient.patch(`/admin/categorias/${catId}/toggle`);
                showToast(response.message || 'Estado de categoría actualizado.');
                cargarCategorias(true);
                invalidateStats();
            } catch (error) {
                console.error(error);
                showToast('Error al actualizar el estado de la categoría.', 'error');
            }
        }
    );
};

// ==========================================
// MODAL CATEGORY CREATION/EDITION
// ==========================================
function openCategoryModal(cat = null) {
    const modal = document.getElementById('modal-categoria');
    const titleEl = document.getElementById('modal-categoria-title');
    const editIdInput = document.getElementById('cat-edit-id');
    const nameInput = document.getElementById('cat-name');
    
    initIconPicker();
    
    if (cat) {
        titleEl.textContent = 'Editar Categoría';
        editIdInput.value = cat.id;
        nameInput.value = cat.name;
        selectIcon(cat.icon_class || 'ph-sparkle');
    } else {
        titleEl.textContent = 'Nueva Categoría';
        editIdInput.value = '';
        nameInput.value = '';
        selectIcon('ph-sparkle');
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
window.openCategoryModal = openCategoryModal;

function closeCategoryModal() {
    const modal = document.getElementById('modal-categoria');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.getElementById('form-categoria').reset();
    document.getElementById('cat-edit-id').value = '';
    document.getElementById('cat-icon-class').value = '';
    
    const preview = document.getElementById('selected-icon-preview');
    if (preview) {
        preview.innerHTML = `<i class="ph ph-question"></i>`;
    }
    const nameLabel = document.getElementById('selected-icon-name');
    if (nameLabel) {
        nameLabel.textContent = '-';
    }
}
window.closeCategoryModal = closeCategoryModal;

// Form Submit (dual)
document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('btn-save-category');
    const originalText = saveBtn.textContent;
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    saveBtn.classList.add('opacity-70', 'cursor-not-allowed');
    
    const catId = document.getElementById('cat-edit-id').value;
    const name = document.getElementById('cat-name').value.trim();
    const icon_class = document.getElementById('cat-icon-class').value;
    
    if (!icon_class) {
        showToast('El ícono es obligatorio para guardar una categoría.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        return;
    }
    
    try {
        const payload = { name, icon_class };
        if (catId) {
            await apiClient.post(`/admin/categorias/${catId}`, payload);
            showToast('Categoría actualizada exitosamente.');
        } else {
            await apiClient.post('/admin/categorias', payload);
            showToast('Categoría creada exitosamente.');
        }
        closeCategoryModal();
        cargarCategorias(true);
        invalidateStats();
    } catch (error) {
        console.error(error);
        if (error.status === 422 && error.data?.errors) {
            const validationErrors = Object.values(error.data.errors).flat().join('\n');
            showToast(validationErrors, 'error');
        } else {
            showToast(error.data?.message || 'Error al guardar la categoría.', 'error');
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
});

// ==========================================
// TAB 5: ACTIVIDAD RECIENTE (TIMELINE FEED)
// ==========================================
async function cargarActividad(forceRefresh = false) {
    const subPublica = document.getElementById('sub-panel-actividad-publica');
    if (subPublica && subPublica.classList.contains('hidden')) {
        await cargarAdminLogs(forceRefresh);
    } else {
        await cargarActividadPublica(forceRefresh);
    }
}

async function cargarActividadPublica(forceRefresh = false) {
    if (isActividadPublicaLoaded && !forceRefresh) return;
    const timeline = document.getElementById('recent-activity-timeline');
    timeline.innerHTML = '<div class="text-center py-8 text-slate-400">Cargando feed de actividad...</div>';
    try {
        const response = await apiClient.get('/admin/actividad/reciente');
        const data = response.data;

        const activities = [];

        if (data.usuarios) {
            data.usuarios.forEach(u => {
                activities.push({
                    type: 'usuario',
                    title: 'Nuevo Registro',
                    description: `El usuario <strong>${u.name}</strong> (${u.email}) se registró como <strong>${u.role || 'Admin'}</strong>.`,
                    date: new Date(u.created_at.endsWith('Z') ? u.created_at : u.created_at + 'Z'),
                    icon: 'ph ph-user-plus',
                    colorClass: 'bg-blue-500 text-white dark:bg-blue-950 dark:text-blue-400'
                });
            });
        }

        if (data.eventos) {
            data.eventos.forEach(ev => {
                activities.push({
                    type: 'evento',
                    title: 'Nuevo Evento Publicado',
                    description: `El anfitrión <strong>${ev.host?.name || 'Usuario'}</strong> publicó el evento <strong>"${ev.title}"</strong> con presupuesto de <strong>Bs. ${parseFloat(ev.estimated_budget).toLocaleString()}</strong>.`,
                    date: new Date(ev.created_at.endsWith('Z') ? ev.created_at : ev.created_at + 'Z'),
                    icon: 'ph ph-calendar-plus',
                    colorClass: 'bg-amber-500 text-white dark:bg-amber-950 dark:text-amber-400'
                });
            });
        }

        if (data.reviews) {
            data.reviews.forEach(rev => {
                activities.push({
                    type: 'review',
                    title: 'Nueva Opinión Recibida',
                    description: `El anfitrión <strong>${rev.host?.name || 'Anfitrión'}</strong> calificó con <strong>${rev.rating} ★</strong> al talento <strong>${rev.talent_profile?.artistic_name || 'Talento'}</strong>: <em>"${rev.comment}"</em>.`,
                    date: new Date(rev.created_at.endsWith('Z') ? rev.created_at : rev.created_at + 'Z'),
                    icon: 'ph ph-chat-text',
                    colorClass: 'bg-pink-500 text-white dark:bg-pink-950 dark:text-pink-400'
                });
            });
        }

        // Ordenar cronológicamente descendente
        activities.sort((a, b) => b.date - a.date);

        timeline.innerHTML = '';
        if (activities.length === 0) {
            timeline.innerHTML = '<div class="text-center py-8 text-slate-400">No hay actividad reciente.</div>';
            isActividadPublicaLoaded = true;
            return;
        }

        // Filtrar las primeras 20
        const topActivities = activities.slice(0, 20);

        const fragment = document.createDocumentFragment();
        topActivities.forEach((act, index) => {
            const item = document.createElement('div');
            item.className = 'adm-timeline-item adm-row-animate';
            item.style.animationDelay = `${index * 0.03}s`;

            const formattedTime = timeAgo(act.date);

            item.innerHTML = `
                <div class="adm-timeline-badge ${act.colorClass}">
                    <i class="${act.icon} text-[10px]"></i>
                </div>
                <div class="bg-slate-50/70 dark:bg-fp-surface-muted-dark/30 border border-slate-100 dark:border-fp-border-dark/30 rounded-xl p-3.5 shadow-sm">
                    <div class="flex justify-between items-start gap-4">
                        <h5 class="text-xs font-bold text-slate-800 dark:text-white">${act.title}</h5>
                        <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">${formattedTime}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">${act.description}</p>
                </div>
            `;
            fragment.appendChild(item);
        });
        timeline.appendChild(fragment);
        isActividadPublicaLoaded = true;
    } catch (error) {
        console.error(error);
        timeline.innerHTML = '<div class="text-center py-8 text-red-400">Error al cargar actividad reciente.</div>';
    }
}

async function cargarAdminLogs(forceRefresh = false) {
    if (isAdminLogsLoaded && !forceRefresh) return;
    const timeline = document.getElementById('admin-actions-timeline');
    if (!timeline) return;
    timeline.innerHTML = '<div class="text-center py-8 text-slate-400">Cargando logs de administración...</div>';
    try {
        const response = await apiClient.get('/admin/logs');
        const logs = response.data;
        
        timeline.innerHTML = '';
        if (logs.length === 0) {
            timeline.innerHTML = '<div class="text-center py-8 text-slate-400">No hay acciones registradas.</div>';
            isAdminLogsLoaded = true;
            return;
        }

        const fragment = document.createDocumentFragment();
        logs.forEach((log, index) => {
            const item = document.createElement('div');
            item.className = 'adm-timeline-item adm-row-animate';
            item.style.animationDelay = `${index * 0.03}s`;

            const formattedTime = timeAgo(new Date(log.created_at.endsWith('Z') ? log.created_at : log.created_at + 'Z'));
            
            // Map actions to icons and colors
            let icon = 'ph ph-shield-warning';
            let colorClass = 'bg-slate-500 text-white dark:bg-slate-900';
            
            if (log.action.includes('ban') || log.action.includes('suspend')) {
                icon = 'ph ph-prohibit';
                colorClass = 'bg-red-500 text-white dark:bg-red-950 dark:text-red-400';
            } else if (log.action.includes('delete') || log.action.includes('clear')) {
                icon = 'ph ph-trash';
                colorClass = 'bg-rose-500 text-white dark:bg-rose-950 dark:text-rose-400';
            } else if (log.action.includes('role')) {
                icon = 'ph ph-crown';
                colorClass = 'bg-purple-500 text-white dark:bg-purple-950 dark:text-purple-400';
            } else if (log.action.includes('category')) {
                icon = 'ph ph-tag';
                colorClass = 'bg-blue-500 text-white dark:bg-blue-950 dark:text-blue-400';
            }

            item.innerHTML = `
                <div class="adm-timeline-badge ${colorClass}">
                    <i class="${icon} text-[10px]"></i>
                </div>
                <div class="bg-slate-50/70 dark:bg-fp-surface-muted-dark/30 border border-slate-100 dark:border-fp-border-dark/30 rounded-xl p-3.5 shadow-sm">
                    <div class="flex justify-between items-start gap-4">
                        <h5 class="text-xs font-bold text-slate-800 dark:text-white">${log.admin ? log.admin.name : 'Administrador'}</h5>
                        <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">${formattedTime}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">${log.details || log.action}</p>
                </div>
            `;
            fragment.appendChild(item);
        });
        timeline.appendChild(fragment);
        isAdminLogsLoaded = true;
    } catch (error) {
        console.error(error);
        timeline.innerHTML = '<div class="text-center py-8 text-red-400">Error al cargar logs de administración.</div>';
    }
}

window.switchActividadSubTab = function(subTabName) {
    const subPublica = document.getElementById('sub-panel-actividad-publica');
    const subAdmins = document.getElementById('sub-panel-actividad-admins');
    const btnPublica = document.getElementById('btn-sub-actividad-publica');
    const btnAdmins = document.getElementById('btn-sub-actividad-admins');

    if (subTabName === 'publica') {
        subPublica.classList.remove('hidden');
        subAdmins.classList.add('hidden');
        btnPublica.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg bg-white dark:bg-fp-surface-dark text-fp-primary-light dark:text-white shadow-sm';
        btnAdmins.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
        cargarActividadPublica();
    } else {
        subPublica.classList.add('hidden');
        subAdmins.classList.remove('hidden');
        btnPublica.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';
        btnAdmins.className = 'text-xs font-bold px-4 py-2 transition-all cursor-pointer rounded-lg bg-white dark:bg-fp-surface-dark text-fp-primary-light dark:text-white shadow-sm';
        cargarAdminLogs();
    }
};

function timeAgo(date) {
    let seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 0) seconds = 0; // Prevenir fechas futuras

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `hace ${interval} año${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `hace ${interval} me${interval > 1 ? 'ses' : 's'}`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `hace ${interval} día${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `hace ${interval} hora${interval > 1 ? 's' : ''}`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `hace ${interval} minuto${interval > 1 ? 's' : ''}`;
    
    return 'hace unos momentos';
}

// ==========================================
// INIT PAGE & WELCOME OVERLAY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Comprobar bienvenida
    checkWelcomeScreen();

    // Iniciar con la pestaña Resumen
    switchTab('resumen');
    
    // Prefetching silencioso en background para que el primer clic sea instantáneo
    setTimeout(() => {
        prefetchAdminData();
    }, 1500);

    // Listener para búsqueda local de usuarios
    const searchInput = document.getElementById('search-usuarios');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyUsuariosFilter();
        });
    }

    // Listener para búsqueda local de talentos en moderación
    const searchTalentos = document.getElementById('search-moderacion-talentos');
    if (searchTalentos) {
        searchTalentos.addEventListener('input', () => {
            applyModeracionTalentosFilter();
        });
    }

    // Listener para el selector de categoría en moderación
    const filterModCat = document.getElementById('filter-moderacion-categoria');
    if (filterModCat) {
        filterModCat.addEventListener('change', () => {
            applyModeracionTalentosFilter();
        });
    }

    // Listener para búsqueda local de eventos en moderación
    const searchEventos = document.getElementById('search-moderacion-eventos');
    if (searchEventos) {
        searchEventos.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allEventos.filter(ev => 
                (ev.title && ev.title.toLowerCase().includes(query)) ||
                (ev.host?.name && ev.host.name.toLowerCase().includes(query))
            );
            renderEventosTable(filtered);
        });
    }
});

function checkWelcomeScreen() {
    const welcomeOverlay = document.getElementById('admin-welcome-overlay');
    const welcomed = localStorage.getItem('admin_welcomed');
    if (!welcomed && welcomeOverlay) {
        welcomeOverlay.classList.remove('hidden');
        welcomeOverlay.classList.add('flex');
    }
}

const welcomeStartBtn = document.getElementById('btn-welcome-start');
if (welcomeStartBtn) {
    welcomeStartBtn.addEventListener('click', () => {
        const welcomeOverlay = document.getElementById('admin-welcome-overlay');
        if (welcomeOverlay) {
            welcomeOverlay.classList.remove('flex');
            welcomeOverlay.classList.add('hidden');
        }
        localStorage.setItem('admin_welcomed', 'true');
    });
}

function prefetchAdminData() {
    // Estas llamadas actualizarán el DOM interno de las pestañas ocultas, 
    // sin que el usuario note saltos visuales ya que sus contenedores padres tienen display:none
    Promise.all([
        cargarUsuarios(),
        popularModeracionCategorias(),
        cargarContenidoTalentos(),
        cargarContenidoEventos(),
        cargarCategorias(),
        cargarActividadPublica(),
        cargarAdminLogs()
    ]).catch(e => console.warn('Background prefetch cancelado o con error:', e));
}
