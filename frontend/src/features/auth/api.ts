import { z } from 'zod'
import { parseResponse, request } from '../../lib/http'
import {
  UsuarioAutenticadoSchema,
  UsuarioSchema,
  type UsuarioAutenticado,
} from '../../lib/contratos'

const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
})

export interface LoginInput {
  identifier: string
  password: string
}

export interface RegistroInput {
  username: string
  email: string
  firstName: string
  lastName: string
  birthDate: string
  password: string
}

export const iniciarSesion = async (input: LoginInput) =>
  parseResponse(
    LoginResponseSchema,
    await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  )

export const obtenerSesion = async (): Promise<UsuarioAutenticado> =>
  parseResponse(UsuarioAutenticadoSchema, await request('/auth/me'))

export const registrarUsuario = async (input: RegistroInput) =>
  parseResponse(
    UsuarioSchema,
    await request('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  )
