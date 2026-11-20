import { z } from 'zod'

export const CategoriaSchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
])
export const EstadoEventoSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'SOLD_OUT',
  'CANCELLED',
  'FINISHED',
])
export const TipoTicketSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT'])
export const EstadoTicketSchema = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED'])
export const RolSchema = z.enum(['USER', 'STAFF', 'ADMIN'])

export const SedeSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    city: z.string(),
    capacity: z.number(),
    active: z.boolean(),
  })
  .passthrough()

export const ArtistaSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    stageName: z.string(),
    active: z.boolean().optional(),
    description: z.string().optional(),
    biography: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .passthrough()

export const EventoSchema = z
  .object({
    eventCode: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: CategoriaSchema,
    eventDate: z.string(),
    minimumAge: z.number().optional(),
    status: EstadoEventoSchema,
    venueCode: z.string().optional(),
    venueName: z.string().optional(),
    city: z.string().optional(),
    sede: SedeSchema.optional(),
    venue: SedeSchema.optional(),
    artists: z.array(ArtistaSchema).optional(),
    streamingUrl: z.string().nullable().optional(),
  })
  .passthrough()

export const UsuarioSchema = z
  .object({
    username: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    birthDate: z.string().optional(),
    active: z.boolean().optional(),
  })
  .passthrough()

export const UsuarioAutenticadoSchema = z
  .object({
    identificador: z.union([z.number(), z.string()]).optional(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roles: z.array(RolSchema).min(1),
  })
  .passthrough()

export const TicketSchema = z
  .object({
    ticketCode: z.string(),
    type: TipoTicketSchema,
    price: z.union([z.number(), z.string()]),
    status: EstadoTicketSchema,
    purchaseDate: z.string().optional(),
    user: UsuarioSchema.optional(),
    usuario: UsuarioSchema.optional(),
    event: EventoSchema.optional(),
    evento: EventoSchema.optional(),
  })
  .passthrough()

export type Categoria = z.infer<typeof CategoriaSchema>
export type EstadoEvento = z.infer<typeof EstadoEventoSchema>
export type EstadoTicket = z.infer<typeof EstadoTicketSchema>
export type TipoTicket = z.infer<typeof TipoTicketSchema>
export type Rol = z.infer<typeof RolSchema>
export type Sede = z.infer<typeof SedeSchema>
export type Artista = z.infer<typeof ArtistaSchema>
export type Evento = z.infer<typeof EventoSchema>
export type Usuario = z.infer<typeof UsuarioSchema>
export type UsuarioAutenticado = z.infer<typeof UsuarioAutenticadoSchema>
export type Ticket = z.infer<typeof TicketSchema>

export const CATEGORIAS: Record<Categoria, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}
