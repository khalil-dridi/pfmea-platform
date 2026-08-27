    package com.sebn.pfmea.backend.failureEffect.entity;

    import com.sebn.pfmea.backend.failureMode.entity.FailureMode;
    import jakarta.persistence.Column;
    import jakarta.persistence.Entity;
    import jakarta.persistence.FetchType;
    import jakarta.persistence.GeneratedValue;
    import jakarta.persistence.GenerationType;
    import jakarta.persistence.Id;
    import jakarta.persistence.JoinColumn;
    import jakarta.persistence.OneToOne;
    import jakarta.persistence.Table;
    import java.util.UUID;
    import lombok.Getter;
    import lombok.NoArgsConstructor;
    import lombok.Setter;
    import lombok.ToString;

    @Entity
    @Table(name = "failure_effects")
    @Getter
    @Setter
    @NoArgsConstructor
    @ToString(exclude = "failureMode")
    public class FailureEffect {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @OneToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "failure_mode_id", nullable = false, unique = true)
        private FailureMode failureMode;

        @Column(length = 1000)
        private String ourPlant;

        @Column(length = 1000)
        private String shipToPlant;

        @Column(length = 1000)
        private String endUser;

        @Column(nullable = false)
        private Integer severity;
    }
