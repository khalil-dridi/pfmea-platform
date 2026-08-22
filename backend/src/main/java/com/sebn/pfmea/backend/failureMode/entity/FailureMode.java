package com.sebn.pfmea.backend.failureMode.entity;

import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "failure_modes")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "processStep")
public class FailureMode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "process_step_id", nullable = false)
    private ProcessStep processStep;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(length = 100)
    private String failureCode;
}
