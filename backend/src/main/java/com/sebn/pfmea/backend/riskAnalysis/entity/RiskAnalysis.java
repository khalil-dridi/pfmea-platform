package com.sebn.pfmea.backend.riskAnalysis.entity;

import com.sebn.pfmea.backend.failureCause.entity.FailureCause;
import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import com.sebn.pfmea.backend.riskAnalysis.enums.DetectionScope;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "risk_analyses")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "failureCause")
public class RiskAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "failure_cause_id",
            nullable = false,
            unique = true
    )
    private FailureCause failureCause;

    @Column(length = 2000)
    private String currentPreventionControl;

    @Column(nullable = false)
    private Integer occurrence;

    @Column(length = 2000)
    private String currentDetectionControl;

    @Column(nullable = false)
    private Integer detection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionScope detectionScope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ActionPriority actionPriority;

    @Column(length = 1000)
    private String specialProcess;

    @Column(length = 1000)
    private String specialCharacteristic;
}