/** Eventos do canal em tempo real (`GET /api/events`). Os nomes seguem os do webhook, mais `charge.created`. */
export enum ERealtimeEvent {
  CHARGE_CREATED = 'charge.created',
  CHARGE_PAID = 'charge.paid',
  CHARGE_EXPIRED = 'charge.expired',
  CHARGE_CANCELLED = 'charge.cancelled',
  PIX_RECEIVED = 'pix.received',
}
