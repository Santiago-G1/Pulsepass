package com.pulsepass.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.pulsepass.domain.TicketType;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class TicketPricingPolicyTest {

    private final TicketPricingPolicy pricingPolicy = new TicketPricingPolicy();

    @Test
    void appliesTheConfiguredPriceForEachTicketType() {
        assertThat(pricingPolicy.priceFor(TicketType.GENERAL))
                .isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(pricingPolicy.priceFor(TicketType.STUDENT))
                .isEqualByComparingTo(new BigDecimal("80.00"));
        assertThat(pricingPolicy.priceFor(TicketType.VIP))
                .isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(pricingPolicy.priceFor(TicketType.BACKSTAGE))
                .isEqualByComparingTo(new BigDecimal("300.00"));
    }

    @Test
    void rejectsMissingTicketType() {
        assertThatThrownBy(() -> pricingPolicy.priceFor(null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
