package com.sebn.pfmea.backend.failureCause.entity;

import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
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
@Table(name = "failure_causes")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "failureMode")
public class FailureCause {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "failure_mode_id", nullable = false)
    private FailureMode failureMode;

    @Column(nullable = false, length = 1000)
    private String description;
}