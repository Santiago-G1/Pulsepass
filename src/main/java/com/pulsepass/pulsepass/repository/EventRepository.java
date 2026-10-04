package com.pulsepass.pulsepass.repository;

import com.pulsepass.pulsepass.domain.Event;
import com.pulsepass.pulsepass.domain.EventStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByEventCode(String eventCode);

    boolean existsByEventCode(String eventCode);

    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    List<Event> findByVenueCode(String venueCode);

    @Query("""
        select distinct event
        from Event event
        join event.artists artist
        where artist.stageName = :stageName
        order by event.eventDate asc
        """)
    List<Event> findByArtistStageName(@Param("stageName") String stageName);

    @Query("""
        select distinct event
        from Event event
        join event.artists artist
        where event.venue.city = :city
          and artist.stageName = :stageName
        order by event.eventDate asc
        """)
    List<Event> findByVenueCityAndArtistStageName(@Param("city") String city,
            @Param("stageName") String stageName);

    @Query("""
        select distinct event
        from Event event
        join event.artists artist
        where event.status = com.pulsepass.pulsepass.domain.EventStatus.PUBLISHED
          and event.eventDate > :fromDate
          and event.venue.city = :city
          and lower(artist.stageName) like lower(concat('%', :artistText, '%'))
        order by event.eventDate asc
        """)
    List<Event> findRecommended(@Param("fromDate") LocalDateTime fromDate,
            @Param("city") String city, @Param("artistText") String artistText);
}
