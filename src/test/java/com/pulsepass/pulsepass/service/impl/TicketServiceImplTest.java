package com.pulsepass.pulsepass.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.pulsepass.domain.Event;
import com.pulsepass.pulsepass.domain.EventCategory;
import com.pulsepass.pulsepass.domain.EventStatus;
import com.pulsepass.pulsepass.domain.Ticket;
import com.pulsepass.pulsepass.domain.TicketStatus;
import com.pulsepass.pulsepass.domain.TicketType;
import com.pulsepass.pulsepass.domain.User;
import com.pulsepass.pulsepass.domain.UserProfile;
import com.pulsepass.pulsepass.domain.Venue;
import com.pulsepass.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.pulsepass.dto.response.TicketResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.mapper.TicketMapper;
import com.pulsepass.pulsepass.repository.EventRepository;
import com.pulsepass.pulsepass.repository.TicketRepository;
import com.pulsepass.pulsepass.repository.UserRepository;
import com.pulsepass.pulsepass.service.TicketPricingPolicy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private TicketMapper ticketMapper;

    private TicketServiceImpl ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new TicketServiceImpl(ticketRepository, userRepository,
                eventRepository, ticketMapper, new TicketPricingPolicy());
    }

    @Test
    void purchaseCreatesPaidTicketAndMarksEventSoldOutAtCapacity() {
        User user = user(true, LocalDate.now().minusYears(25));
        Event event = event(EventStatus.PUBLISHED, 3, 18);
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(ticketRepository.countByEventEventCodeAndStatus("FEST-1", TicketStatus.PAID))
                .thenReturn(2L);
        when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(eventRepository.save(event)).thenReturn(event);
        TicketResponse response = response(TicketStatus.PAID);
        when(ticketMapper.toResponse(any(Ticket.class))).thenReturn(response);

        assertThat(ticketService.purchase(request(TicketType.VIP))).isSameAs(response);

        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(captor.getValue().getPrice()).isEqualByComparingTo("200.00");
        assertThat(captor.getValue().getTicketCode()).startsWith("TKT-");
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);
        verify(eventRepository).save(event);
    }

    @Test
    void purchaseRejectsMissingUser() {
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("andrea@example.com");

        verify(eventRepository, never()).findByEventCode(any());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void purchaseRejectsInactiveUser() {
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user(false, LocalDate.now().minusYears(25))));

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Inactive");

        verify(eventRepository, never()).findByEventCode(any());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void purchaseRejectsUnpublishedEvent() {
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user(true, LocalDate.now().minusYears(25))));
        when(eventRepository.findByEventCode("FEST-1"))
                .thenReturn(Optional.of(event(EventStatus.DRAFT, 3, 0)));

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("published");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void purchaseRejectsCancelledEvent() {
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user(true, LocalDate.now().minusYears(25))));
        when(eventRepository.findByEventCode("FEST-1"))
                .thenReturn(Optional.of(event(EventStatus.CANCELLED, 3, 0)));

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

        @Test
        void purchaseRejectsPastEvent() {
                User user = user(true, LocalDate.now().minusYears(25));
                Event event = event(EventStatus.PUBLISHED, 3, 0);
                event.setEventDate(LocalDateTime.now().minusDays(1));
                when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                                .thenReturn(Optional.of(user));
                when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));

                assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                                .isInstanceOf(BusinessRuleException.class)
                                .hasMessageContaining("past events");

                verify(ticketRepository, never()).countByEventEventCodeAndStatus(any(), any());
                verify(ticketRepository, never()).save(any(Ticket.class));
        }

    @Test
    void purchaseRejectsUserWhoWillNotMeetMinimumAgeOnEventDate() {
        User user = user(true, LocalDate.of(2009, 10, 10));
        Event event = event(EventStatus.PUBLISHED, 3, 18);
        event.setEventDate(LocalDateTime.of(2026, 11, 1, 18, 0));
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("minimum age");

        verify(ticketRepository, never()).countByEventEventCodeAndStatus(any(), any());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void purchaseRejectsFullVenue() {
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user(true, LocalDate.now().minusYears(25))));
        when(eventRepository.findByEventCode("FEST-1"))
                .thenReturn(Optional.of(event(EventStatus.PUBLISHED, 3, 0)));
        when(ticketRepository.countByEventEventCodeAndStatus("FEST-1", TicketStatus.PAID))
                .thenReturn(3L);

        assertThatThrownBy(() -> ticketService.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("capacity");

        verify(ticketRepository, never()).save(any(Ticket.class));
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void purchaseRejectsNegativePrice() {
        User user = user(true, LocalDate.now().minusYears(25));
        Event event = event(EventStatus.PUBLISHED, 3, 0);
        when(userRepository.findByEmailIgnoreCase("andrea@example.com"))
                .thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(ticketRepository.countByEventEventCodeAndStatus("FEST-1", TicketStatus.PAID))
                .thenReturn(0L);
        TicketPricingPolicy policy = mock(TicketPricingPolicy.class);
        when(policy.priceFor(TicketType.GENERAL)).thenReturn(new BigDecimal("-1.00"));
        TicketServiceImpl service = new TicketServiceImpl(ticketRepository, userRepository,
                eventRepository, ticketMapper, policy);

        assertThatThrownBy(() -> service.purchase(request(TicketType.GENERAL)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("negative");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void cancelMovesPaidTicketToCancelled() {
        Ticket ticket = ticket(TicketStatus.PAID, futureDate());
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(response(TicketStatus.CANCELLED));

        assertThat(ticketService.cancel("TKT-1").status()).isEqualTo(TicketStatus.CANCELLED);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
    }

    @Test
    void cancelRejectsUsedTicket() {
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.USED, futureDate())));

        assertThatThrownBy(() -> ticketService.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

        @Test
        void cancelRejectsAlreadyCancelledTicket() {
                when(ticketRepository.findByTicketCode("TKT-1"))
                                .thenReturn(Optional.of(ticket(TicketStatus.CANCELLED, futureDate())));

                assertThatThrownBy(() -> ticketService.cancel("TKT-1"))
                                .isInstanceOf(BusinessRuleException.class);

                verify(ticketRepository, never()).save(any(Ticket.class));
        }

    @Test
    void cancelRejectsTicketAfterEventDate() {
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.PAID, LocalDateTime.now().minusDays(1))));

        assertThatThrownBy(() -> ticketService.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("after the event");

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void markAsUsedMovesPaidTicketToUsed() {
        Ticket ticket = ticket(TicketStatus.PAID, futureDate());
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketMapper.toResponse(ticket)).thenReturn(response(TicketStatus.USED));

        assertThat(ticketService.markAsUsed("TKT-1").status()).isEqualTo(TicketStatus.USED);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.USED);
    }

    @Test
    void markAsUsedRejectsCancelledTicket() {
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.CANCELLED, futureDate())));

        assertThatThrownBy(() -> ticketService.markAsUsed("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

        @Test
        void findByCodeMapsTicket() {
                Ticket ticket = ticket(TicketStatus.PAID, futureDate());
                TicketResponse response = response(TicketStatus.PAID);
                when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(ticket));
                when(ticketMapper.toResponse(ticket)).thenReturn(response);

                assertThat(ticketService.findByCode("TKT-1")).isSameAs(response);
        }

        @Test
        void findByCodeRejectsMissingTicket() {
                when(ticketRepository.findByTicketCode("MISSING")).thenReturn(Optional.empty());

                assertThatThrownBy(() -> ticketService.findByCode("MISSING"))
                                .isInstanceOf(ResourceNotFoundException.class)
                                .hasMessageContaining("MISSING");
        }

        @Test
        void findByUserEmailMapsTickets() {
                Ticket ticket = ticket(TicketStatus.PAID, futureDate());
                TicketResponse response = response(TicketStatus.PAID);
                when(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(
                                "andrea@example.com")).thenReturn(java.util.List.of(ticket));
                when(ticketMapper.toResponse(ticket)).thenReturn(response);

                assertThat(ticketService.findByUserEmail("andrea@example.com"))
                                .containsExactly(response);
        }

        @Test
        void findPaidTicketsByEventMapsTickets() {
                Ticket ticket = ticket(TicketStatus.PAID, futureDate());
                TicketResponse response = response(TicketStatus.PAID);
                when(ticketRepository.findByEventEventCodeAndStatusOrderByPurchaseDateAsc(
                                "FEST-1", TicketStatus.PAID)).thenReturn(java.util.List.of(ticket));
                when(ticketMapper.toResponse(ticket)).thenReturn(response);

                assertThat(ticketService.findPaidTicketsByEvent("FEST-1"))
                                .containsExactly(response);
        }

    private PurchaseTicketRequest request(TicketType type) {
        return new PurchaseTicketRequest("andrea@example.com", "FEST-1", type);
    }

    private User user(boolean active, LocalDate birthDate) {
        User user = new User("andrea", "andrea@example.com", active);
        user.assignProfile(new UserProfile("Andrea", "Gomez", "3000000000",
                "Santa Marta", birthDate, user));
        return user;
    }

    private Event event(EventStatus status, int capacity, int minimumAge) {
        return new Event("FEST-1", "Festival", "Description", EventCategory.MUSIC,
                status, futureDate(), minimumAge,
                new Venue("VEN-1", "Venue", "City", "Address", capacity, true));
    }

    private Ticket ticket(TicketStatus status, LocalDateTime eventDate) {
        Event event = event(EventStatus.PUBLISHED, 10, 0);
        event.setEventDate(eventDate);
        return new Ticket("TKT-1", TicketType.GENERAL, new BigDecimal("100.00"), status,
                LocalDateTime.now(), user(true, LocalDate.now().minusYears(25)),
                event);
    }

    private TicketResponse response(TicketStatus status) {
        return new TicketResponse(1L, "TKT-1", TicketType.GENERAL,
                new BigDecimal("100.00"), status, LocalDateTime.now(),
                "andrea@example.com", "FEST-1", "Festival");
    }

    private LocalDateTime futureDate() {
        return LocalDateTime.now().plusDays(30);
    }
}
