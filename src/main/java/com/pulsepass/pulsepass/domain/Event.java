package com.pulsepass.pulsepass.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_code")
    private String eventCode;
    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private EventCategory category;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    @Column(name = "event_date")
    private LocalDateTime eventDate;

    @Column(name = "minimum_age")
    private Integer minimumAge;

    @Column(name = "streaming_url")
    private String streamingUrl;

    @ManyToOne(optional = false)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @ManyToMany
    @JoinTable(name = "event_artists",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id"))
    private Set<Artist> artists = new HashSet<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ticket> tickets = new ArrayList<>();

    protected Event() {
    }

    public Event(String eventCode, String name, String description, EventCategory category,
            EventStatus status, LocalDateTime eventDate, Integer minimumAge, Venue venue) {
        this.eventCode = eventCode;
        this.name = name;
        this.description = description;
        this.category = category;
        this.status = status;
        this.eventDate = eventDate;
        this.minimumAge = minimumAge;
        setVenue(venue);
    }

    public void addArtist(Artist artist) {
        if (artists.add(artist)) {
            artist.getEvents().add(this);
        }
    }

    public void setVenue(Venue venue) {
        this.venue = venue;
        if (venue != null && !venue.getEvents().contains(this)) {
            venue.getEvents().add(this);
        }
    }

    public Long getId() { return id; }
    public String getEventCode() { return eventCode; }
    public void setEventCode(String eventCode) { this.eventCode = eventCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public EventCategory getCategory() { return category; }
    public void setCategory(EventCategory category) { this.category = category; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }
    public Integer getMinimumAge() { return minimumAge; }
    public void setMinimumAge(Integer minimumAge) { this.minimumAge = minimumAge; }
    public String getStreamingUrl() { return streamingUrl; }
    public void setStreamingUrl(String streamingUrl) { this.streamingUrl = streamingUrl; }
    public Venue getVenue() { return venue; }
    public Set<Artist> getArtists() { return artists; }
    public List<Ticket> getTickets() { return tickets; }
}
