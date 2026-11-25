import { collection, doc, addDoc, deleteDoc, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ALLOWED_GENRES, SEED_WORKS, SEED_IMAGES, APP_ID, initFirebaseService } from "./firebase-config.js";
import { RoleManager } from "./auth.js";

// Estado global de la aplicación
let db = null;
let isCloudReady = false;
let literaryWorks = [];
let galleryImages = [];
let activeGenreFilter = 'Todos';

// Instancia del gestor de perfiles
const roleManager = new RoleManager(() => {
    renderLiteraryWorks();
    renderGallery();
    if (window.lucide) window.lucide.createIcons();
});

/**
 * Inicialización del almacenamiento (Nube Firestore o Respaldo LocalStorage)
 */
async function bootstrapApp() {
    const cloud = await initFirebaseService();
    db = cloud.db;
    isCloudReady = cloud.isCloudReady;

    if (isCloudReady && db) {
        await seedCloudIfEmpty();
        subscribeToCloudCollections();
    } else {
        loadFromLocalStorage();
        renderLiteraryWorks();
        renderGallery();
    }
}

async function seedCloudIfEmpty() {
    try {
        const worksCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'literary_works');
        const worksSnap = await getDocs(worksCol);
        if (worksSnap.empty) {
            for (const work of SEED_WORKS) {
                await addDoc(worksCol, { ...work, createdAt: Date.now() });
            }
        }

        const galleryCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'gallery_images');
        const gallerySnap = await getDocs(galleryCol);
        if (gallerySnap.empty) {
            for (const img of SEED_IMAGES) {
                await addDoc(galleryCol, { ...img, createdAt: Date.now() });
            }
        }
    } catch (error) {
        console.error("Error poblando datos iniciales:", error);
    }
}

function subscribeToCloudCollections() {
    const worksCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'literary_works');
    onSnapshot(worksCol, (snapshot) => {
        literaryWorks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderLiteraryWorks();
    });

    const galleryCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'gallery_images');
    onSnapshot(galleryCol, (snapshot) => {
        galleryImages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderGallery();
    });
}

function loadFromLocalStorage() {
    const savedWorks = localStorage.getItem('alquimista_works');
    const savedImages = localStorage.getItem('alquimista_images');

    literaryWorks = savedWorks
        ? JSON.parse(savedWorks)
        : SEED_WORKS.map((w, i) => ({ id: `local-w-${i}`, ...w }));

    galleryImages = savedImages
        ? JSON.parse(savedImages)
        : SEED_IMAGES.map((img, i) => ({ id: `local-i-${i}`, ...img }));
}

function saveToLocalStorage() {
    localStorage.setItem('alquimista_works', JSON.stringify(literaryWorks));
    localStorage.setItem('alquimista_images', JSON.stringify(galleryImages));
}

/**
 * Renderizado de Textos Ordenados Alfabéticamente (A-Z) y por Género
 */
function renderLiteraryWorks() {
    const container = document.getElementById('literary-container');
    if (!container) return;
    container.innerHTML = '';

    const genresToRender = activeGenreFilter === 'Todos' ? ALLOWED_GENRES : [activeGenreFilter];

    genresToRender.forEach(genre => {
        const worksInGenre = literaryWorks
            .filter(item => item.genre === genre)
            .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' }));

        const sectionEl = document.createElement('div');
        sectionEl.className = "bg-[#14161f]/70 border border-slate-800/90 rounded-2xl p-6 sm:p-8";

        let html = `
            <div class="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                <h3 class="font-alchemy text-xl sm:text-2xl font-bold text-amber-400 flex items-center gap-2.5">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                    ${genre}
                </h3>
                <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                    ${worksInGenre.length} ${worksInGenre.length === 1 ? 'obra' : 'obras'} (A-Z)
                </span>
            </div>
        `;

        if (worksInGenre.length === 0) {
            html += `<p class="text-slate-500 italic text-sm">Aún no hay manuscritos publicados en este género.</p>`;
        } else {
            html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
            worksInGenre.forEach(work => {
                const contentStr = work.content || '';
                const excerpt = contentStr.length > 135 ? contentStr.substring(0, 135) + '...' : contentStr;

                const deleteBtn = roleManager.isAdmin()
                    ? `<button onclick="deleteText('${work.id}', event)" title="Eliminar obra" class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition">
                         <i data-lucide="trash-2" class="w-4 h-4"></i>
                       </button>`
                    : '';

                html += `
                    <article onclick="openReader('${work.id}')" class="group cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg">
                        <div>
                            <div class="flex items-start justify-between gap-2 mb-3">
                                <h4 class="font-alchemy text-lg font-bold text-slate-100 group-hover:text-amber-300 transition">
                                    ${work.title}
                                </h4>
                                ${deleteBtn}
                            </div>
                            <p class="font-literary text-slate-400 text-sm leading-relaxed">
                                "${excerpt}"
                            </p>
                        </div>
                        <div class="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400/80 font-medium">
                            <span>Leer manuscrito</span>
                            <i data-lucide="arrow-up-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
                        </div>
                    </article>
                `;
            });
            html += `</div>`;
        }

        sectionEl.innerHTML = html;
        container.appendChild(sectionEl);
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Renderizado de Galería Ordenada Alfabéticamente (A-Z)
 */
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sortedImages = [...galleryImages].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' })
    );

    sortedImages.forEach(img => {
        const deleteBtn = roleManager.isAdmin()
            ? `<button onclick="deleteImage('${img.id}', event)" class="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition">
                 <i data-lucide="trash-2" class="w-4 h-4"></i>
               </button>`
            : '';

        const card = document.createElement('div');
        card.className = "group relative bg-[#14161f] border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1";
        card.innerHTML = `
            ${deleteBtn}
            <div onclick="openLightbox('${img.id}')" class="cursor-pointer aspect-[4/3] overflow-hidden bg-slate-900">
                <img src="${img.url}" 
                     onerror="this.src='https://placehold.co/800x600/14161f/d4af37?text=Obra+Visual'" 
                     alt="${img.title}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            </div>
            <div class="p-5">
                <h3 class="font-alchemy text-lg font-bold text-amber-100">${img.title}</h3>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">${img.description}</p>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Compresión ligera de imágenes locales para compatibilidad con Firestore
 */
function compressImageToDataURL(file, maxWidth = 1000, quality = 0.78) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3500);
}

/**
 * Funciones globales expuestas al DOM
 */
window.toggleRoleModal = () => {
    if (roleManager.isAdmin()) {
        roleManager.logout();
        showToast("Has vuelto al perfil de Visitante (Solo lectura).");
    } else {
        window.openModal('auth-modal');
    }
};

window.handleAdminLogin = (event) => {
    event.preventDefault();
    const input = document.getElementById('admin-password-input');
    if (roleManager.login(input.value)) {
        input.value = '';
        window.closeModal('auth-modal');
        showToast("Bienvenido, Administrador. Permisos de edición activados.");
    } else {
        showToast("Clave incorrecta. Intenta con: alquimista2026");
    }
};

window.handleAddText = async (event) => {
    event.preventDefault();
    if (!roleManager.isAdmin()) return;

    const title = document.getElementById('new-text-title').value.trim();
    const genre = document.getElementById('new-text-genre').value;
    const content = document.getElementById('new-text-body').value.trim();
    if (!title || !content) return;

    try {
        if (isCloudReady && db) {
            const worksCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'literary_works');
            await addDoc(worksCol, { title, genre, content, createdAt: Date.now() });
        } else {
            literaryWorks.push({ id: String(Date.now()), title, genre, content });
            saveToLocalStorage();
            renderLiteraryWorks();
        }
        event.target.reset();
        window.closeModal('upload-text-modal');
        showToast(`"${title}" publicado y ordenado en ${genre}.`);
    } catch (error) {
        console.error(error);
        showToast("Error al guardar el texto.");
    }
};

window.deleteText = async (id, event) => {
    event.stopPropagation();
    if (!roleManager.isAdmin()) return;

    try {
        if (isCloudReady && db) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'literary_works', id));
        } else {
            literaryWorks = literaryWorks.filter(item => item.id !== id);
            saveToLocalStorage();
            renderLiteraryWorks();
        }
        showToast("Manuscrito eliminado.");
    } catch (error) {
        console.error(error);
        showToast("No se pudo eliminar el manuscrito.");
    }
};

window.handleAddImage = async (event) => {
    event.preventDefault();
    if (!roleManager.isAdmin()) return;

    const title = document.getElementById('new-img-title').value.trim();
    const description = document.getElementById('new-img-desc').value.trim();
    const fileInput = document.getElementById('new-img-file');
    const urlInput = document.getElementById('new-img-url').value.trim();

    try {
        let finalImageUrl = '';
        if (fileInput.files && fileInput.files[0]) {
            showToast("Optimizando imagen...");
            finalImageUrl = await compressImageToDataURL(fileInput.files[0]);
        } else if (urlInput) {
            finalImageUrl = urlInput;
        } else {
            showToast("Selecciona una imagen o pega una URL válida.");
            return;
        }

        if (isCloudReady && db) {
            const galleryCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'gallery_images');
            await addDoc(galleryCol, { title, url: finalImageUrl, description, createdAt: Date.now() });
        } else {
            galleryImages.push({ id: String(Date.now()), title, url: finalImageUrl, description });
            saveToLocalStorage();
            renderGallery();
        }

        event.target.reset();
        window.closeModal('upload-image-modal');
        showToast(`Imagen "${title}" añadida a la galería.`);
    } catch (error) {
        console.error(error);
        showToast("Error al subir la imagen.");
    }
};

window.deleteImage = async (id, event) => {
    event.stopPropagation();
    if (!roleManager.isAdmin()) return;

    try {
        if (isCloudReady && db) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'gallery_images', id));
        } else {
            galleryImages = galleryImages.filter(img => img.id !== id);
            saveToLocalStorage();
            renderGallery();
        }
        showToast("Imagen eliminada.");
    } catch (error) {
        console.error(error);
        showToast("No se pudo eliminar la imagen.");
    }
};

window.switchView = (viewName) => {
    const homeView = document.getElementById('view-home');
    const galleryView = document.getElementById('view-gallery');
    const navHome = document.getElementById('nav-home');
    const navGallery = document.getElementById('nav-gallery');

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        galleryView.classList.add('hidden');
        navHome.className = "nav-btn px-3 py-2 rounded-lg text-sm font-medium text-amber-400 bg-amber-500/10 transition";
        navGallery.className = "nav-btn px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-amber-300 hover:bg-white/5 transition";
    } else {
        homeView.classList.add('hidden');
        galleryView.classList.remove('hidden');
        navGallery.className = "nav-btn px-3 py-2 rounded-lg text-sm font-medium text-amber-400 bg-amber-500/10 transition";
        navHome.className = "nav-btn px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-amber-300 hover:bg-white/5 transition";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.filterGenre = (genre) => {
    activeGenreFilter = genre;
    document.querySelectorAll('.genre-pill').forEach(btn => {
        btn.className = btn.dataset.genre === genre
            ? "genre-pill active px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-amber-500 text-slate-950 transition"
            : "genre-pill px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-900 text-slate-300 border border-slate-700 hover:border-amber-500/50 transition";
    });
    renderLiteraryWorks();
};

window.openReader = (id) => {
    const work = literaryWorks.find(item => item.id === id);
    if (!work) return;
    document.getElementById('reader-genre').textContent = work.genre;
    document.getElementById('reader-title').textContent = work.title;
    document.getElementById('reader-content').textContent = work.content;
    window.openModal('reader-modal');
};

window.openLightbox = (id) => {
    const img = galleryImages.find(item => item.id === id);
    if (!img) return;
    document.getElementById('lightbox-img').src = img.url;
    document.getElementById('lightbox-title').textContent = img.title;
    document.getElementById('lightbox-desc').textContent = img.description;
    window.openModal('lightbox-modal');
};

window.openModal = (modalId) => {
    const el = document.getElementById(modalId);
    el.classList.remove('hidden');
    el.classList.add('flex');
};

window.closeModal = (modalId) => {
    const el = document.getElementById(modalId);
    el.classList.add('hidden');
    el.classList.remove('flex');
};

window.addEventListener('load', () => {
    if (window.lucide) window.lucide.createIcons();
    bootstrapApp();
});