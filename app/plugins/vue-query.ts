import { QueryClient, VueQueryPlugin, dehydrate, hydrate, type DehydratedState, type VueQueryPluginOptions } from '@tanstack/vue-query';

export default defineNuxtPlugin((nuxtApp) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query');

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 5000 },
    },
  });

  const options: VueQueryPluginOptions = { queryClient };

  nuxtApp.vueApp.use(VueQueryPlugin, options);

  if (import.meta.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client) {
    nuxtApp.hooks.hook('app:created', () => {
      if (vueQueryState.value) hydrate(queryClient, vueQueryState.value);
    });
  }
});
