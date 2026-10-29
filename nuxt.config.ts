import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },

  modules: ['shadcn-nuxt'],

  css: ['~/assets/css/main.css', 'vue-sonner/style.css'],

  // O painel guarda a API key no navegador: renderizar no servidor não ajuda e só gera divergência de hidratação.
  ssr: false,

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Mocked Payment Gateway',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap' },
      ],
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  runtimeConfig: {
    // Central aberta (/api/central/* e o painel): vê e gerencia todos os clientes, sem login. Desligue fora de ambientes de teste.
    centralEnabled: true,
    // URL pública do gateway, usada na URL de location embutida no BR Code.
    publicBaseUrl: 'http://localhost:3000',
    // Worker em processo: entrega de webhooks, expiração, auto-pagamento e devoluções.
    workerEnabled: true,
    workerIntervalMs: 1000,
    webhookTimeoutMs: 5000,
    // Segundos entre retentativas de webhook. A primeira entrega é imediata.
    webhookRetrySchedule: '10,30,60,300,900,1800,3600,7200,14400,28800',
  },

  typescript: {
    strict: true,
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@tanstack/vue-query'],
    },
  },
});
