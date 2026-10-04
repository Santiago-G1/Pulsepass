package com.pulsepass.pulsepass.repository;

import com.pulsepass.pulsepass.domain.Ticket;
import com.pulsepass.pulsepass.domain.TicketStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(String email);

    List<Ticket> findByUserEmailOrderByPurchaseDateAsc(String email);

    List<Ticket> findByUserEmailAndStatusOrderByPurchaseDateAsc(String email, TicketStatus status);

    List<Ticket> findByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    List<Ticket> findByEventEventCodeAndStatusOrderByPurchaseDateAsc(
            String eventCode, TicketStatus status);

    Optional<Ticket> findByTicketCode(String ticketCode);

    long countByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    List<Ticket> findByEventEventDateAfterOrderByEventEventDateAsc(LocalDateTime date);
}
