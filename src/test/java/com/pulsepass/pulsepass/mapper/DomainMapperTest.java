package com.pulsepass.pulsepass.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.pulsepass.pulsepass.domain.Artist;
import com.pulsepass.pulsepass.domain.Event;
import com.pulsepass.pulsepass.domain.EventCategory;
import com.pulsepass.pulsepass.domain.EventStatus;
import com.pulsepass.pulsepass.domain.Ticket;
import com.pulsepass.pulsepass.domain.TicketStatus;
import com.pulsepass.pulsepass.domain.TicketType;
import com.pulsepass.pulsepass.domain.User;
import com.pulsepass.pulsepass.domain.UserProfile;
import com.pulsepass.pulsepass.domain.Venue;
import com.pulsepass.pulsepass.dto.response.EventResponse;
import com.pulsepass.pulsepass.dto.response.TicketResponse;
import com.pulsepass.pulsepass.dto.response.UserResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

class DomainMapperTest {

    private final EventMapper eventMapper = Mappers.getMapper(EventMapper.class);
    private final TicketMapper ticketMapper = Mappers.getMapper(TicketMapper.class);
    private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                eventMapper, "artistMapper", Mappers.getMapper(ArtistMapper.class));
    }

    @Test
    void eventMapperConvertsAssociationsIntoResponseData() {
        Venue venue = new Venue("VEN-1", "Hall", "City", "Address", 100, true);
        Event event = new Event("FEST-1", "Festival", "Description",
                EventCategory.MUSIC, EventStatus.PUBLISHED,
                LocalDateTime.of(2027, 1, 1, 18, 0), 18, venue);
        event.addArtist(new Artist("Solar Beat", "Colombia", "Electronic", true));

        EventResponse response = eventMapper.toResponse(event);

        assertThat(response.venueCode()).isEqualTo("VEN-1");
        assertThat(response.venueName()).isEqualTo("Hall");
        assertThat(response.artists()).extracting("stageName").containsExactly("Solar Beat");
    }

    @Test
    void userAndTicketMappersExposeProfileAndRelationshipFields() {
        User user = new User("andrea", "andrea@example.com", true);
        user.assignProfile(new UserProfile("Andrea", "Gomez", "3000000000",
                "Santa Marta", LocalDate.of(2000, 4, 10), user));
        Event event = new Event("FEST-1", "Festival", "Description",
                EventCategory.MUSIC, EventStatus.PUBLISHED,
                LocalDateTime.of(2027, 1, 1, 18, 0), 18,
                new Venue("VEN-1", "Hall", "City", "Address", 100, true));
        Ticket ticket = new Ticket("TKT-1", TicketType.VIP, new BigDecimal("200.00"),
                TicketStatus.PAID, LocalDateTime.of(2026, 10, 1, 10, 0), user, event);

        UserResponse userResponse = userMapper.toResponse(user);
        TicketResponse ticketResponse = ticketMapper.toResponse(ticket);

        assertThat(userResponse.firstName()).isEqualTo("Andrea");
        assertThat(userResponse.birthDate()).isEqualTo(LocalDate.of(2000, 4, 10));
        assertThat(ticketResponse.userEmail()).isEqualTo("andrea@example.com");
        assertThat(ticketResponse.eventCode()).isEqualTo("FEST-1");
        assertThat(ticketResponse.eventName()).isEqualTo("Festival");
    }
}
