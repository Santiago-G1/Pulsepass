package com.pulsepass.pulsepass.repository;

import com.pulsepass.pulsepass.domain.Artist;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Optional<Artist> findByStageName(String stageName);
}
