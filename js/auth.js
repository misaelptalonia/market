/**
 * Módulo de Control de Acceso por Roles
 * Gestiona el cambio entre el perfil Visitante (solo lectura) y Administrador.
 */
export class RoleManager {
    constructor(onRoleChangeCallback) {
        this.currentRole = 'visitor';
        this.adminKey = 'alquimista2026';
        this.onRoleChange = onRoleChangeCallback;
    }

    isAdmin() {
        return this.currentRole === 'admin';
    }

    login(password) {
        if (password === this.adminKey) {
            this.currentRole = 'admin';
            this.updateUI();
            if (this.onRoleChange) this.onRoleChange(this.currentRole);
            return true;
        }
        return false;
    }

    logout() {
        this.currentRole = 'visitor';
        this.updateUI();
        if (this.onRoleChange) this.onRoleChange(this.currentRole);
    }

    updateUI() {
        const badge = document.getElementById('role-badge');
        const actionBtn = document.getElementById('role-action-btn');
        const adminTextControls = document.getElementById('admin-text-controls');
        const adminGalleryControls = document.getElementById('admin-gallery-controls');

        if (this.isAdmin()) {
            badge.innerHTML = `<i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i> Perfil: Administrador`;
            badge.className = "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40";
            actionBtn.textContent = "Cerrar Admin";
            adminTextControls.classList.remove('hidden');
            adminGalleryControls.classList.remove('hidden');
        } else {
            badge.innerHTML = `<i data-lucide="eye" class="w-3.5 h-3.5 text-sky-400"></i> Perfil: Visitante`;
            badge.className = "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700";
            actionBtn.textContent = "Acceso Admin";
            adminTextControls.classList.add('hidden');
            adminGalleryControls.classList.add('hidden');
        }
    }
}