package com.sebn.pfmea.backend.search.projection;

public interface GlobalSearchProjection {

    String getId();

    String getEntityType();

    String getTitle();

    String getDescription();

    String getReference();

    String getProcessId();

    String getProcessName();

    String getProcessStepId();

    String getProcessStepName();

    String getStatus();

    String getActionPriority();
}