import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { ApiError, clearTokenSession, request, saveTokenSession } from './http'

describe('cliente HTTP PulsePass', () => {
  afterEach(() => clearTokenSession())

  it('envía el token solo en Authorization', async () => {
    saveTokenSession({
      accessToken: 'test-token',
      expiresAt: Date.now() + 60_000,
    })
    server.use(
      http.get('http://localhost/api/private', ({ request: req }) => {
        expect(req.headers.get('authorization')).toBe('Bearer test-token')
        expect(new URL(req.url).search).toBe('')
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(request('/private')).resolves.toEqual({ ok: true })
  })

  it('convierte ErrorResponse en ApiError tipado', async () => {
    server.use(
      http.post('http://localhost/api/tickets', () =>
        HttpResponse.json(
          {
            timestamp: '2026-01-01T12:00:00',
            status: 409,
            error: 'Conflict',
            message: 'El evento está agotado.',
            details: { eventCode: 'No hay disponibilidad.' },
          },
          { status: 409 },
        ),
      ),
    )

    try {
      await request('/tickets', { method: 'POST', body: '{}' })
      throw new Error('Se esperaba ApiError.')
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({
        status: 409,
        message: 'El evento está agotado.',
        details: { eventCode: 'No hay disponibilidad.' },
      })
    }
  })

  it('usa mensaje seguro cuando el cuerpo de error no cumple el contrato', async () => {
    server.use(
      http.get('http://localhost/api/broken', () =>
        HttpResponse.json({ secret: 'no mostrar' }, { status: 500 }),
      ),
    )

    await expect(request('/broken')).rejects.toMatchObject({
      status: 500,
      message: 'No fue posible completar la solicitud.',
    })
  })
})
