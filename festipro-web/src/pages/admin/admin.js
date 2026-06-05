import { apiClient } from '../../assets/js/api-client.js';
import { showToast } from '../../assets/js/utils.js';

// Base URL para renderizar recursos cargados (íconos, etc.)
const API_URL = import.meta.env.VITE_API_URL || 'http://festipro-api.test/api';
const BASE_URL = API_URL.replace('/api', '');



// ==========================================
// TABS & UI NAVIGATION
// ==========================================
export function switchTab(tabName) {
    const tabs = ['usuarios', 'categorias'];
    
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

    if (tabName === 'usuarios') {
        cargarUsuarios();
    } else if (tabName === 'categorias') {
        cargarCategorias();
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
// TAB 1: USUARIOS REGISTRADOS
// ==========================================
let allUsuarios = [];

function renderUsuariosTable(usuarios) {
    const tableBody = document.getElementById('usuarios-table-body');
    tableBody.innerHTML = '';
    
    if (usuarios.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No se encontraron usuarios que coincidan con la búsqueda.
            </td>
        `;
        tableBody.appendChild(tr);
        return;
    }
    
    usuarios.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors';
        
        // Inicial de Avatar
        const avatarChar = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        
        // Botones de acción deshabilitados/visualmente protegidos si es Super Admin
        let actionButtons = '';
        if (user.is_super_admin) {
            actionButtons = `
                <span class="text-xs bg-slate-100 dark:bg-fp-surface-dark text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-full font-medium italic">Súper Admin Protegido</span>
            `;
        } else {
            const adminBtnText = user.is_admin ? 'Quitar Admin' : 'Hacer Admin';
            const adminBtnColor = user.is_admin ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-fp-primary-light hover:bg-fp-primary-light/10 dark:text-fp-primary-dark';
            const banBtnText = user.banned_at ? 'Reactivar' : 'Suspender';
            const banBtnColor = user.banned_at ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20';
            
            actionButtons = `
                <div class="flex justify-end gap-2">
                    <button onclick="toggleAdminUser('${user.id}', ${user.is_admin})" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${adminBtnColor}">
                        ${adminBtnText}
                    </button>
                    <button onclick="toggleBanUser('${user.id}', ${!!user.banned_at})" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${banBtnColor}">
                        ${banBtnText}
                    </button>
                </div>
            `;
        }

        // Estado visual
        const estadoBadge = user.banned_at 
            ? '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">Suspendido</span>'
            : '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Activo</span>';

        const rolAdminBadge = user.is_admin
            ? '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">Admin</span>'
            : '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-fp-surface-dark text-slate-600 dark:text-slate-400">Usuario</span>';

        const userRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Sin Rol';

        tr.innerHTML = `
            <td class="px-6 py-4 flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-fp-surface-dark text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm uppercase">
                    ${user.avatar_url ? `<img src="${BASE_URL}${user.avatar_url}" alt="Avatar" class="w-full h-full rounded-full object-cover">` : avatarChar}
                </div>
                <span class="font-semibold text-slate-800 dark:text-white">${user.name}</span>
            </td>
            <td class="px-6 py-4 font-mono text-sm">${user.email}</td>
            <td class="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">${userRole}</td>
            <td class="px-6 py-4">${rolAdminBadge}</td>
            <td class="px-6 py-4">${estadoBadge}</td>
            <td class="px-6 py-4 text-right">${actionButtons}</td>
        `;
        tableBody.appendChild(tr);
    });
}

async function cargarUsuarios() {
    const loader = document.getElementById('usuarios-loader');
    const container = document.getElementById('usuarios-container');
    const searchInput = document.getElementById('search-usuarios');
    
    loader.classList.remove('hidden');
    container.classList.add('hidden');
    
    try {
        const response = await apiClient.get('/admin/usuarios');
        allUsuarios = response.data;
        
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (query) {
            const filtered = allUsuarios.filter(user => 
                (user.name && user.name.toLowerCase().includes(query)) || 
                (user.email && user.email.toLowerCase().includes(query))
            );
            renderUsuariosTable(filtered);
        } else {
            renderUsuariosTable(allUsuarios);
        }
    } catch (error) {
        console.error(error);
        showToast('Error cargando usuarios registrados.', 'error');
    } finally {
        loader.classList.add('hidden');
        container.classList.remove('hidden');
    }
}

window.toggleBanUser = function(userId, isBanned) {
    const actionText = isBanned ? 'reactivar' : 'suspender';
    const warningText = isBanned 
        ? 'El usuario podrá volver a iniciar sesión y utilizar todas las funciones.' 
        : 'El usuario perderá el acceso inmediato a la plataforma y no podrá iniciar sesión.';

    confirmAction(
        `¿Confirmas ${actionText} al usuario?`,
        warningText,
        async () => {
            try {
                const response = await apiClient.patch(`/admin/usuarios/${userId}/ban`);
                showToast(response.message || 'Estado de suspensión actualizado correctamente.');
                cargarUsuarios();
            } catch (error) {
                console.error(error);
                const msg = error.data?.message || 'Error al cambiar estado del usuario.';
                showToast(msg, 'error');
            }
        }
    );
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
                cargarUsuarios();
            } catch (error) {
                console.error(error);
                const msg = error.data?.message || 'Error al cambiar rol del usuario.';
                showToast(msg, 'error');
            }
        }
    );
};

// ==========================================
// TAB 2: GESTIÓN DE CATEGORÍAS
// ==========================================
async function cargarCategorias() {
    const loader = document.getElementById('categorias-loader');
    const container = document.getElementById('categorias-container');
    const tableBody = document.getElementById('categorias-table-body');
    
    loader.classList.remove('hidden');
    container.classList.add('hidden');
    tableBody.innerHTML = '';
    
    try {
        const response = await apiClient.get('/admin/categorias');
        const categorias = response.data;
        
        categorias.forEach(cat => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 dark:border-fp-border-dark hover:bg-slate-50/55 dark:hover:bg-slate-800/25 transition-colors';
            
            const estadoBadge = cat.is_active
                ? '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Activa</span>'
                : '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-fp-surface-dark text-slate-600 dark:text-slate-400">Inactiva</span>';

            const toggleBtnText = cat.is_active ? 'Desactivar' : 'Activar';
            const toggleBtnColor = cat.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20';

            const iconUrl = cat.icon_url ? `${BASE_URL}${cat.icon_url}` : 'https://placehold.co/40x40/1e293b/ffffff?text=C';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-fp-surface-dark/80 p-2 flex items-center justify-center border border-slate-200/50 dark:border-fp-border-dark">
                        <img src="${iconUrl}" alt="${cat.name}" class="w-full h-full object-contain">
                    </div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-800 dark:text-white text-sm">${cat.name}</td>
                <td class="px-6 py-4">${estadoBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="toggleCategoryActive('${cat.id}', ${cat.is_active})" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${toggleBtnColor}">
                        ${toggleBtnText}
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        
    } catch (error) {
        console.error(error);
        showToast('Error cargando categorías.', 'error');
    } finally {
        loader.classList.add('hidden');
        container.classList.remove('hidden');
    }
}

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
                cargarCategorias();
            } catch (error) {
                console.error(error);
                showToast('Error al actualizar el estado de la categoría.', 'error');
            }
        }
    );
};

// ==========================================
// MODAL CATEGORY CREATION
// ==========================================
export function openCategoryModal() {
    const modal = document.getElementById('modal-categoria');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
window.openCategoryModal = openCategoryModal;

export function closeCategoryModal() {
    const modal = document.getElementById('modal-categoria');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.getElementById('form-categoria').reset();
    document.getElementById('cat-icon-filename').textContent = 'Ningún archivo seleccionado';
}
window.closeCategoryModal = closeCategoryModal;

// File selector filename update
const catIconInput = document.getElementById('cat-icon');
if (catIconInput) {
    catIconInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        document.getElementById('cat-icon-filename').textContent = file ? file.name : 'Ningún archivo seleccionado';
    });
}

// Form Submit
document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const saveBtn = document.getElementById('btn-save-category');
    const originalText = saveBtn.textContent;
    
    // Evitar doble submit
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    saveBtn.classList.add('opacity-70', 'cursor-not-allowed');
    
    const formData = new FormData(form);
    
    try {
        await apiClient.post('/admin/categorias', formData);
        showToast('Categoría creada exitosamente.');
        closeCategoryModal();
        cargarCategorias();
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
// INIT PAGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Carga inicial por pestaña activa
    switchTab('usuarios');
    
    // Listener para búsqueda local de usuarios (Filtro UX Tarea 6.5)
    const searchInput = document.getElementById('search-usuarios');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allUsuarios.filter(user => 
                (user.name && user.name.toLowerCase().includes(query)) || 
                (user.email && user.email.toLowerCase().includes(query))
            );
            renderUsuariosTable(filtered);
        });
    }
});
