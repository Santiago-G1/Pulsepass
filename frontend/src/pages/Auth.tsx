import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { useAuth } from '../auth/contexto'
import { Aviso, Boton, Campo, Tarjeta } from '../componentes/ui'
import { registrarUsuario } from '../features/auth/api'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Ingresa tu usuario o correo.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})
type LoginValues = z.infer<typeof LoginSchema>

const RegistroSchema = z.object({
  username: z.string().trim().min(1, 'Ingresa un nombre de usuario.'),
  email: z.email('Ingresa un correo válido.'),
  firstName: z.string().trim().min(1, 'Ingresa tu nombre.'),
  lastName: z.string().trim().min(1, 'Ingresa tus apellidos.'),
  birthDate: z.string().min(1, 'Ingresa tu fecha de nacimiento.').refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= new Date().toISOString().slice(0, 10),
    'Ingresa una fecha válida que no sea futura.',
  ),
  password: z.string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres.')
    .refine((value) => new TextEncoder().encode(value).length <= 72, 'La contraseña supera el máximo permitido.'),
})
type RegistroValues = z.infer<typeof RegistroSchema>

const MensajeLocationSchema = z.object({ mensaje: z.string().optional() })
const DesdeSchema = z.object({ pathname: z.string().startsWith('/') }).passthrough()

export function Login() {
  const { iniciar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorApi, setErrorApi] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const state = z.object({ desde: z.unknown().optional() }).safeParse(location.state)
  const desdeResult = state.success ? DesdeSchema.safeParse(state.data.desde) : null
  const desde = desdeResult?.success ? desdeResult.data.pathname : RUTAS.inicio
  const aviso = MensajeLocationSchema.safeParse(location.state)

  const enviar = handleSubmit(async (values) => {
    setErrorApi('')
    try {
      await iniciar(values.identifier, values.password)
      navigate(desde, { replace: true })
    } catch (error: unknown) {
      setErrorApi(error instanceof ApiError && error.status === 401
        ? 'Credenciales inválidas.'
        : error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    }
  })

  return (
    <div className="mx-auto grid min-h-[65vh] max-w-5xl items-center gap-8 lg:grid-cols-2">
      <div className="hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-marca-600 to-acento-500 p-10 text-white lg:block">
        <span className="text-5xl" aria-hidden="true">♪</span>
        <h1 className="mt-8 text-4xl font-extrabold">Vuelve a vivirlo.</h1>
        <p className="mt-4 text-lg text-indigo-50">Accede a tus entradas y descubre experiencias que te esperan.</p>
      </div>
      <Tarjeta className="mx-auto w-full max-w-md p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-marca-600">Bienvenido de nuevo</p>
        <h1 className="mt-2 text-3xl font-extrabold">Iniciar sesión</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Ingresa a tu cuenta PulsePass.</p>
        {aviso.success && aviso.data.mensaje && <Aviso tipo="exito">{aviso.data.mensaje}</Aviso>}
        {errorApi && <div className="mt-5"><Aviso>{errorApi}</Aviso></div>}
        <form className="mt-6 grid gap-4" onSubmit={(event) => void enviar(event)}>
          <Campo etiqueta="Usuario o correo" autoComplete="username" {...register('identifier')} error={errors.identifier?.message} />
          <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
          <Boton className="mt-2 w-full" type="submit" cargando={isSubmitting}>Ingresar</Boton>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Aún no tienes cuenta? <Link className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.registro}>Regístrate</Link>
        </p>
      </Tarjeta>
    </div>
  )
}

export function Registro() {
  const navigate = useNavigate()
  const [errorApi, setErrorApi] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistroValues>({
    resolver: zodResolver(RegistroSchema),
  })

  const enviar = handleSubmit(async (values) => {
    setErrorApi('')
    try {
      await registrarUsuario(values)
      navigate(RUTAS.login, {
        replace: true,
        state: { mensaje: 'Tu cuenta fue creada. Inicia sesión para continuar.' },
      })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400) {
        const campos = Object.entries(error.details)
        const noMapeados = campos.map(([campo, mensaje]) => `${campo}: ${mensaje}`).join(' · ')
        setErrorApi(noMapeados || error.message)
      } else if (error instanceof ApiError && error.status === 409) {
        setErrorApi('No fue posible crear la cuenta con estos datos. Verifica si el usuario o correo ya existe.')
      } else {
        setErrorApi(error instanceof Error ? error.message : 'No fue posible crear la cuenta.')
      }
    }
  })

  return (
    <div className="mx-auto max-w-2xl">
      <Tarjeta className="p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Forma parte de PulsePass</p>
        <h1 className="mt-2 text-3xl font-extrabold">Crear cuenta</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Regístrate para comprar y gestionar tus entradas.</p>
        {errorApi && <div className="mt-5"><Aviso>{errorApi}</Aviso></div>}
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void enviar(event)}>
          <Campo etiqueta="Nombre de usuario" autoComplete="username" {...register('username')} error={errors.username?.message} />
          <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Campo etiqueta="Nombres" autoComplete="given-name" {...register('firstName')} error={errors.firstName?.message} />
          <Campo etiqueta="Apellidos" autoComplete="family-name" {...register('lastName')} error={errors.lastName?.message} />
          <Campo etiqueta="Fecha de nacimiento" type="date" {...register('birthDate')} error={errors.birthDate?.message} />
          <Campo etiqueta="Contraseña" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          <p className="text-sm text-slate-500 sm:col-span-2">Usa al menos 12 caracteres. La contraseña se envía al servidor de autenticación y no se almacena en este cliente.</p>
          <Boton className="sm:col-span-2" type="submit" cargando={isSubmitting}>Crear cuenta</Boton>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">¿Ya tienes cuenta? <Link className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.login}>Inicia sesión</Link></p>
      </Tarjeta>
    </div>
  )
}
