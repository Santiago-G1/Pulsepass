import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Layout } from './Layout'
import { autenticar, renderConProveedores } from '../test/utils'

const montarLayout = () =>
  renderConProveedores([
    { path: '/', element: <Layout />, children: [{ index: true, element: <h1>Inicio</h1> }] },
  ])

describe('navbar por rol', () => {
  it('muestra Ingresar y Registrarse a un visitante anónimo', async () => {
    montarLayout()

    expect(await screen.findByRole('link', { name: 'Ingresar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrarse' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mis tickets' })).not.toBeInTheDocument()
  })

  it('muestra Mis tickets a un USER y Administrar eventos a un ADMIN', async () => {
    autenticar('USER')
    const { unmount } = montarLayout()
    expect(await screen.findByRole('link', { name: 'Mis tickets' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Administrar eventos' })).not.toBeInTheDocument()
    unmount()

    autenticar('ADMIN')
    montarLayout()
    expect(await screen.findByRole('link', { name: 'Administrar eventos' })).toBeInTheDocument()
  })
})
