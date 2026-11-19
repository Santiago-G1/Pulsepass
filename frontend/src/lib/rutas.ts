export const RUTAS = {
  inicio: '/',
  eventos: '/eventos',
  evento: (code: string) => `/eventos/${encodeURIComponent(code)}`,
  artistas: '/artistas',
  artista: (id: string | number) => `/artistas/${id}`,
  sedes: '/sedes',
  sede: (code: string) => `/sedes/${encodeURIComponent(code)}`,
  login: '/login',
  registro: '/registro',
  cuenta: '/cuenta',
  misTickets: '/mis-tickets',
  ticket: (code: string) => `/mis-tickets/${encodeURIComponent(code)}`,
  confirmacion: (code: string) =>
    `/compra/confirmacion/${encodeURIComponent(code)}`,
  validacionStaff: '/staff/validacion',
  ticketsEvento: (code: string) =>
    `/staff/eventos/${encodeURIComponent(code)}/tickets`,
  adminEventos: '/admin/eventos',
  nuevoEvento: '/admin/eventos/nuevo',
  gestionarEvento: (code: string) =>
    `/admin/eventos/${encodeURIComponent(code)}`,
  sinPermisos: '/403',
  noEncontrada: '/404',
} as const
