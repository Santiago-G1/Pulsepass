import type { Evento } from '../../lib/contratos'

const creados: Evento[] = []

export const recordarEventoCreado = (evento: Evento) => {
  const index = creados.findIndex((item) => item.eventCode === evento.eventCode)
  if (index >= 0) creados[index] = evento
  else creados.unshift(evento)
}

export const eventosCreadosEnSesion = () => [...creados]
