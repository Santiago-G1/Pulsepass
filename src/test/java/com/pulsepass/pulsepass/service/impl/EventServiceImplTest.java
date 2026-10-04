package com.pulsepass.pulsepass.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.pulsepass.domain.Artist;
import com.pulsepass.pulsepass.domain.Event;
import com.pulsepass.pulsepass.domain.EventCategory;
import com.pulsepass.pulsepass.domain.EventStatus;
import com.pulsepass.pulsepass.domain.Venue;
import com.pulsepass.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.pulsepass.dto.response.EventResponse;
import com.pulsepass.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.pulsepass.exception.BusinessRuleException;
import com.pulsepass.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.mapper.EventMapper;
import com.pulsepass.pulsepass.repository.ArtistRepository;
import com.pulsepass.pulsepass.repository.EventRepository;
import com.pulsepass.pulsepass.repository.VenueRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private VenueRepository venueRepository;
    @Mock
    private ArtistRepository artistRepository;
    @Mock
    private EventMapper eventMapper;

    private EventServiceImpl eventService;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(
                eventRepository, venueRepository, artistRepository, eventMapper);
    }

    @Test
    void findByCodeReturnsMappedEvent() {
        Event event = event(EventStatus.DRAFT);
        EventResponse response = response();
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(eventMapper.toResponse(event)).thenReturn(response);

        assertThat(eventService.findByCode("FEST-1")).isSameAs(response);
    }

    @Test
    void findByCodeThrowsWhenMissing() {
        when(eventRepository.findByEventCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.findByCode("MISSING"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("MISSING");
    }

    @Test
    void createPersistsNewDraft() {
        Venue venue = venue(true);
        CreateEventRequest request = request(futureDate(), 0);
        when(eventRepository.existsByEventCode("FEST-1")).thenReturn(false);
        when(venueRepository.findByCode("VEN-1")).thenReturn(Optional.of(venue));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        EventResponse response = response();
        when(eventMapper.toResponse(any(Event.class))).thenReturn(response);

        assertThat(eventService.create(request)).isSameAs(response);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(EventStatus.DRAFT);
        verify(eventMapper).toResponse(any(Event.class));
    }

    @Test
    void createRejectsDuplicateCode() {
        when(eventRepository.existsByEventCode("FEST-1")).thenReturn(true);

        assertThatThrownBy(() -> eventService.create(request(futureDate(), 0)))
                .isInstanceOf(DuplicateResourceException.class);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createRejectsMissingVenue() {
        when(eventRepository.existsByEventCode("FEST-1")).thenReturn(false);
        when(venueRepository.findByCode("VEN-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.create(request(futureDate(), 0)))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createRejectsInactiveVenue() {
        when(eventRepository.existsByEventCode("FEST-1")).thenReturn(false);
        when(venueRepository.findByCode("VEN-1")).thenReturn(Optional.of(venue(false)));

        assertThatThrownBy(() -> eventService.create(request(futureDate(), 0)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createRejectsPastDateAndNegativeAge() {
        when(eventRepository.existsByEventCode("FEST-1")).thenReturn(false);
        when(venueRepository.findByCode("VEN-1")).thenReturn(Optional.of(venue(true)));

        assertThatThrownBy(() -> eventService.create(request(LocalDateTime.now().minusDays(1), 0)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");
        assertThatThrownBy(() -> eventService.create(request(futureDate(), -1)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("age");

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void publishMovesValidDraftToPublished() {
        Event event = event(EventStatus.DRAFT);
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response());

        eventService.publish("FEST-1");

        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).save(event);
    }

    @Test
    void publishRejectsCancelledEventWithoutSaving() {
        when(eventRepository.findByEventCode("FEST-1"))
                .thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        assertThatThrownBy(() -> eventService.publish("FEST-1"))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void publishRejectsPastEventWithoutSaving() {
        Event event = event(EventStatus.DRAFT);
        event.setEventDate(LocalDateTime.now().minusDays(1));
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.publish("FEST-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void publishRejectsInactiveVenueWithoutSaving() {
        Event event = new Event("FEST-1", "Festival", "Description", EventCategory.MUSIC,
                EventStatus.DRAFT, futureDate(), 0, venue(false));
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.publish("FEST-1"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void findPublishedEventsMapsSummaries() {
        Event event = event(EventStatus.PUBLISHED);
        EventSummaryResponse summary = summaryResponse();
        when(eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED))
                .thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        assertThat(eventService.findPublishedEvents()).containsExactly(summary);
    }

    @Test
    void findByArtistMapsSummaries() {
        Event event = event(EventStatus.PUBLISHED);
        EventSummaryResponse summary = summaryResponse();
        when(eventRepository.findByArtistStageName("Solar Beat")).thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        assertThat(eventService.findByArtist("Solar Beat")).containsExactly(summary);
    }

    @Test
    void addArtistRejectsDuplicateAssociation() {
        Event event = event(EventStatus.DRAFT);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        event.addArtist(artist);
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        assertThatThrownBy(() -> eventService.addArtist("FEST-1", 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already");

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void addArtistAssociatesNewArtistAndSaves() {
        Event event = event(EventStatus.DRAFT);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        EventResponse response = response();
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response);

        assertThat(eventService.addArtist("FEST-1", 1L)).isSameAs(response);

        assertThat(event.getArtists()).contains(artist);
        verify(eventRepository).save(event);
    }

    @Test
    void addArtistRejectsCancelledEventWithoutSaving() {
        Event event = event(EventStatus.CANCELLED);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        assertThatThrownBy(() -> eventService.addArtist("FEST-1", 1L))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void addArtistRejectsFinishedEventWithoutSaving() {
        Event event = event(EventStatus.FINISHED);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        when(eventRepository.findByEventCode("FEST-1")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        assertThatThrownBy(() -> eventService.addArtist("FEST-1", 1L))
                .isInstanceOf(BusinessRuleException.class);

        verify(eventRepository, never()).save(any(Event.class));
    }

    private Event event(EventStatus status) {
        return new Event("FEST-1", "Festival", "Description", EventCategory.MUSIC,
                status, futureDate(), 0, venue(true));
    }

    private Venue venue(boolean active) {
        return new Venue("VEN-1", "Venue", "City", "Address", 100, active);
    }

    private CreateEventRequest request(LocalDateTime eventDate, Integer minimumAge) {
        return new CreateEventRequest("FEST-1", "Festival", "Description",
                EventCategory.MUSIC, eventDate, minimumAge, "VEN-1");
    }

    private EventResponse response() {
        return new EventResponse(null, "FEST-1", "Festival", "Description",
                EventCategory.MUSIC, EventStatus.DRAFT, futureDate(), 0,
                "VEN-1", "Venue", java.util.List.of());
    }

    private EventSummaryResponse summaryResponse() {
        return new EventSummaryResponse(null, "FEST-1", "Festival", EventCategory.MUSIC,
                EventStatus.PUBLISHED, futureDate(), "VEN-1", "Venue");
    }

    private LocalDateTime futureDate() {
        return LocalDateTime.now().plusDays(30);
    }
}
