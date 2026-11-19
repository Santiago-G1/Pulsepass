import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ArtistaSchema,
  EventoSchema,
  SedeSchema,
  type Evento,
} from '../../lib/contratos'
import { parseResponse, request } from '../../lib/http'

const EventosSchema = z.array(EventoSchema)
const ArtistasSchema = z.array(ArtistaSchema)
const SedesSchema = z.array(SedeSchema)

export const clavesEventos = {
  todos: ['eventos'] as const,
  publicados: ['eventos', 'publicados'] as const,
  detalle: (code: string) => ['evento', code] as const,
  porArtista: (stageName: string) => ['eventos', 'artista', stageName] as const,
  artistas: ['artistas', 'activos'] as const,
  artista: (id: string) => ['artista', id] as const,
  artistaPorNombre: (name: string) => ['artista', 'nombre', name] as const,
  sedes: ['sedes', 'activas'] as const,
  sede: (code: string) => ['sede', code] as const,
}

export const obtenerEventosPublicados = async () =>
  parseResponse(EventosSchema, await request('/events/published'))

export const obtenerEvento = async (code: string) =>
  parseResponse(
    EventoSchema,
    await request(`/events/${encodeURIComponent(code)}`),
  )

export const obtenerEventosPorArtista = async (stageName: string) =>
  parseResponse(
    EventosSchema,
    await request(`/events/by-artist?stageName=${encodeURIComponent(stageName)}`),
  )

export const obtenerArtistasActivos = async () =>
  parseResponse(ArtistasSchema, await request('/artists/active'))

export const obtenerArtista = async (id: string) =>
  parseResponse(ArtistaSchema, await request(`/artists/${encodeURIComponent(id)}`))

export const obtenerArtistaPorNombre = async (stageName: string) =>
  parseResponse(
    ArtistaSchema,
    await request(`/artists/by-stage-name?stageName=${encodeURIComponent(stageName)}`),
  )

export const obtenerSedesActivas = async () =>
  parseResponse(SedesSchema, await request('/venues/active'))

export const obtenerSede = async (code: string) =>
  parseResponse(SedeSchema, await request(`/venues/${encodeURIComponent(code)}`))

export interface CrearEventoInput {
  eventCode: string
  name: string
  description: string
  category: Evento['category']
  eventDate: string
  minimumAge: number
  venueCode: string
}

export const crearEvento = async (input: CrearEventoInput) =>
  parseResponse(EventoSchema, await request('/events', {
    method: 'POST',
    body: JSON.stringify(input),
  }))

export const publicarEvento = async (code: string) =>
  parseResponse(
    EventoSchema,
    await request(`/events/${encodeURIComponent(code)}/publish`, {
      method: 'PATCH',
    }),
  )

export const asociarArtista = async (eventCode: string, artistId: string | number) =>
  parseResponse(
    EventoSchema,
    await request(
      `/events/${encodeURIComponent(eventCode)}/artists/${encodeURIComponent(String(artistId))}`,
      { method: 'POST' },
    ),
  )

export const useEventosPublicados = () =>
  useQuery({ queryKey: clavesEventos.publicados, queryFn: obtenerEventosPublicados })

export const useEvento = (code: string) =>
  useQuery({
    queryKey: clavesEventos.detalle(code),
    queryFn: () => obtenerEvento(code),
    enabled: Boolean(code),
  })

export const useEventosPorArtista = (stageName: string) =>
  useQuery({
    queryKey: clavesEventos.porArtista(stageName),
    queryFn: () => obtenerEventosPorArtista(stageName),
    enabled: Boolean(stageName),
  })

export const useArtistasActivos = () =>
  useQuery({ queryKey: clavesEventos.artistas, queryFn: obtenerArtistasActivos })

export const useArtista = (id: string) =>
  useQuery({
    queryKey: clavesEventos.artista(id),
    queryFn: () => obtenerArtista(id),
    enabled: /^\d+$/.test(id),
  })

export const useArtistaPorNombre = (stageName: string) =>
  useQuery({
    queryKey: clavesEventos.artistaPorNombre(stageName),
    queryFn: () => obtenerArtistaPorNombre(stageName),
    enabled: Boolean(stageName),
  })

export const useSedesActivas = () =>
  useQuery({ queryKey: clavesEventos.sedes, queryFn: obtenerSedesActivas })

export const useSede = (code: string) =>
  useQuery({
    queryKey: clavesEventos.sede(code),
    queryFn: () => obtenerSede(code),
    enabled: Boolean(code),
  })

export const useCrearEvento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearEvento,
    onSuccess: async (event) => {
      queryClient.setQueryData(clavesEventos.detalle(event.eventCode), event)
      await queryClient.invalidateQueries({ queryKey: clavesEventos.todos })
    },
  })
}

export const usePublicarEvento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: publicarEvento,
    onSuccess: async (event) => {
      queryClient.setQueryData(clavesEventos.detalle(event.eventCode), event)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clavesEventos.publicados }),
        queryClient.invalidateQueries({ queryKey: clavesEventos.todos }),
      ])
    },
  })
}

export const useAsociarArtista = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventCode,
      artistId,
    }: {
      eventCode: string
      artistId: string | number
    }) => asociarArtista(eventCode, artistId),
    onSuccess: async (event) => {
      queryClient.setQueryData(clavesEventos.detalle(event.eventCode), event)
    },
  })
}
