import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://cmuhiwgi05.execute-api.eu-north-1.amazonaws.com',
                changeOrigin: true,
                secure: true,
            },
        },
    },
})
