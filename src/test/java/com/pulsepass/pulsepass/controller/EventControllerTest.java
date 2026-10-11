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

import com.pulsepass.pulsepass.domain.EventCategory;
import com.pulsepass.pulsepass.domain.EventStatus;
import com.pulsepass.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.pulsepass.dto.response.EventResponse;
import com.pulsepass.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.service.EventService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EventController.class)
class EventControllerTest {

    private static final String CREATE_JSON = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival",
              "category": "MUSIC",
              "eventDate": "2026-12-01T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    private static final LocalDateTime EVENT_DATE = LocalDateTime.of(2026, 12, 1, 20, 0);

    private static final EventResponse EVENT = new EventResponse(1L, "CMF-2026",
            "Caribbean Music Fest 2026", "Festival", EventCategory.MUSIC, EventStatus.DRAFT,
            EVENT_DATE, 18, "VEN-SMR-01", "Marina Convention Center", List.of());

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    @Test
    void createValidReturns201() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(EVENT);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.status").value("DRAFT"));

        verify(eventService).create(any(CreateEventRequest.class));
    }

    @Test
    void createInvalidReturns400AndNeverCallsService() throws Exception {
        String invalidJson = """
                {
                  "name": "No code",
                  "category": "MUSIC",
                  "eventDate": "2026-12-01T20:00:00",
                  "minimumAge": -1,
                  "venueCode": "  "
                }
                """;

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.eventCode").exists())
                .andExpect(jsonPath("$.details.venueCode").exists())
                .andExpect(jsonPath("$.details.minimumAge").exists());

        verify(eventService, never()).create(any());
    }

    @Test
    void findByCodeExistingReturns200() throws Exception {
        when(eventService.findByCode("CMF-2026")).thenReturn(EVENT);

        mockMvc.perform(get("/api/events/{eventCode}", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.venueCode").value("VEN-SMR-01"));

        verify(eventService).findByCode("CMF-2026");
    }

    @Test
    void findByCodeMissingReturns404() throws Exception {
        when(eventService.findByCode("CMF-9999")).thenThrow(
                new ResourceNotFoundException("Event not found: CMF-9999"));

        mockMvc.perform(get("/api/events/{eventCode}", "CMF-9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Event not found: CMF-9999"));
    }

    @Test
    void findPublishedReturns200() throws Exception {
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026",
                "Caribbean Music Fest 2026", EventCategory.MUSIC, EventStatus.PUBLISHED,
                EVENT_DATE, "VEN-SMR-01", "Marina Convention Center");
        when(eventService.findPublishedEvents()).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$[0].status").value("PUBLISHED"));

        verify(eventService).findPublishedEvents();
    }

    @Test
    void publishValidReturns200() throws Exception {
        EventResponse published = new EventResponse(1L, "CMF-2026",
                "Caribbean Music Fest 2026", "Festival", EventCategory.MUSIC, EventStatus.PUBLISHED,
                EVENT_DATE, 18, "VEN-SMR-01", "Marina Convention Center", List.of());
        when(eventService.publish("CMF-2026")).thenReturn(published);

        mockMvc.perform(patch("/api/events/{eventCode}/publish", "CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(eventService).publish("CMF-2026");
    }

    @Test
    void publishInvalidReturns409() throws Exception {
        when(eventService.publish("CMF-2026")).thenThrow(
                new BusinessRuleException("Only draft events can be published."));

        mockMvc.perform(patch("/api/events/{eventCode}/publish", "CMF-2026"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Only draft events can be published."));
    }

    @Test
    void addArtistReturns200() throws Exception {
        when(eventService.addArtist("CMF-2026", 5L)).thenReturn(EVENT);

        mockMvc.perform(post("/api/events/{eventCode}/artists/{artistId}", "CMF-2026", 5L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"));

        verify(eventService).addArtist("CMF-2026", 5L);
    }

    @Test
    void findByArtistReturns200() throws Exception {
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026",
                "Caribbean Music Fest 2026", EventCategory.MUSIC, EventStatus.PUBLISHED,
                EVENT_DATE, "VEN-SMR-01", "Marina Convention Center");
        when(eventService.findByArtist("Solar Beat")).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(eventService).findByArtist("Solar Beat");
    }
}
