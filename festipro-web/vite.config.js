import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            input: {
                
            // Le decimos a Vite dónde viven tus páginas principales
            main: resolve(__dirname, 'index.html'),
            login: resolve(__dirname, 'src/pages/auth/login.html'),
            registro: resolve(__dirname, 'src/pages/auth/registro.html'),
            catalogo: resolve(__dirname, 'src/pages/publico/catalogo/catalogo.html'),
            eventos: resolve(__dirname, 'src/pages/publico/eventos/eventos.html'),
            perfil: resolve(__dirname, 'src/pages/publico/perfil/perfil-talento.html'),

            // Cuando crees las del anfitrión y talento, las agregaremos aquí
            anfitrion: resolve(__dirname, 'src/pages/anfitrion/dashboard.html'),
            talento: resolve(__dirname, 'src/pages/talento/dashboard/dashboard.html'),
            admin: resolve(__dirname, 'src/pages/admin/admin.html'),
            }
        }
    }/*
    
    server: {
        host: '0.0.0.0', // Escucha en toda la red local
        port: 3000       // Puedes cambiar el puerto si lo deseas
    }*/
});