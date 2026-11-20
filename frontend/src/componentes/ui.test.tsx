import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { EventoSchema } from '../lib/contratos'
import { TarjetaEvento } from './ui'

describe('TarjetaEvento', () => {
  it('muestra la información accesible y enlaza al detalle del evento', () => {
    const evento = EventoSchema.parse({
      eventCode: 'CMF-2026',
      name: 'Caribbean Music Fest 2026',
      category: 'MUSIC',
      eventDate: '2026-12-12T20:00:00',
      status: 'PUBLISHED',
      city: 'Santa Marta',
    })
    const router = createMemoryRouter(
      [{ path: '/', element: <TarjetaEvento evento={evento} /> }],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByRole('link', { name: /Caribbean Music Fest 2026/i })).toHaveAttribute(
      'href',
      '/eventos/CMF-2026',
    )
    expect(screen.getByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('Santa Marta')).toBeInTheDocument()
  })
})
