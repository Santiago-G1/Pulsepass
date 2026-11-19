import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLocation } from 'react-router'
import { RutaPorRol, RutaProtegida, SoloAnonimo } from './Guardas'
import { autenticar, renderConProveedores } from '../test/utils'

function LoginPrueba() {
  const location = useLocation()
  const state = location.state as { desde?: { pathname?: string } } | null
  return <h1>Login desde {state?.desde?.pathname ?? 'sin origen'}</h1>
}

describe('guardas de ruta', () => {
  it('redirige a un anónimo a /login guardando el origen', async () => {
    renderConProveedores(
      [
        { path: '/login', element: <LoginPrueba /> },
        {
          element: <RutaProtegida />,
          children: [{ path: '/cuenta', element: <h1>Mi cuenta</h1> }],
        },
      ],
      { initialEntries: ['/cuenta'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'Login desde /cuenta' }),
    ).toBeInTheDocument()
  })

  it('envía a un USER que entra a /admin a la página 403', async () => {
    autenticar('USER')
    renderConProveedores(
      [
        { path: '/403', element: <h1>Sin permisos</h1> },
        {
          element: <RutaProtegida />,
          children: [
            {
              element: <RutaPorRol roles={['ADMIN']} />,
              children: [{ path: '/admin', element: <h1>Admin</h1> }],
            },
          ],
        },
      ],
      { initialEntries: ['/admin'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'Sin permisos' }),
    ).toBeInTheDocument()
  })

  it('permite a un ADMIN entrar a /admin', async () => {
    autenticar('ADMIN')
    renderConProveedores(
      [
        {
          element: <RutaProtegida />,
          children: [
            {
              element: <RutaPorRol roles={['ADMIN']} />,
              children: [{ path: '/admin', element: <h1>Admin</h1> }],
            },
          ],
        },
      ],
      { initialEntries: ['/admin'] },
    )

    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument()
  })

  it('permite a un STAFF entrar a las rutas de operación', async () => {
    autenticar('STAFF')
    renderConProveedores(
      [
        {
          element: <RutaProtegida />,
          children: [
            {
              element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
              children: [{ path: '/staff', element: <h1>Validar ingreso</h1> }],
            },
          ],
        },
      ],
      { initialEntries: ['/staff'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'Validar ingreso' }),
    ).toBeInTheDocument()
  })

  it('mantiene a un anónimo en el login y expulsa a un autenticado de SoloAnonimo', async () => {
    renderConProveedores(
      [
        {
          element: <SoloAnonimo />,
          children: [{ path: '/login', element: <h1>Formulario de login</h1> }],
        },
      ],
      { initialEntries: ['/login'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'Formulario de login' }),
    ).toBeInTheDocument()
  })
})
