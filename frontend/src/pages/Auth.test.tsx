import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Login, Registro } from '../pages/Auth'
import { API, USUARIOS, errorRespuesta } from '../test/handlers'
import { server } from '../test/server'
import { renderConProveedores } from '../test/utils'

const rutas = [
  { path: '/login', element: <Login /> },
  { path: '/registro', element: <Registro /> },
  { path: '/cuenta', element: <h1>Mi cuenta</h1> },
]

describe('autenticación', () => {
  it('inicia sesión, guarda el token en sessionStorage y vuelve a la ruta de origen', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ accessToken: 'jwt-prueba', tokenType: 'Bearer', expiresIn: 900 }),
      ),
      http.get(`${API}/auth/me`, () => HttpResponse.json(USUARIOS.USER)),
    )
    renderConProveedores(rutas, {
      initialEntries: [{ pathname: '/login', state: { desde: { pathname: '/cuenta' } } }],
    })

    await user.type(await screen.findByLabelText('Usuario o correo'), 'andrea')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto-largo')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem('pulsepass.session')).toContain('jwt-prueba')
    if (window.localStorage) expect(window.localStorage.length).toBe(0)
  })

  it('muestra "Credenciales inválidas" sin revelar la causa ante un 401', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorRespuesta(401, 'Bad credentials'),
      ),
    )
    renderConProveedores(rutas, { initialEntries: ['/login'] })

    await user.type(await screen.findByLabelText('Usuario o correo'), 'andrea')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument()
  })

  it('no llama a la API si el login está vacío', async () => {
    const user = userEvent.setup()
    let peticiones = 0
    server.use(
      http.post(`${API}/auth/login`, () => {
        peticiones += 1
        return HttpResponse.json({})
      }),
    )
    renderConProveedores(rutas, { initialEntries: ['/login'] })

    await user.click(await screen.findByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Ingresa tu usuario o correo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(peticiones).toBe(0)
  })

  it('rechaza un registro con contraseña corta sin llamar a la API', async () => {
    const user = userEvent.setup()
    let peticiones = 0
    server.use(
      http.post(`${API}/users`, () => {
        peticiones += 1
        return HttpResponse.json({})
      }),
    )
    renderConProveedores(rutas, { initialEntries: ['/registro'] })

    await user.type(await screen.findByLabelText('Nombre de usuario'), 'laura')
    await user.type(screen.getByLabelText('Correo electrónico'), 'laura@pulsepass.test')
    await user.type(screen.getByLabelText('Nombres'), 'Laura')
    await user.type(screen.getByLabelText('Apellidos'), 'Ríos')
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '2009-04-12')
    await user.type(screen.getByLabelText('Contraseña'), 'corta-12345')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      await screen.findByText('La contraseña debe tener al menos 12 caracteres.'),
    ).toBeInTheDocument()
    expect(peticiones).toBe(0)
  })

  it('redirige a /login con aviso tras un registro exitoso', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API}/users`, () =>
        HttpResponse.json(
          {
            username: 'andrea',
            email: 'andrea@pulsepass.test',
            firstName: 'Andrea',
            lastName: 'Gómez',
          },
          { status: 201 },
        ),
      ),
    )
    renderConProveedores(rutas, { initialEntries: ['/registro'] })

    await user.type(await screen.findByLabelText('Nombre de usuario'), 'andrea')
    await user.type(screen.getByLabelText('Correo electrónico'), 'andrea@pulsepass.test')
    await user.type(screen.getByLabelText('Nombres'), 'Andrea')
    await user.type(screen.getByLabelText('Apellidos'), 'Gómez')
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '1998-02-03')
    await user.type(screen.getByLabelText('Contraseña'), 'contrasena-larga')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      await screen.findByText(/Tu cuenta fue creada/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('muestra un mensaje genérico ante un correo duplicado (409)', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API}/users`, () =>
        errorRespuesta(409, 'El usuario ya existe con id 42'),
      ),
    )
    renderConProveedores(rutas, { initialEntries: ['/registro'] })

    await user.type(await screen.findByLabelText('Nombre de usuario'), 'andrea')
    await user.type(screen.getByLabelText('Correo electrónico'), 'andrea@pulsepass.test')
    await user.type(screen.getByLabelText('Nombres'), 'Andrea')
    await user.type(screen.getByLabelText('Apellidos'), 'Gómez')
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '1998-02-03')
    await user.type(screen.getByLabelText('Contraseña'), 'contrasena-larga')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(
      'No fue posible crear la cuenta con estos datos. Verifica si el usuario o correo ya existe.',
    )
    expect(aviso).not.toHaveTextContent('id 42')
  })
})
