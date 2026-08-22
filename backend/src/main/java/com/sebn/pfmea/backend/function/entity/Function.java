package com.sebn.pfmea.backend.function.entity;

import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.processStep.entity.ProcessStep;
import com.sebn.pfmea.backend.processWorkElement.entity.ProcessWorkElement;
import com.sebn.pfmea.backend.function.enums.FunctionType;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "functions")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"process", "processStep", "workElement"})
public class Function {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FunctionType type;

    @Column(nullable = false, length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id")
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_step_id")
    private ProcessStep processStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_element_id")
    private ProcessWorkElement workElement;
}