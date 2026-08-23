package com.sebn.pfmea.backend.optimization.entity;

import com.sebn.pfmea.backend.optimization.enums.OptimizationActionStatus;
import com.sebn.pfmea.backend.optimization.enums.OptimizationActionType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "optimization_actions")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "optimization")
public class OptimizationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "optimization_id", nullable = false)
    private Optimization optimization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OptimizationActionType actionType;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(length = 255)
    private String responsiblePerson;

    private LocalDate targetCompletionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OptimizationActionStatus status;

    @Column(length = 2000)
    private String evidence;

    private LocalDate completionDate;
}