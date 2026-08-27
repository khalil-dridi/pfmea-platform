package com.sebn.pfmea.backend.search.repository;

import com.sebn.pfmea.backend.process.entity.Process;
import com.sebn.pfmea.backend.search.projection.GlobalSearchProjection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GlobalSearchRepository
        extends JpaRepository<Process, UUID> {

    @Query(
            value = """
                SELECT
                    HEX(p.id) AS id,
                    'PROCESS' AS entityType,
                    p.name AS title,
                    NULL AS description,
                    p.process_number AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    CAST(NULL AS CHAR) AS processStepId,
                    CAST(NULL AS CHAR) AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM processes p
                WHERE (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.process_number) LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND :processStepId IS NULL

                UNION ALL

                SELECT
                    HEX(ps.id) AS id,
                    'PROCESS_STEP' AS entityType,
                    ps.name AS title,
                    ps.description AS description,
                    CAST(ps.step_number AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM process_steps ps
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(ps.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(ps.description, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR CAST(ps.step_number AS CHAR)
                        LIKE CONCAT('%', :query, '%')
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(pwe.id) AS id,
                    'WORK_ELEMENT' AS entityType,
                    pwe.name AS title,
                    pwe.description AS description,
                    CAST(pwe.element_number AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM process_work_elements pwe
                JOIN process_steps ps
                    ON ps.id = pwe.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(pwe.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(pwe.description, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR CAST(pwe.element_number AS CHAR)
                        LIKE CONCAT('%', :query, '%')
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(f.id) AS id,
                    'FUNCTION' AS entityType,
                    f.description AS title,
                    f.description AS description,
                    CAST(f.type AS CHAR) AS reference,

                    HEX(
                        COALESCE(
                            f.process_id,
                            p_from_step.id,
                            p_from_work_element.id
                        )
                    ) AS processId,

                    COALESCE(
                        p_direct.name,
                        p_from_step.name,
                        p_from_work_element.name
                    ) AS processName,

                    HEX(
                        COALESCE(
                            f.process_step_id,
                            pwe_step.id
                        )
                    ) AS processStepId,

                    COALESCE(
                        ps_direct.name,
                        pwe_step.name
                    ) AS processStepName,

                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority

                FROM functions f

                LEFT JOIN processes p_direct
                    ON p_direct.id = f.process_id

                LEFT JOIN process_steps ps_direct
                    ON ps_direct.id = f.process_step_id

                LEFT JOIN processes p_from_step
                    ON p_from_step.id = ps_direct.process_id

                LEFT JOIN process_work_elements pwe
                    ON pwe.id = f.work_element_id

                LEFT JOIN process_steps pwe_step
                    ON pwe_step.id = pwe.process_step_id

                LEFT JOIN processes p_from_work_element
                    ON p_from_work_element.id = pwe_step.process_id

                WHERE (
                    LOWER(f.description)
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(f.type AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR f.process_id = :processId
                    OR ps_direct.process_id = :processId
                    OR pwe_step.process_id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR f.process_step_id = :processStepId
                    OR pwe_step.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(fm.id) AS id,
                    'FAILURE_MODE' AS entityType,
                    fm.description AS title,
                    fm.description AS description,
                    fm.failure_code AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM failure_modes fm
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(fm.description)
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(fm.failure_code, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(fe.id) AS id,
                    'FAILURE_EFFECT' AS entityType,
                    fm.description AS title,
                    CONCAT(
                        'Our Plant: ',
                        COALESCE(fe.our_plant, ''),
                        ' | Ship To Plant: ',
                        COALESCE(fe.ship_to_plant, ''),
                        ' | End User: ',
                        COALESCE(fe.end_user, ''),
                        ' | Severity: ',
                        fe.severity
                    ) AS description,
                    CAST(NULL AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM failure_effects fe
                JOIN failure_modes fm
                    ON fm.id = fe.failure_mode_id
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(COALESCE(fe.our_plant, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(fe.ship_to_plant, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(fe.end_user, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(fc.id) AS id,
                    'FAILURE_CAUSE' AS entityType,
                    fc.description AS title,
                    fc.description AS description,
                    CAST(NULL AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM failure_causes fc
                JOIN failure_modes fm
                    ON fm.id = fc.failure_mode_id
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE LOWER(fc.description)
                    LIKE LOWER(CONCAT('%', :query, '%'))
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(ra.id) AS id,
                    'RISK_ANALYSIS' AS entityType,
                    'Risk Analysis' AS title,
                    CONCAT(
                        'Occurrence: ',
                        ra.occurrence,
                        ' | Detection: ',
                        ra.detection,
                        ' | Detection Scope: ',
                        ra.detection_scope
                    ) AS description,
                    CAST(ra.action_priority AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(ra.action_priority AS CHAR) AS actionPriority
                FROM risk_analyses ra
                JOIN failure_causes fc
                    ON fc.id = ra.failure_cause_id
                JOIN failure_modes fm
                    ON fm.id = fc.failure_mode_id
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(COALESCE(ra.current_prevention_control, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(ra.current_detection_control, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(ra.special_process, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(ra.special_characteristic, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(ra.action_priority AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(ra.detection_scope AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(o.id) AS id,
                    'OPTIMIZATION' AS entityType,
                    'Optimization' AS title,
                    CONCAT(
                        'Severity: ',
                        o.severity,
                        ' | Occurrence: ',
                        o.occurrence,
                        ' | Detection: ',
                        o.detection,
                        ' | Remarks: ',
                        COALESCE(o.remarks, '')
                    ) AS description,
                    CAST(o.action_priority AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(NULL AS CHAR) AS status,
                    CAST(o.action_priority AS CHAR) AS actionPriority
                FROM optimizations o
                JOIN risk_analyses ra
                    ON ra.id = o.risk_analysis_id
                JOIN failure_causes fc
                    ON fc.id = ra.failure_cause_id
                JOIN failure_modes fm
                    ON fm.id = fc.failure_mode_id
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(COALESCE(o.special_process, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(o.special_characteristic, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(o.remarks, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(o.action_priority AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )

                UNION ALL

                SELECT
                    HEX(oa.id) AS id,
                    'OPTIMIZATION_ACTION' AS entityType,
                    oa.description AS title,
                    CONCAT(
                        'Responsible: ',
                        COALESCE(oa.responsible_person, ''),
                        ' | Status: ',
                        oa.status,
                        ' | Target Date: ',
                        COALESCE(
                            CAST(oa.target_completion_date AS CHAR),
                            ''
                        )
                    ) AS description,
                    CAST(oa.action_type AS CHAR) AS reference,
                    HEX(p.id) AS processId,
                    p.name AS processName,
                    HEX(ps.id) AS processStepId,
                    ps.name AS processStepName,
                    CAST(oa.status AS CHAR) AS status,
                    CAST(NULL AS CHAR) AS actionPriority
                FROM optimization_actions oa
                JOIN optimizations o
                    ON o.id = oa.optimization_id
                JOIN risk_analyses ra
                    ON ra.id = o.risk_analysis_id
                JOIN failure_causes fc
                    ON fc.id = ra.failure_cause_id
                JOIN failure_modes fm
                    ON fm.id = fc.failure_mode_id
                JOIN process_steps ps
                    ON ps.id = fm.process_step_id
                JOIN processes p
                    ON p.id = ps.process_id
                WHERE (
                    LOWER(oa.description)
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(oa.responsible_person, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(oa.evidence, ''))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(oa.action_type AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(CAST(oa.status AS CHAR))
                        LIKE LOWER(CONCAT('%', :query, '%'))
                )
                AND (
                    :processId IS NULL
                    OR p.id = :processId
                )
                AND (
                    :processStepId IS NULL
                    OR ps.id = :processStepId
                )
                """,

            countQuery = """
                SELECT COUNT(*)
                FROM (
                    SELECT p.id
                    FROM processes p
                    WHERE (
                        LOWER(p.name)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(p.process_number)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND :processStepId IS NULL

                    UNION ALL

                    SELECT ps.id
                    FROM process_steps ps
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(ps.name)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(ps.description, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR CAST(ps.step_number AS CHAR)
                            LIKE CONCAT('%', :query, '%')
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT pwe.id
                    FROM process_work_elements pwe
                    JOIN process_steps ps
                        ON ps.id = pwe.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(pwe.name)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(pwe.description, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR CAST(pwe.element_number AS CHAR)
                            LIKE CONCAT('%', :query, '%')
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT f.id
                    FROM functions f
                    LEFT JOIN process_steps ps_direct
                        ON ps_direct.id = f.process_step_id
                    LEFT JOIN process_work_elements pwe
                        ON pwe.id = f.work_element_id
                    LEFT JOIN process_steps pwe_step
                        ON pwe_step.id = pwe.process_step_id
                    WHERE (
                        LOWER(f.description)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(f.type AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR f.process_id = :processId
                        OR ps_direct.process_id = :processId
                        OR pwe_step.process_id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR f.process_step_id = :processStepId
                        OR pwe_step.id = :processStepId
                    )

                    UNION ALL

                    SELECT fm.id
                    FROM failure_modes fm
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(fm.description)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(fm.failure_code, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT fe.id
                    FROM failure_effects fe
                    JOIN failure_modes fm
                        ON fm.id = fe.failure_mode_id
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(COALESCE(fe.our_plant, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(fe.ship_to_plant, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(fe.end_user, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT fc.id
                    FROM failure_causes fc
                    JOIN failure_modes fm
                        ON fm.id = fc.failure_mode_id
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE LOWER(fc.description)
                        LIKE LOWER(CONCAT('%', :query, '%'))
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT ra.id
                    FROM risk_analyses ra
                    JOIN failure_causes fc
                        ON fc.id = ra.failure_cause_id
                    JOIN failure_modes fm
                        ON fm.id = fc.failure_mode_id
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(COALESCE(ra.current_prevention_control, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(ra.current_detection_control, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(ra.special_process, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(ra.special_characteristic, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(ra.action_priority AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(ra.detection_scope AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT o.id
                    FROM optimizations o
                    JOIN risk_analyses ra
                        ON ra.id = o.risk_analysis_id
                    JOIN failure_causes fc
                        ON fc.id = ra.failure_cause_id
                    JOIN failure_modes fm
                        ON fm.id = fc.failure_mode_id
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(COALESCE(o.special_process, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(o.special_characteristic, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(o.remarks, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(o.action_priority AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )

                    UNION ALL

                    SELECT oa.id
                    FROM optimization_actions oa
                    JOIN optimizations o
                        ON o.id = oa.optimization_id
                    JOIN risk_analyses ra
                        ON ra.id = o.risk_analysis_id
                    JOIN failure_causes fc
                        ON fc.id = ra.failure_cause_id
                    JOIN failure_modes fm
                        ON fm.id = fc.failure_mode_id
                    JOIN process_steps ps
                        ON ps.id = fm.process_step_id
                    JOIN processes p
                        ON p.id = ps.process_id
                    WHERE (
                        LOWER(oa.description)
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(oa.responsible_person, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(COALESCE(oa.evidence, ''))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(oa.action_type AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                        OR LOWER(CAST(oa.status AS CHAR))
                            LIKE LOWER(CONCAT('%', :query, '%'))
                    )
                    AND (
                        :processId IS NULL
                        OR p.id = :processId
                    )
                    AND (
                        :processStepId IS NULL
                        OR ps.id = :processStepId
                    )
                ) results
                """,
            nativeQuery = true
    )
    Page<GlobalSearchProjection> searchGlobal(
            @Param("query") String query,
            @Param("processId") UUID processId,
            @Param("processStepId") UUID processStepId,
            Pageable pageable
    );
}