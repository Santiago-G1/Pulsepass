package com.pulsepass.pulsepass.service.impl;

import com.pulsepass.pulsepass.domain.Event;
import com.pulsepass.pulsepass.domain.EventStatus;
import com.pulsepass.pulsepass.domain.Ticket;
import com.pulsepass.pulsepass.domain.TicketStatus;
import com.pulsepass.pulsepass.domain.TicketType;
import com.pulsepass.pulsepass.domain.User;
import com.pulsepass.pulsepass.domain.UserProfile;
import com.pulsepass.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.pulsepass.dto.response.TicketResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.mapper.TicketMapper;
import com.pulsepass.pulsepass.repository.EventRepository;
import com.pulsepass.pulsepass.repository.TicketRepository;
import com.pulsepass.pulsepass.repository.UserRepository;
import com.pulsepass.pulsepass.service.TicketPricingPolicy;
import com.pulsepass.pulsepass.service.TicketService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketMapper ticketMapper;
    private final TicketPricingPolicy pricingPolicy;

    public TicketServiceImpl(TicketRepository ticketRepository, UserRepository userRepository,
            EventRepository eventRepository, TicketMapper ticketMapper,
            TicketPricingPolicy pricingPolicy) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketMapper = ticketMapper;
        this.pricingPolicy = pricingPolicy;
    }

    @Override
    @Transactional
    public TicketResponse purchase(PurchaseTicketRequest request) {
        if (request == null || request.type() == null) {
            throw new BusinessRuleException("A ticket type is required.");
        }
        User user = userRepository.findByEmailIgnoreCase(request.userEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + request.userEmail()));
        if (!user.isActive()) {
            throw new BusinessRuleException("Inactive users cannot purchase tickets.");
        }
        Event event = eventRepository.findByEventCode(request.eventCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found: " + request.eventCode()));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BusinessRuleException("Tickets can only be purchased for published events.");
        }
        if (event.getEventDate() == null || !event.getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Tickets cannot be purchased for past events.");
        }
        validateMinimumAge(user.getProfile(), event);

        Integer capacity = event.getVenue().getCapacity();
        if (capacity == null || capacity < 1) {
            throw new BusinessRuleException("The event venue has no valid ticket capacity.");
        }
        long paidTickets = ticketRepository.countByEventEventCodeAndStatus(
                event.getEventCode(), TicketStatus.PAID);
        if (paidTickets >= capacity) {
            throw new BusinessRuleException("The event has reached its ticket capacity.");
        }

        BigDecimal price = pricingPolicy.priceFor(request.type());
        if (price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }

        Ticket ticket = new Ticket("TKT-" + UUID.randomUUID().toString().toUpperCase(),
                request.type(), price, TicketStatus.PAID,
                LocalDateTime.now(), user, event);
        Ticket savedTicket = ticketRepository.save(ticket);
        if (paidTickets + 1 == capacity) {
            event.setStatus(EventStatus.SOLD_OUT);
            eventRepository.save(event);
        }
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse findByCode(String ticketCode) {
        return ticketMapper.toResponse(findTicket(ticketCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findByUserEmail(String email) {
        return ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(email).stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findPaidTicketsByEvent(String eventCode) {
        return ticketRepository.findByEventEventCodeAndStatusOrderByPurchaseDateAsc(
                        eventCode, TicketStatus.PAID).stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse cancel(String ticketCode) {
        Ticket ticket = findTicket(ticketCode);
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only paid tickets can be cancelled.");
        }
        if (ticket.getEvent().getEventDate() == null
                || !ticket.getEvent().getEventDate().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("Tickets cannot be cancelled after the event.");
        }
        ticket.setStatus(TicketStatus.CANCELLED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse markAsUsed(String ticketCode) {
        Ticket ticket = findTicket(ticketCode);
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only paid tickets can be marked as used.");
        }
        ticket.setStatus(TicketStatus.USED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    private void validateMinimumAge(UserProfile profile, Event event) {
        int minimumAge = event.getMinimumAge() == null ? 0 : event.getMinimumAge();
        if (minimumAge == 0) {
            return;
        }
        if (profile == null || profile.getBirthDate() == null) {
            throw new BusinessRuleException("User profile birth date is required for this event.");
        }
        int ageAtEvent = Period.between(profile.getBirthDate(),
                event.getEventDate().toLocalDate()).getYears();
        if (ageAtEvent < minimumAge) {
            throw new BusinessRuleException("User does not meet the event minimum age.");
        }
    }

    private Ticket findTicket(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found: " + ticketCode));
    }
}
