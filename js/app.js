import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Géneros literarios oficiales de El Alquimista
 */
export const ALLOWED_GENRES = [
    "Poesía",
    "Relatos Cortos",
    "Fantasía Oscura",
    "Sátira"
];

/**
 * Obras iniciales de demostración (se cargan si la base de datos está vacía)
 */
export const SEED_WORKS = [
    {
        title: "Alquimia del Silencio",
        genre: "Poesía",
        content: "En el matraz de la noche destilamos horas,\nbuscando oro en la herrumbre de la memoria.\nNo hay piedra filosofal que cure el olvido,\nsolo versos grabados en plomo encendido."
    },
    {
        title: "Burocracia en el Inframundo",
        genre: "Sátira",
        content: "Caronte exigió tres formularios sellados por triplicado antes de permitir el abordaje en la laguna Estigia. 'Sin copia de su acta de defunción notariada, el tormento eterno deberá esperar hasta el próximo lunes hábil', sentenció el barquero."
    },
    {
        title: "Catedral de Hueso y Azufre",
        genre: "Fantasía Oscura",
        content: "Bajo las agujas de obsidiana de la vieja ciudadela, los escribas ciegos copiaban nombres que nadie debía pronunciar en voz alta. Cada letra escrita consumía un año de luz en el exterior."
    },
    {
        title: "El Relojero de Praga",
        genre: "Relatos Cortos",
        content: "Don Anselmo no reparaba manecillas; ajustaba los minutos que a sus clientes les faltaban para reconciliarse con su pasado. Cobraba únicamente con recuerdos que nadie más quisiera conservar."
    },
    {
        title: "Balada del Cuervo Metálico",
        genre: "Poesía",
        content: "Alas de cobre baten sobre el tejado gris,\nanunciando el invierno de un antiguo país.\nCanta el ave mecánica su eterna canción,\nde engranajes oxidados y frío corazón."
    },
    {
        title: "Manual para Influencers del Apocalipsis",
        genre: "Sátira",
        content: "Paso uno: asegúrate de que el meteorito tenga buena iluminación natural antes de transmitir en vivo. Usa el hashtag #FinDelMundoAesthetic para duplicar tu alcance orgánico."
    }
];

export const SEED_IMAGES = [
    {
        title: "Archivo Arcano",
        url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
        description: "Códices antiguos preservados en la cámara subterránea."
    },
    {
        title: "El Crisol Nocturno",
        url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80",
        description: "Estudio sobre la transmutación de la tinta y el papel."
    },
    {
        title: "Vigilia en la Torre",
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
        description: "Horizonte invernal desde el observatorio del Alquimista."
    }
];

/**
 * Reemplaza este objeto con tus credenciales reales de Firebase Console
 * cuando despliegues en GitHub Pages / Netlify / Vercel.
 */
const MANUAL_FIREBASE_CONFIG = null;

export const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'el-alquimista-app';

export async function initFirebaseService() {
    const config = typeof __firebase_config !== 'undefined'
        ? JSON.parse(__firebase_config)
        : MANUAL_FIREBASE_CONFIG;

    if (!config) {
        return { db: null, auth: null, user: null, isCloudReady: false };
    }

    try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        const db = getFirestore(app);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

        return {
            db,
            auth,
            user: auth.currentUser,
            isCloudReady: Boolean(auth.currentUser)
        };
    } catch (error) {
        console.error("Error inicializando Firebase:", error);
        return { db: null, auth: null, user: null, isCloudReady: false };
    }
}