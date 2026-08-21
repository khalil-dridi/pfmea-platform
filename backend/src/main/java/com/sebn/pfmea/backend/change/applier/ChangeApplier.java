package com.sebn.pfmea.backend.change.applier;

import com.sebn.pfmea.backend.change.entity.ChangeRequest;

import java.util.UUID;

public interface ChangeApplier {

    boolean supports(String entityType);

    UUID apply(ChangeRequest changeRequest);
}
