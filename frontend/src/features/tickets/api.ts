import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { TicketSchema } from '../../lib/contratos'
import { parseResponse, request } from '../../lib/http'

const TicketsSchema = z.array(TicketSchema)

export const obtenerTicket = async (code: string) =>
  parseResponse(
    TicketSchema,
    await request(`/tickets/${encodeURIComponent(code)}`),
  )

export const obtenerMisTickets = async (email: string) =>
  parseResponse(
    TicketsSchema,
    await request(`/tickets/by-user?email=${encodeURIComponent(email)}`),
  )

export const obtenerTicketsPagados = async (eventCode: string) =>
  parseResponse(
    TicketsSchema,
    await request(`/events/${encodeURIComponent(eventCode)}/tickets/paid`),
  )

export interface ComprarTicketInput {
  userEmail: string
  eventCode: string
  type: 'GENERAL' | 'VIP' | 'BACKSTAGE' | 'STUDENT'
}

export const comprarTicket = async (input: ComprarTicketInput) =>
  parseResponse(
    TicketSchema,
    await request('/tickets', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  )

export const cancelarTicket = async (code: string) =>
  parseResponse(
    TicketSchema,
    await request(`/tickets/${encodeURIComponent(code)}/cancel`, {
      method: 'PATCH',
    }),
  )

export const usarTicket = async (code: string) =>
  parseResponse(
    TicketSchema,
    await request(`/tickets/${encodeURIComponent(code)}/use`, {
      method: 'PATCH',
    }),
  )

export const useTicket = (code: string) =>
  useQuery({
    queryKey: ['ticket', code],
    queryFn: () => obtenerTicket(code),
    enabled: Boolean(code),
  })

export const useMisTickets = (email: string) =>
  useQuery({
    queryKey: ['tickets', 'usuario', email],
    queryFn: () => obtenerMisTickets(email),
    enabled: Boolean(email),
  })

export const useTicketsPagados = (eventCode: string) =>
  useQuery({
    queryKey: ['tickets', 'evento', eventCode],
    queryFn: () => obtenerTicketsPagados(eventCode),
    enabled: Boolean(eventCode),
  })

export const useComprarTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: comprarTicket,
    onSuccess: async (ticket) => {
      queryClient.setQueryData(['ticket', ticket.ticketCode], ticket)
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export const useCancelarTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelarTicket,
    onSuccess: async (ticket) => {
      queryClient.setQueryData(['ticket', ticket.ticketCode], ticket)
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export const useUsarTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usarTicket,
    onSuccess: async (ticket) => {
      queryClient.setQueryData(['ticket', ticket.ticketCode], ticket)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['ticket', ticket.ticketCode] }),
      ])
    },
  })
}
