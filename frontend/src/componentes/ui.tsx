import clsx from 'clsx'
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import type { EstadoEvento, EstadoTicket, Evento } from '../lib/contratos'
import { formatoFechaCorta } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import { Link } from 'react-router'

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma'

const variantesBoton: Record<VarianteBoton, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700',
  secundario:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma:
    'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  cargando?: boolean
}

export function Boton({
  variante = 'primario',
  cargando = false,
  className,
  disabled,
  children,
  ...props
}: BotonProps) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed disabled:opacity-55',
        variantesBoton[variante],
        className,
      )}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  )
}

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  error?: string
}

export function Campo({ etiqueta, error, id, className, ...props }: CampoProps) {
  const fieldId = id ?? props.name
  const errorId = error && fieldId ? `${fieldId}-error` : undefined
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={fieldId}>
      {etiqueta}
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={clsx(
          'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 placeholder:text-slate-400 focus:border-marca-600 focus:outline-none focus:ring-2 focus:ring-marca-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-red-500 focus:border-red-600',
          className,
        )}
        {...props}
      />
      {error && (
        <span className="text-sm font-normal text-red-600 dark:text-red-400" id={errorId}>
          {error}
        </span>
      )}
    </label>
  )
}

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string
  error?: string
  children: ReactNode
}

export function Selector({
  etiqueta,
  error,
  id,
  className,
  children,
  ...props
}: SelectorProps) {
  const fieldId = id ?? props.name
  const errorId = error && fieldId ? `${fieldId}-error` : undefined
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={fieldId}>
      {etiqueta}
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={clsx(
          'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 focus:border-marca-600 focus:outline-none focus:ring-2 focus:ring-marca-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-sm font-normal text-red-600 dark:text-red-400" id={errorId}>
          {error}
        </span>
      )}
    </label>
  )
}

export function Tarjeta({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

type EstadoBadge = EstadoEvento | EstadoTicket

const etiquetasEstado: Record<EstadoBadge, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  SOLD_OUT: 'Agotado',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
  RESERVED: 'Reservado',
  PAID: 'Pagado',
  USED: 'Usado',
}

const estilosEstado: Record<EstadoBadge, string> = {
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  SOLD_OUT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  FINISHED: 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  RESERVED: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  USED: 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
}

export function Badge({ estado }: { estado: EstadoBadge }) {
  return (
    <span
      className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', estilosEstado[estado])}
    >
      {etiquetasEstado[estado]}
    </span>
  )
}

export function Cargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center gap-3 text-slate-600 dark:text-slate-300" role="status">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-marca-600 border-r-transparent" />
      {mensaje}
    </div>
  )
}

export function EstadoVacio({
  titulo,
  mensaje,
}: {
  titulo: string
  mensaje: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <p className="font-semibold">{titulo}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{mensaje}</p>
    </div>
  )
}

export function EstadoError({
  mensaje,
  onReintentar,
}: {
  mensaje: string
  onReintentar?: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" role="alert">
      <p>{mensaje}</p>
      {onReintentar && (
        <Boton className="mt-3" variante="secundario" onClick={onReintentar}>
          Intentar de nuevo
        </Boton>
      )}
    </div>
  )
}

export function Aviso({
  children,
  tipo = 'error',
}: {
  children: ReactNode
  tipo?: 'error' | 'exito' | 'info'
}) {
  const tonos: Record<NonNullable<typeof tipo>, string> = {
    error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100',
  }
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', tonos[tipo])} role={tipo === 'error' ? 'alert' : 'status'} aria-live="polite">
      {children}
    </div>
  )
}

export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
}: {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCerrar()
    }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <h2 className="text-xl font-bold" id="modal-title">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

const acentosCategoria: Record<Evento['category'], string> = {
  MUSIC: 'from-indigo-600 to-rose-500',
  SPORTS: 'from-emerald-600 to-cyan-500',
  TECHNOLOGY: 'from-blue-700 to-violet-500',
  EDUCATION: 'from-amber-500 to-orange-600',
  CULTURE: 'from-fuchsia-600 to-pink-500',
  ENTERTAINMENT: 'from-violet-600 to-indigo-500',
}

const nombreCategoria: Record<Evento['category'], string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

export function TarjetaEvento({ evento }: { evento: Evento }) {
  const sede = evento.sede ?? evento.venue
  return (
    <Link
      to={RUTAS.evento(evento.eventCode)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={clsx('flex h-36 items-end bg-gradient-to-br p-4 text-white', acentosCategoria[evento.category])}>
        <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
          {nombreCategoria[evento.category]}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold group-hover:text-marca-700 dark:group-hover:text-indigo-300">{evento.name}</h3>
          <Badge estado={evento.status} />
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{formatoFechaCorta(evento.eventDate)}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {sede?.city ?? evento.city ?? sede?.name ?? evento.venueName ?? 'Lugar por confirmar'}
        </p>
      </div>
    </Link>
  )
}
