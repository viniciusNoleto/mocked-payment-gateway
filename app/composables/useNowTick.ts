const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

/** Relógio compartilhado, um tique por segundo: contagens regressivas e "há 12 s" andam juntos. */
export function useNowTick() {
  if (!timer && import.meta.client) timer = setInterval(() => (now.value = Date.now()), 1000);
  return readonly(now);
}
