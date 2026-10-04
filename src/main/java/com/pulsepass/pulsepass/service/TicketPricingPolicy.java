package com.pulsepass.pulsepass.service;

import com.pulsepass.pulsepass.domain.TicketType;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class TicketPricingPolicy {

    private static final Map<TicketType, BigDecimal> PRICES = Map.of(
            TicketType.GENERAL, new BigDecimal("100.00"),
            TicketType.STUDENT, new BigDecimal("80.00"),
            TicketType.VIP, new BigDecimal("200.00"),
            TicketType.BACKSTAGE, new BigDecimal("300.00"));

    public BigDecimal priceFor(TicketType type) {
        if (type == null) {
            throw new IllegalArgumentException("A ticket type is required to calculate its price.");
        }
        BigDecimal price = PRICES.get(type);
        if (price == null) {
            throw new IllegalArgumentException("A ticket type is required to calculate its price.");
        }
        return price;
    }
}
