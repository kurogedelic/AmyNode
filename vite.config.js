import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/AmyNode/' : '/',
    server: {
        port: 8834,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});