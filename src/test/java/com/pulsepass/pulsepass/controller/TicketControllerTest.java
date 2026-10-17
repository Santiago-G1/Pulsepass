package com.pulsepass.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.pulsepass.domain.TicketStatus;
import com.pulsepass.pulsepass.domain.TicketType;
import com.pulsepass.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.pulsepass.dto.response.TicketResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.service.TicketService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TicketController.class)
class TicketControllerTest {

    private static final String PURCHASE_JSON = """
            {
              "userEmail": "andrea@example.com",
              "eventCode": "CMF-2026",
              "type": "GENERAL"
            }
            """;

    private static final LocalDateTime PURCHASE_DATE = LocalDateTime.of(2026, 10, 4, 20, 0);

    private static final TicketResponse TICKET = new TicketResponse(1L, "TKT-ABC", TicketType.GENERAL,
            new BigDecimal("100.00"), TicketStatus.PAID, PURCHASE_DATE, "andrea@example.com",
            "CMF-2026", "Caribbean Music Fest 2026");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TicketService ticketService;

    @Test
    void purchaseValidReturns201() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class))).thenReturn(TICKET);

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PURCHASE_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value("TKT-ABC"))
                .andExpect(jsonPath("$.status").value("PAID"));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    @Test
    void purchaseInvalidReturns400AndNeverCallsService() throws Exception {
        String invalidJson = """
                {
                  "userEmail": "not-an-email",
                  "eventCode": "",
                  "type": null
                }
                """;

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.userEmail").exists())
                .andExpect(jsonPath("$.details.eventCode").exists())
                .andExpect(jsonPath("$.details.type").exists());

        verify(ticketService, never()).purchase(any());
    }

    @Test
    void purchaseMissingUserReturns404() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class))).thenThrow(
                new ResourceNotFoundException("User not found: andrea@example.com"));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PURCHASE_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found: andrea@example.com"));
    }

    @Test
    void purchaseBusinessRuleReturns409() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class))).thenThrow(
                new BusinessRuleException("Inactive users cannot purchase tickets."));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PURCHASE_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Inactive users cannot purchase tickets."));
    }

    @Test
    void findByCodeReturns200() throws Exception {
        when(ticketService.findByCode("TKT-ABC")).thenReturn(TICKET);

        mockMvc.perform(get("/api/tickets/{ticketCode}", "TKT-ABC"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value("TKT-ABC"));

        verify(ticketService).findByCode("TKT-ABC");
    }

    @Test
    void findByUserEmailReturns200() throws Exception {
        when(ticketService.findByUserEmail("andrea@example.com")).thenReturn(List.of(TICKET));

        mockMvc.perform(get("/api/tickets/by-user").param("email", "andrea@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].ticketCode").value("TKT-ABC"));

        verify(ticketService).findByUserEmail("andrea@example.com");
    }

    @Test
    void findPaidTicketsByEventReturns200() throws Exception {
        when(ticketService.findPaidTicketsByEvent("CMF-2026")).thenReturn(List.of(TICKET));

        mockMvc.perform(get("/api/events/{eventCode}/tickets/paid", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].status").value("PAID"));

        verify(ticketService).findPaidTicketsByEvent("CMF-2026");
    }

    @Test
    void cancelValidReturns200() throws Exception {
        TicketResponse cancelled = new TicketResponse(1L, "TKT-ABC", TicketType.GENERAL,
                new BigDecimal("100.00"), TicketStatus.CANCELLED, PURCHASE_DATE,
                "andrea@example.com", "CMF-2026", "Caribbean Music Fest 2026");
        when(ticketService.cancel("TKT-ABC")).thenReturn(cancelled);

        mockMvc.perform(patch("/api/tickets/{ticketCode}/cancel", "TKT-ABC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(ticketService).cancel("TKT-ABC");
    }

    @Test
    void cancelInvalidReturns409() throws Exception {
        when(ticketService.cancel("TKT-ABC")).thenThrow(
                new BusinessRuleException("Only paid tickets can be cancelled."));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/cancel", "TKT-ABC"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only paid tickets can be cancelled."));
    }

    @Test
    void markAsUsedValidReturns200() throws Exception {
        TicketResponse used = new TicketResponse(1L, "TKT-ABC", TicketType.GENERAL,
                new BigDecimal("100.00"), TicketStatus.USED, PURCHASE_DATE, "andrea@example.com",
                "CMF-2026", "Caribbean Music Fest 2026");
        when(ticketService.markAsUsed("TKT-ABC")).thenReturn(used);

        mockMvc.perform(patch("/api/tickets/{ticketCode}/use", "TKT-ABC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));

        verify(ticketService).markAsUsed("TKT-ABC");
    }

    @Test
    void markAsUsedInvalidReturns409() throws Exception {
        when(ticketService.markAsUsed("TKT-ABC")).thenThrow(
                new BusinessRuleException("Only paid tickets can be marked as used."));

        mockMvc.perform(patch("/api/tickets/{ticketCode}/use", "TKT-ABC"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only paid tickets can be marked as used."));
    }
}
