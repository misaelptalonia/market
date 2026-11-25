const STORAGE_KEY = "el-alquimista-content";
const ADMIN_PASSWORD = "alquimista2026";
const genres = ["Poesía", "Relatos Cortos", "Fantasía Oscura", "Sátira"];

const defaultTexts = [
    {
        id: "ceniza-y-luz",
        title: "Ceniza y luz",
        genre: "Poesía",
        content:
            "La noche guarda el oro que el día no supo ver;\n" +
            "en cada brasa duerme una forma de renacer.",
    },
    {
        id: "el-relojero-de-la-niebla",
        title: "El relojero de la niebla",
        genre: "Relatos Cortos",
        content:
            "Cada madrugada, Tomás ajustaba un reloj que nadie más podía oír. " +
            "Cuando la niebla cubría el pueblo, sus agujas devolvían a cada casa " +
            "un minuto perdido.",
    },
    {
        id: "la-puerta-bajo-la-raiz",
        title: "La puerta bajo la raíz",
        genre: "Fantasía Oscura",
        content:
            "Bajo el roble había una puerta sin cerradura. El bosque la protegía " +
            "desde hacía siglos; aquella noche, desde el otro lado, alguien llamó.",
    },
    {
        id: "manual-para-domar-un-eco",
        title: "Manual para domar un eco",
        genre: "Sátira",
        content:
            "El comité aprobó por unanimidad que el eco dejara de repetir sus " +
            "propias decisiones. El eco respondió repitiendo el acta completa.",
    },
];

const defaultImages = [
    {
        id: "laboratorio-de-luna",
        title: "Laboratorio de luna",
        description: "Un gabinete de estudio al filo de la noche.",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80",
    },
    {
        id: "biblioteca-oculta",
        title: "Biblioteca oculta",
        description: "Volúmenes antiguos entre sombras y polvo dorado.",
        url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80",
    },
    {
        id: "bosque-de-tinta",
        title: "Bosque de tinta",
        description: "Un sendero que parece conducir a otro mundo.",
        url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
    },
];

let isAdmin = false;
let activeGenre = "Todos";
let toastTimeout;

function readSavedContent() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.texts) && Array.isArray(saved.images)) {
            return saved;
        }
    } catch (error) {
        console.warn("No se pudo leer el contenido guardado localmente.", error);
    }

    return {
        texts: [...defaultTexts],
        images: [...defaultImages],
    };
}

const content = readSavedContent();

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[character];
    });
}

function saveContent() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
        return true;
    } catch (error) {
        console.error("No se pudo guardar el contenido en este navegador.", error);
        showToast("No se pudo guardar. Puede que el almacenamiento esté lleno.");
        return false;
    }
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderTexts() {
    const container = document.getElementById("literary-container");
    const filteredTexts = content.texts
        .filter((text) => activeGenre === "Todos" || text.genre === activeGenre)
        .sort((first, second) => first.title.localeCompare(second.title, "es"));

    if (filteredTexts.length === 0) {
        container.innerHTML =
            '<p class="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">' +
            "Todavía no hay obras en este género." +
            "</p>";
        return;
    }

    const visibleGenres =
        activeGenre === "Todos"
            ? genres.filter((genre) => filteredTexts.some((text) => text.genre === genre))
            : [activeGenre];

    container.innerHTML = visibleGenres
        .map((genre) => {
            const works = filteredTexts.filter((text) => text.genre === genre);
            return `
                <section aria-label="${escapeHtml(genre)}">
                    <h3 class="mb-5 flex items-center gap-3 font-alchemy text-xl font-bold text-amber-300">
                        <span class="h-px flex-1 bg-slate-800"></span>
                        ${escapeHtml(genre)}
                        <span class="h-px flex-1 bg-slate-800"></span>
                    </h3>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        ${works
                            .map(
                                (text) => `
                                    <article class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-amber-500/40">
                                        <div class="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 class="font-alchemy text-lg font-bold text-amber-100">${escapeHtml(text.title)}</h4>
                                                <p class="mt-2 line-clamp-3 font-literary text-sm leading-relaxed text-slate-400">${escapeHtml(text.content)}</p>
                                            </div>
                                            ${
                                                isAdmin
                                                    ? `<button type="button" onclick="deleteText('${escapeHtml(text.id)}')" aria-label="Eliminar ${escapeHtml(text.title)}" class="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"><i data-lucide="trash-2" class="h-4 w-4"></i></button>`
                                                    : ""
                                            }
                                        </div>
                                        <button type="button" onclick="openReader('${escapeHtml(text.id)}')" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300">
                                            Leer obra <i data-lucide="arrow-up-right" class="h-4 w-4"></i>
                                        </button>
                                    </article>
                                `,
                            )
                            .join("")}
                    </div>
                </section>
            `;
        })
        .join("");

    refreshIcons();
}

function renderGallery() {
    const container = document.getElementById("gallery-grid");
    const images = [...content.images].sort((first, second) =>
        first.title.localeCompare(second.title, "es"),
    );

    container.innerHTML = images.length
        ? images
              .map(
                  (image) => `
                    <article class="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                        <button type="button" onclick="openLightbox('${escapeHtml(image.id)}')" class="block w-full overflow-hidden text-left">
                            <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.title)}" loading="lazy" class="h-64 w-full object-cover transition duration-500 group-hover:scale-105" onerror="this.src='https://placehold.co/800x600/0b0c10/d4af37?text=El+Alquimista'">
                        </button>
                        <div class="flex items-start justify-between gap-3 p-5">
                            <div>
                                <h3 class="font-alchemy text-lg font-bold text-amber-100">${escapeHtml(image.title)}</h3>
                                <p class="mt-2 text-sm leading-relaxed text-slate-400">${escapeHtml(image.description)}</p>
                            </div>
                            ${
                                isAdmin
                                    ? `<button type="button" onclick="deleteImage('${escapeHtml(image.id)}')" aria-label="Eliminar ${escapeHtml(image.title)}" class="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"><i data-lucide="trash-2" class="h-4 w-4"></i></button>`
                                    : ""
                            }
                        </div>
                    </article>
                `,
              )
              .join("")
        : '<p class="col-span-full rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">Todavía no hay imágenes en la galería.</p>';

    refreshIcons();
}

function updateRoleUi() {
    const badge = document.getElementById("role-badge");
    badge.innerHTML = isAdmin
        ? '<i data-lucide="shield-check" class="h-3.5 w-3.5 text-amber-400"></i> Perfil: Administrador'
        : '<i data-lucide="eye" class="h-3.5 w-3.5 text-sky-400"></i> Perfil: Visitante';
    document.getElementById("role-action-btn").textContent = isAdmin
        ? "Cerrar sesión"
        : "Acceso Admin";
    document.getElementById("admin-text-controls").classList.toggle("hidden", !isAdmin);
    document.getElementById("admin-gallery-controls").classList.toggle("hidden", !isAdmin);
    renderTexts();
    renderGallery();
}

function switchView(view) {
    const showGallery = view === "gallery";
    document.getElementById("view-home").classList.toggle("hidden", showGallery);
    document.getElementById("view-home").classList.toggle("block", !showGallery);
    document.getElementById("view-gallery").classList.toggle("hidden", !showGallery);

    document.querySelectorAll(".nav-btn").forEach((button) => {
        const selected = button.id === (showGallery ? "nav-gallery" : "nav-home");
        button.classList.toggle("text-amber-400", selected);
        button.classList.toggle("bg-amber-500/10", selected);
        button.classList.toggle("text-slate-300", !selected);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function filterGenre(genre) {
    activeGenre = genre;
    document.querySelectorAll(".genre-pill").forEach((button) => {
        const selected = button.dataset.genre === genre;
        button.classList.toggle("active", selected);
        button.classList.toggle("bg-amber-500", selected);
        button.classList.toggle("text-slate-950", selected);
        button.classList.toggle("bg-slate-900", !selected);
        button.classList.toggle("text-slate-300", !selected);
    });
    renderTexts();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function toggleRoleModal() {
    if (isAdmin) {
        isAdmin = false;
        updateRoleUi();
        showToast("Sesión de administrador cerrada.");
        return;
    }
    openModal("auth-modal");
}

function handleAdminLogin(event) {
    event.preventDefault();
    const input = document.getElementById("admin-password-input");
    if (input.value !== ADMIN_PASSWORD) {
        showToast("La clave no es correcta.");
        input.focus();
        return;
    }

    isAdmin = true;
    input.value = "";
    closeModal("auth-modal");
    updateRoleUi();
    showToast("Modo administrador activado en esta demostración local.");
}

function openReader(id) {
    const text = content.texts.find((item) => item.id === id);
    if (!text) {
        showToast("No se encontró la obra seleccionada.");
        return;
    }

    document.getElementById("reader-genre").textContent = text.genre;
    document.getElementById("reader-title").textContent = text.title;
    document.getElementById("reader-content").textContent = text.content;
    openModal("reader-modal");
}

function openLightbox(id) {
    const image = content.images.find((item) => item.id === id);
    if (!image) {
        showToast("No se encontró la imagen seleccionada.");
        return;
    }

    const preview = document.getElementById("lightbox-img");
    preview.src = image.url;
    preview.alt = image.title;
    document.getElementById("lightbox-title").textContent = image.title;
    document.getElementById("lightbox-desc").textContent = image.description;
    openModal("lightbox-modal");
}

function handleAddText(event) {
    event.preventDefault();
    if (!isAdmin) {
        showToast("Activa el modo administrador para publicar.");
        return;
    }

    const title = document.getElementById("new-text-title").value.trim();
    const genre = document.getElementById("new-text-genre").value;
    const body = document.getElementById("new-text-body").value.trim();
    if (!title || !body) {
        showToast("Completa el título y el contenido de la obra.");
        return;
    }

    content.texts.push({
        id: `texto-${Date.now()}`,
        title,
        genre,
        content: body,
    });
    if (!saveContent()) return;

    event.currentTarget.reset();
    closeModal("upload-text-modal");
    filterGenre(activeGenre);
    showToast("Obra guardada en este navegador.");
}

function handleAddImage(event) {
    event.preventDefault();
    if (!isAdmin) {
        showToast("Activa el modo administrador para publicar.");
        return;
    }

    const title = document.getElementById("new-img-title").value.trim();
    const description = document.getElementById("new-img-desc").value.trim();
    const file = document.getElementById("new-img-file").files[0];
    const url = document.getElementById("new-img-url").value.trim();

    if (!title || !description || (!file && !url)) {
        showToast("Completa los datos y selecciona un archivo o una URL.");
        return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
        showToast("La imagen debe pesar 2 MB o menos para guardarse localmente.");
        return;
    }

    const addImage = (imageUrl) => {
        content.images.push({
            id: `imagen-${Date.now()}`,
            title,
            description,
            url: imageUrl,
        });
        if (!saveContent()) {
            content.images.pop();
            return;
        }
        event.currentTarget.reset();
        closeModal("upload-image-modal");
        renderGallery();
        showToast("Imagen guardada en este navegador.");
    };

    if (file) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") {
                addImage(reader.result);
            } else {
                showToast("No se pudo leer el archivo seleccionado.");
            }
        });
        reader.addEventListener("error", () => showToast("No se pudo leer el archivo seleccionado."));
        reader.readAsDataURL(file);
    } else {
        addImage(url);
    }
}

function deleteText(id) {
    if (!isAdmin) return;
    const index = content.texts.findIndex((text) => text.id === id);
    if (index < 0) return;
    const [removed] = content.texts.splice(index, 1);
    if (!saveContent()) {
        content.texts.splice(index, 0, removed);
        return;
    }
    renderTexts();
    showToast("Obra eliminada de este navegador.");
}

function deleteImage(id) {
    if (!isAdmin) return;
    const index = content.images.findIndex((image) => image.id === id);
    if (index < 0) return;
    const [removed] = content.images.splice(index, 1);
    if (!saveContent()) {
        content.images.splice(index, 0, removed);
        return;
    }
    renderGallery();
    showToast("Imagen eliminada de este navegador.");
}

function showToast(message) {
    const toast = document.getElementById("toast-notification");
    document.getElementById("toast-message").textContent = message;
    toast.classList.add("toast-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
        toast.classList.remove("toast-visible");
    }, 3200);
}

Object.assign(window, {
    closeModal,
    deleteImage,
    deleteText,
    filterGenre,
    handleAddImage,
    handleAddText,
    handleAdminLogin,
    openLightbox,
    openModal,
    openReader,
    showToast,
    switchView,
    toggleRoleModal,
});

renderTexts();
renderGallery();
refreshIcons();
