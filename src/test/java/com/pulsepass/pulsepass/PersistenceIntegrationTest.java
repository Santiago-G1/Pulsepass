package com.pulsepass.pulsepass;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import com.pulsepass.pulsepass.repository.ArtistRepository;
import com.pulsepass.pulsepass.repository.EventRepository;
import com.pulsepass.pulsepass.repository.TicketRepository;
import com.pulsepass.pulsepass.repository.UserProfileRepository;
import com.pulsepass.pulsepass.repository.UserRepository;
import com.pulsepass.pulsepass.repository.VenueRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest
@Transactional
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class PersistenceIntegrationTest {

    @Container
    @ServiceConnection
	static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine")
	    .withDatabaseName("pulsepass_test")
	    .withUsername("pulsepass")
	    .withPassword("pulsepass");

    private final VenueRepository venueRepository;
    private final EventRepository eventRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final TicketRepository ticketRepository;
    private final JdbcTemplate jdbcTemplate;

    PersistenceIntegrationTest(VenueRepository venueRepository, EventRepository eventRepository,
	    ArtistRepository artistRepository, UserRepository userRepository,
	    UserProfileRepository userProfileRepository, TicketRepository ticketRepository,
	    JdbcTemplate jdbcTemplate) {
	this.venueRepository = venueRepository;
	this.eventRepository = eventRepository;
	this.artistRepository = artistRepository;
	this.userRepository = userRepository;
	this.userProfileRepository = userProfileRepository;
	this.ticketRepository = ticketRepository;
	this.jdbcTemplate = jdbcTemplate;
    }

    @Test
    void flywayExecutesAllMigrations() {
	List<String> versions = jdbcTemplate.queryForList(
		"select version from flyway_schema_history order by installed_rank", String.class);

	assertThat(versions).containsExactly("1", "2", "3");
	assertThat(jdbcTemplate.queryForObject("select count(*) from artists", Integer.class))
		.isEqualTo(5);
    }

    @Test
    void persistsVenueAndEventsWithQueryMethods() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Carrera 1", 5000, true));
	Event published = event("CMF-2026", "Caribbean Music Fest 2026", venue,
		EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 1, 18, 0));
	published.setStreamingUrl("https://stream.example.com/cmf-2026");
	Event publishedLater = event("CMF-2027", "Caribbean Music Fest 2027", venue,
		EventStatus.PUBLISHED, LocalDateTime.of(2027, 1, 15, 18, 0));
	Event draft = event("CMF-DRAFT", "Caribbean Music Fest Draft", venue,
		EventStatus.DRAFT, LocalDateTime.of(2026, 11, 1, 18, 0));
	Event cancelled = event("CMF-CANCELLED", "Caribbean Music Fest Cancelled", venue,
		EventStatus.CANCELLED, LocalDateTime.of(2026, 10, 1, 18, 0));
	eventRepository.saveAllAndFlush(List.of(published, publishedLater, draft, cancelled));

	assertThat(venueRepository.findByCode("VEN-SMR-01")).contains(venue);
	assertThat(eventRepository.findByEventCode("CMF-2026").orElseThrow().getStreamingUrl())
		.isEqualTo("https://stream.example.com/cmf-2026");
	assertThat(eventRepository.findByVenueCode("VEN-SMR-01"))
		.containsExactlyInAnyOrder(published, publishedLater, draft, cancelled);
	assertThat(eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED))
		.containsExactly(published, publishedLater);
    }

    @Test
    void persistsManyToManyArtistsWithoutDuplicateAssociation() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-ART-01", "Music Hall", "Santa Marta", "Calle 1", 1000, true));
	Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
	Artist neonWaves = artistRepository.findByStageName("Neon Waves").orElseThrow();
	Artist caribbeanSound = artistRepository.findByStageName("Caribbean Sound").orElseThrow();
	Event event = event("ART-2026", "Artist Showcase", venue,
		EventStatus.PUBLISHED, LocalDateTime.of(2026, 10, 1, 20, 0));
	event.addArtist(solarBeat);
	event.addArtist(neonWaves);
	event.addArtist(caribbeanSound);
	event.addArtist(solarBeat);
	eventRepository.saveAndFlush(event);

	assertThat(eventRepository.findByArtistStageName("Solar Beat")).containsExactly(event);
	assertThat(eventRepository.findById(event.getId()).orElseThrow().getArtists()).hasSize(3);
    }

    @Test
    void findsEachEventOncePerArtist() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-ART-02", "Second Music Hall", "Santa Marta", "Calle 11", 1000, true));
	Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
	Event first = event("ART-A", "Solar One", venue, EventStatus.PUBLISHED,
		LocalDateTime.of(2026, 10, 2, 20, 0));
	first.addArtist(solarBeat);
	Event second = event("ART-B", "Solar Two", venue, EventStatus.PUBLISHED,
		LocalDateTime.of(2026, 10, 3, 20, 0));
	second.addArtist(solarBeat);
	eventRepository.saveAllAndFlush(List.of(first, second));

	assertThat(eventRepository.findByArtistStageName("Solar Beat"))
		.containsExactly(first, second);
    }

    @Test
    void persistsUserProfileAndNavigatesUserEmail() {
	User user = userRepository.save(new User("andrea", "andrea@example.com", true));
	UserProfile profile = new UserProfile(
		"Andrea", "Gomez", "3000000000", "Santa Marta", LocalDate.of(1995, 4, 10), user);
	userProfileRepository.saveAndFlush(profile);

	assertThat(userRepository.findByEmailIgnoreCase("ANDREA@EXAMPLE.COM")).contains(user);
	assertThat(userProfileRepository.findByUserEmail("andrea@example.com")).contains(profile);
	assertThat(userRepository.findById(user.getId()).orElseThrow().getProfile()).isEqualTo(profile);
    }

    @Test
    void persistsTicketsAndCountsPaidSales() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-TKT-01", "Ticket Hall", "Santa Marta", "Calle 2", 1000, true));
	Event event = eventRepository.save(event("TKT-2026", "Ticket Event", venue,
		EventStatus.PUBLISHED, LocalDateTime.of(2026, 11, 1, 19, 0)));
	User user = userRepository.save(new User("andrea", "andrea@example.com", true));
	User secondUser = userRepository.save(new User("carlos", "carlos@example.com", true));
	ticketRepository.saveAllAndFlush(List.of(
		ticket("TCK-0001", TicketStatus.PAID, user, event, "250000"),
		ticket("TCK-0002", TicketStatus.PAID, secondUser, event, "120000"),
		ticket("TCK-0003", TicketStatus.RESERVED, user, event, "120000"),
		ticket("TCK-0004", TicketStatus.CANCELLED, secondUser, event, "250000")));

	assertThat(ticketRepository.findByUserEmailAndStatusOrderByPurchaseDateAsc(
		"andrea@example.com", TicketStatus.PAID)).hasSize(1);
	assertThat(ticketRepository.findByUserEmailOrderByPurchaseDateAsc("andrea@example.com"))
		.hasSize(2);
	assertThat(ticketRepository.findByEventEventCodeAndStatus("TKT-2026", TicketStatus.PAID))
		.hasSize(2);
	assertThat(ticketRepository.countByEventEventCodeAndStatus("TKT-2026", TicketStatus.PAID))
		.isEqualTo(2);
	assertThat(ticketRepository.findByEventEventDateAfterOrderByEventEventDateAsc(
		LocalDateTime.of(2026, 1, 1, 0, 0))).hasSize(4);
    }

    @Test
    void findsEventsByCityAndArtist() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-SRC-01", "City Hall", "Santa Marta", "Calle 12", 1000, true));
	Venue otherCity = venueRepository.save(new Venue(
		"VEN-SRC-02", "Other Hall", "Bogota", "Calle 13", 1000, true));
	Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
	Event inCity = event("SRC-A", "In City", venue, EventStatus.PUBLISHED,
		LocalDateTime.of(2026, 10, 4, 20, 0));
	inCity.addArtist(solarBeat);
	Event other = event("SRC-B", "Other City", otherCity, EventStatus.PUBLISHED,
		LocalDateTime.of(2026, 10, 5, 20, 0));
	other.addArtist(solarBeat);
	eventRepository.saveAllAndFlush(List.of(inCity, other));

	assertThat(eventRepository.findByVenueCityAndArtistStageName("Santa Marta", "Solar Beat"))
		.containsExactly(inCity);
    }

    @Test
    void recommendedEventsFilterByDateCityAndArtist() {
	Venue venue = venueRepository.save(new Venue(
		"VEN-REC-01", "Recommendation Hall", "Santa Marta", "Calle 3", 1000, true));
	Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
	Event matching = event("REC-001", "Solar Future", venue, EventStatus.PUBLISHED,
		LocalDateTime.of(2026, 12, 10, 18, 0));
	matching.addArtist(solarBeat);
	Event draft = event("REC-002", "Solar Draft", venue, EventStatus.DRAFT,
		LocalDateTime.of(2026, 12, 11, 18, 0));
	draft.addArtist(solarBeat);
	eventRepository.saveAllAndFlush(List.of(matching, draft));

	assertThat(eventRepository.findRecommended(LocalDateTime.of(2026, 11, 1, 0, 0),
		"Santa Marta", "solar")).containsExactly(matching);
    }

    @Test
    void databaseRejectsDuplicateBusinessCodes() {
	venueRepository.saveAndFlush(new Venue(
		"VEN-DUP-01", "One", "Santa Marta", "Calle 4", 100, true));

	assertThatThrownBy(() -> venueRepository.saveAndFlush(new Venue(
		"VEN-DUP-01", "Two", "Santa Marta", "Calle 5", 100, true)))
		.isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsInvalidCapacity() {
	    assertThatThrownBy(() -> jdbcTemplate.update(
		    "insert into venues (code, name, city, address, capacity, active) values (?, ?, ?, ?, ?, ?)",
		    "VEN-BAD-CAP", "Invalid Venue", "Santa Marta", "Calle 6", 0, true))
		    .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsNegativePrice() {
	    Venue venue = venueRepository.saveAndFlush(new Venue(
		    "VEN-BAD-PRICE", "Price Hall", "Santa Marta", "Calle 7", 100, true));
	    Event event = eventRepository.saveAndFlush(event("BAD-PRICE", "Price Event", venue,
		    EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 20, 18, 0)));
	    User user = userRepository.saveAndFlush(new User("bad-price-user", "bad-price@example.com", true));

	    assertThatThrownBy(() -> jdbcTemplate.update(
		    "insert into tickets (ticket_code, type, price, status, purchase_date, user_id, event_id) "
			    + "values (?, ?, ?, ?, ?, ?, ?)",
		    "TCK-BAD-PRICE", "GENERAL", new BigDecimal("-1.00"), "PAID",
		    LocalDateTime.now(), user.getId(), event.getId()))
		    .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsInvalidEventCatalogValues() {
	    Venue venue = venueRepository.saveAndFlush(new Venue(
		    "VEN-BAD-CATALOG", "Catalog Hall", "Santa Marta", "Calle 8", 100, true));

	    assertThatThrownBy(() -> jdbcTemplate.update(
		    "insert into events (event_code, name, category, status, event_date, minimum_age, venue_id) "
			    + "values (?, ?, ?, ?, ?, ?, ?)",
		    "EVT-BAD-CATALOG", "Invalid Event", "INVALID", "PUBLISHED",
		    LocalDateTime.now(), 18, venue.getId()))
		    .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicateEventCode() {
	    Venue venue = venueRepository.saveAndFlush(new Venue(
		    "VEN-DUP-CODES", "Codes Hall", "Santa Marta", "Calle 9", 100, true));
	    Event event = eventRepository.saveAndFlush(event("EVT-DUP-CODE", "Duplicate Event", venue,
		    EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 21, 18, 0)));

	    assertThatThrownBy(() -> eventRepository.saveAndFlush(event("EVT-DUP-CODE", "Duplicate", venue,
		    EventStatus.DRAFT, LocalDateTime.of(2026, 12, 22, 18, 0))))
		    .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicateTicketCode() {
    	Venue venue = venueRepository.saveAndFlush(new Venue(
    		    "VEN-DUP-TICKETS", "Ticket Codes Hall", "Santa Marta", "Calle 10", 100, true));
    	Event event = eventRepository.saveAndFlush(event("EVT-DUP-TICKETS", "Ticket Event", venue,
    		    EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 23, 18, 0)));
	    User user = userRepository.saveAndFlush(new User("duplicate-ticket-user",
		    "duplicate-ticket@example.com", true));
	    ticketRepository.saveAndFlush(ticket("TCK-DUP-CODE", TicketStatus.PAID, user, event, "100"));

	    assertThatThrownBy(() -> ticketRepository.saveAndFlush(
		    ticket("TCK-DUP-CODE", TicketStatus.PAID, user, event, "100")))
		    .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDuplicateUserProfile() {
	User user = userRepository.saveAndFlush(new User("profile-user", "profile@example.com", true));
	userProfileRepository.saveAndFlush(new UserProfile(
		"First", "Profile", null, "Santa Marta", null, user));

	UserProfile duplicate = new UserProfile(
		"Second", "Profile", null, "Santa Marta", null, user);
	assertThatThrownBy(() -> userProfileRepository.saveAndFlush(duplicate))
		.isInstanceOf(DataIntegrityViolationException.class);
    }

    private Event event(String code, String name, Venue venue, EventStatus status, LocalDateTime date) {
	return new Event(code, name, "PulsePass test event", EventCategory.MUSIC,
		status, date, 18, venue);
    }

    private Ticket ticket(String code, TicketStatus status, User user, Event event, String price) {
	return new Ticket(code, TicketType.GENERAL, new BigDecimal(price), status,
		LocalDateTime.of(2026, 9, 1, 12, 0), user, event);
    }
}