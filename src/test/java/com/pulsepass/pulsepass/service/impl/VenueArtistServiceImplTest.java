package com.pulsepass.pulsepass.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.pulsepass.pulsepass.domain.Artist;
import com.pulsepass.pulsepass.domain.Venue;
import com.pulsepass.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.pulsepass.dto.response.VenueResponse;
import com.pulsepass.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.pulsepass.mapper.ArtistMapper;
import com.pulsepass.pulsepass.mapper.VenueMapper;
import com.pulsepass.pulsepass.repository.ArtistRepository;
import com.pulsepass.pulsepass.repository.VenueRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VenueArtistServiceImplTest {

    @Mock
    private VenueRepository venueRepository;
    @Mock
    private VenueMapper venueMapper;
    @Mock
    private ArtistRepository artistRepository;
    @Mock
    private ArtistMapper artistMapper;

    @Test
    void venueLookupMapsResultAndMissingVenueIsExplicit() {
        VenueServiceImpl service = new VenueServiceImpl(venueRepository, venueMapper);
        Venue venue = new Venue("VEN-1", "Hall", "City", "Address", 100, true);
        VenueResponse response = new VenueResponse(
                1L, "VEN-1", "Hall", "City", "Address", 100, true);
        when(venueRepository.findByCode("VEN-1")).thenReturn(Optional.of(venue));
        when(venueMapper.toResponse(venue)).thenReturn(response);

        assertThat(service.findByCode("VEN-1")).isSameAs(response);

        when(venueRepository.findByCode("MISSING")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findByCode("MISSING"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void activeVenuesComeFromActiveOnlyQuery() {
        VenueServiceImpl service = new VenueServiceImpl(venueRepository, venueMapper);
        Venue venue = new Venue("VEN-1", "Hall", "City", "Address", 100, true);
        VenueResponse response = new VenueResponse(
                1L, "VEN-1", "Hall", "City", "Address", 100, true);
        when(venueRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(venue));
        when(venueMapper.toResponse(venue)).thenReturn(response);

        assertThat(service.findActiveVenues()).containsExactly(response);
    }

    @Test
    void artistLookupAndActiveArtistListingMapResponses() {
        ArtistServiceImpl service = new ArtistServiceImpl(artistRepository, artistMapper);
        Artist artist = new Artist("Solar Beat", "Colombia", "Electronic", true);
        ArtistResponse response = new ArtistResponse(
                1L, "Solar Beat", "Colombia", "Electronic", true);
        when(artistRepository.findByStageNameIgnoreCase("solar beat"))
                .thenReturn(Optional.of(artist));
        when(artistRepository.findByActiveTrueOrderByStageNameAsc()).thenReturn(List.of(artist));
        when(artistMapper.toResponse(artist)).thenReturn(response);

        assertThat(service.findByStageName("solar beat")).isSameAs(response);
        assertThat(service.findActiveArtists()).containsExactly(response);
    }

    @Test
    void artistLookupRejectsMissingArtist() {
        ArtistServiceImpl service = new ArtistServiceImpl(artistRepository, artistMapper);
        when(artistRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("1");
    }
}
