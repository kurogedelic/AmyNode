import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 8834,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});