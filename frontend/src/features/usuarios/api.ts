import { useQuery } from '@tanstack/react-query'
import { UsuarioSchema } from '../../lib/contratos'
import { parseResponse, request } from '../../lib/http'

export const obtenerUsuarioPorEmail = async (email: string) =>
  parseResponse(
    UsuarioSchema,
    await request(`/users/by-email?email=${encodeURIComponent(email)}`),
  )

export const obtenerUsuarioPorUsername = async (username: string) =>
  parseResponse(
    UsuarioSchema,
    await request(`/users/by-username?username=${encodeURIComponent(username)}`),
  )

export const useUsuarioPorEmail = (email: string) =>
  useQuery({
    queryKey: ['usuario', 'email', email],
    queryFn: () => obtenerUsuarioPorEmail(email),
    enabled: Boolean(email),
  })

export const useUsuarioPorUsername = (username: string) =>
  useQuery({
    queryKey: ['usuario', 'username', username],
    queryFn: () => obtenerUsuarioPorUsername(username),
    enabled: Boolean(username),
  })
