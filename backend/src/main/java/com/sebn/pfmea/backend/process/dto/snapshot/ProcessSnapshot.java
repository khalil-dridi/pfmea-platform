package com.sebn.pfmea.backend.process.dto.snapshot;

import java.util.UUID;

public record ProcessSnapshot(
        UUID id,
        String name,
        String processNumber
) {
}