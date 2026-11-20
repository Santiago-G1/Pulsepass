import { http, HttpResponse } from 'msw'
import type {
  Artista,
  Evento,
  Rol,
  Sede,
  Ticket,
  Usuario,
  UsuarioAutenticado,
} from '../lib/contratos'

export const API = 'http://localhost/api'

export const sede: Sede = {
  code: 'VEN-SMR-01',
  name: 'Marina Convention Center',
  city: 'Santa Marta',
  capacity: 3,
  active: true,
}

export const artistas: Artista[] = [
  { id: 1, stageName: 'Solar Beat', active: true, description: 'Electrónica del Caribe.' },
  { id: 2, stageName: 'Neon Waves', active: true },
]

export const eventoPublicado: Evento = {
  eventCode: 'CMF-2026',
  name: 'Caribbean Music Fest 2026',
  description: 'El festival del año.',
  category: 'MUSIC',
  eventDate: '2026-12-12T20:00:00',
  minimumAge: 18,
  status: 'PUBLISHED',
  venueCode: 'VEN-SMR-01',
  venueName: 'Marina Convention Center',
  city: 'Santa Marta',
  sede,
  artists: [artistas[0]!],
}

export const eventoBorrador: Evento = {
  ...eventoPublicado,
  eventCode: 'BOR-2026',
  name: 'Festival en preparación',
  status: 'DRAFT',
  artists: [],
}

export const USUARIOS: Record<Rol, UsuarioAutenticado> = {
  USER: {
    username: 'andrea',
    email: 'andrea@pulsepass.test',
    firstName: 'Andrea',
    lastName: 'Gómez',
    roles: ['USER'],
  },
  STAFF: {
    username: 'laura',
    email: 'laura@pulsepass.test',
    firstName: 'Laura',
    lastName: 'Ríos',
    roles: ['STAFF'],
  },
  ADMIN: {
    username: 'admin',
    email: 'admin@pulsepass.test',
    firstName: 'Admin',
    lastName: 'PulsePass',
    roles: ['ADMIN'],
  },
}

export const andrea: Usuario = {
  username: 'andrea',
  email: 'andrea@pulsepass.test',
  firstName: 'Andrea',
  lastName: 'Gómez',
  birthDate: '1998-02-03',
  active: true,
}

export const ticketPagado: Ticket = {
  ticketCode: 'TKT-ANDREA',
  type: 'VIP',
  price: 250000,
  status: 'PAID',
  purchaseDate: '2026-11-01T10:00:00',
  user: andrea,
  event: eventoPublicado,
}

export const ticketUsado: Ticket = {
  ...ticketPagado,
  ticketCode: 'TKT-USADO',
  type: 'GENERAL',
  price: 120000,
  status: 'USED',
  event: { ...eventoPublicado, eventCode: 'NW-2026', name: 'Neon Night' },
}

export const errorRespuesta = (status: number, message: string, details?: Record<string, string>) =>
  HttpResponse.json(
    {
      timestamp: '2026-11-19T10:00:00',
      status,
      error: status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : status === 409 ? 'Conflict' : 'Bad Request',
      message,
      details,
    },
    { status },
  )

export const handlers = [
  http.get(`${API}/events/published`, () => HttpResponse.json([eventoPublicado])),
  http.get(`${API}/events/CMF-2026`, () => HttpResponse.json(eventoPublicado)),
  http.get(`${API}/artists/active`, () => HttpResponse.json(artistas)),
  http.get(`${API}/venues/active`, () => HttpResponse.json([sede])),
]
