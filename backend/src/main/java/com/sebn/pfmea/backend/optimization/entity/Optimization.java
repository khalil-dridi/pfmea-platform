package com.sebn.pfmea.backend.optimization.entity;

import com.sebn.pfmea.backend.riskAnalysis.entity.RiskAnalysis;
import com.sebn.pfmea.backend.riskAnalysis.enums.ActionPriority;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "optimizations")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "riskAnalysis")
public class Optimization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "risk_analysis_id",
            nullable = false,
            unique = true
    )
    private RiskAnalysis riskAnalysis;

    @Column(nullable = false)
    private Integer severity;

    @Column(nullable = false)
    private Integer occurrence;

    @Column(nullable = false)
    private Integer detection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ActionPriority actionPriority;

    @Column(length = 1000)
    private String specialProcess;

    @Column(length = 1000)
    private String specialCharacteristic;

    @Column(length = 2000)
    private String remarks;
}
