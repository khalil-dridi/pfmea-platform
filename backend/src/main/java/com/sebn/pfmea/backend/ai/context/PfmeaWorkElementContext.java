package com.sebn.pfmea.backend.ai.context;

import java.util.UUID;

public record PfmeaWorkElementContext(
        UUID id,
        Integer elementNumber,
        String name,
        String description
) {
}