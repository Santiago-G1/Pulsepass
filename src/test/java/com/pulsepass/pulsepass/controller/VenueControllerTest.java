package com.pulsepass.pulsepass.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.pulsepass.dto.response.VenueResponse;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.service.VenueService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(VenueController.class)
class VenueControllerTest {

    private static final VenueResponse VENUE = new VenueResponse(1L, "VEN-SMR-01",
            "Marina Convention Center", "Santa Marta", "Calle 1 #2-34", 3, true);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VenueService venueService;

    @Test
    void existingVenueReturns200() throws Exception {
        when(venueService.findByCode("VEN-SMR-01")).thenReturn(VENUE);

        mockMvc.perform(get("/api/venues/{code}", "VEN-SMR-01"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("VEN-SMR-01"))
                .andExpect(jsonPath("$.name").value("Marina Convention Center"))
                .andExpect(jsonPath("$.capacity").value(3));

        verify(venueService).findByCode("VEN-SMR-01");
    }

    @Test
    void missingVenueReturns404() throws Exception {
        when(venueService.findByCode("VEN-XXX")).thenThrow(
                new ResourceNotFoundException("Venue not found: VEN-XXX"));

        mockMvc.perform(get("/api/venues/{code}", "VEN-XXX"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Venue not found: VEN-XXX"));

        verify(venueService).findByCode("VEN-XXX");
    }

    @Test
    void activeVenuesReturns200() throws Exception {
        when(venueService.findActiveVenues()).thenReturn(List.of(VENUE));

        mockMvc.perform(get("/api/venues/active"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].code").value("VEN-SMR-01"));

        verify(venueService).findActiveVenues();
    }

    @Test
    void unexpectedErrorReturns500() throws Exception {
        when(venueService.findByCode("VEN-SMR-01"))
                .thenThrow(new IllegalStateException("boom"));

        mockMvc.perform(get("/api/venues/{code}", "VEN-SMR-01"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Unexpected error"));
    }
}
