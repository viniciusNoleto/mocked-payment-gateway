/** URL deste gateway como o navegador a vê: os exemplos da documentação saem prontos para copiar. */
export function useGatewayOrigin() {
  return useRequestURL().origin;
}
