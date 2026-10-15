/**
 * NLU Youth 2026 - Central Shared Scoring Engine & Emulation Policy
 * Pure, deterministic functions with explicit typing and zero side-effects.
 * 
 * Enforces:
 * 1. Cumulative individual score has NO 100-point ceiling.
 * 2. Single unique contribution per source (Activity, Proof, Adjustment).
 * 3. Consistent MSSV / OrgCode / ClassCode normalization (preserving leading zeroes).
 * 4. Zero denominator yields null / "Chưa đủ dữ liệu", never NaN / Infinity / fabricated defaults.
 * 5. Unrounded comparison precision and competition ranking (1, 1, 3).
 * 6. Legacy emulation formulas clearly documented as legacy configuration.
 */

import {
  StudentScoreRecord,
  ActivitySubmission,
  StudentSelfProof,
  ParticipantRoleType,
  Organization,
  BranchClass,
  FilterAcademicYear,
  FilterSemester,
  FilterActivityType,
  ClubCategory
} from '../types';

import { calculateRankGrade, calculateGeneralRank } from '../data/mockData';
import { getActivitySemester, getActivityType, matchActivityFilters } from './filterUtils';

/**
 * Standard Role Points Matrix (Version 1 - Canonical Quy chế)
 */
export const DEFAULT_ROLE_POINTS_MATRIX: Record<ParticipantRoleType, { c1: number; c2: number; c3: number; c4: number }> = {
  'Giải Nhất': { c1: 5, c2: 6, c3: 7, c4: 8 },
  'Giải Nhì': { c1: 4, c2: 5, c3: 6, c4: 7 },
  'Giải Ba': { c1: 3, c2: 4, c3: 5, c4: 6 },
  'Ban Tổ chức': { c1: 5, c2: 6, c3: 7, c4: 8 },
  'Cộng tác viên': { c1: 3, c2: 4, c3: 5, c4: 6 },
  'Tham gia dự thi vòng 1 trực tiếp (offline)': { c1: 2, c2: 3, c3: 4, c4: 5 },
  'Tham dự': { c1: 1, c2: 2, c3: 3, c4: 4 },
  'Tham gia dự thi 1 vòng trực tuyến (online)': { c1: 1, c2: 2, c3: 3, c4: 4 },
};

export interface VersionedScoringPolicy {
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  roleMatrix: Record<string, { c1: number; c2: number; c3: number; c4: number }>;
  legacyParameters: {
    facultyMultiplier: number; // 300
    denominatorFactor: number; // 7
    isLegacyConfiguration: boolean;
    description: string;
  };
}

export const CANONICAL_SCORING_POLICY: VersionedScoringPolicy = {
  version: '2026.1',
  effectiveFrom: '2025-09-01',
  roleMatrix: DEFAULT_ROLE_POINTS_MATRIX,
  legacyParameters: {
    facultyMultiplier: 300,
    denominatorFactor: 7,
    isLegacyConfiguration: true,
    description: 'Cấu hình kế thừa cần đối chiếu: hệ số 7 và 300 từ phần mềm tiền nhiệm'
  }
};

/**
 * Normalizes identifier strings preserving leading zeroes, trimming whitespace, and uppercase.
 */
export function normalizeStudentId(id: string | undefined | null): string {
  if (!id) return '';
  return id.trim().toUpperCase();
}

export function normalizeOrgCode(code: string | undefined | null): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

export function normalizeClassCode(code: string | undefined | null): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Returns point awarded for a specific role and program level based on versioned policy.
 */
export function getPointsForRoleVersioned(
  role: ParticipantRoleType,
  programLevel: number,
  policy: VersionedScoringPolicy = CANONICAL_SCORING_POLICY
): number {
  const matrix = policy.roleMatrix || DEFAULT_ROLE_POINTS_MATRIX;
  const entry = matrix[role] || matrix['Tham dự'] || { c1: 1, c2: 2, c3: 3, c4: 4 };
  const level = Math.min(4, Math.max(1, programLevel || 1));
  if (level === 1) return entry.c1;
  if (level === 2) return entry.c2;
  if (level === 3) return entry.c3;
  return entry.c4;
}

export interface ScoreScope {
  academicYear?: FilterAcademicYear;
  semester?: FilterSemester;
  activityType?: FilterActivityType;
  closingSnapshotDate?: string;
  policyVersion?: string;
  isCumulativeAll?: boolean;
}

export interface ReconstructedStudentScores {
  studentId: string;
  activityScore: number;
  bonusScore: number;
  positionScore: number;
  researchScore: number;
  totalScore: number;
  rankGrade: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  rankGeneral: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  approvedActivitiesCount: number;
  activityContributionDetails: Array<{
    activityId: string;
    title: string;
    role: ParticipantRoleType;
    pointsAwarded: number;
  }>;
}

/**
 * Reconstructs a student's scores from authoritative primary sources:
 * - Approved activities where student participated (confirmed attendance or roster)
 * - Approved self-proofs of type KHEN_THUONG, CHUC_VU, NCKH
 * - Preserves opening legacy balances when explicitly present
 */
export function reconstructStudentPointsFromSources(
  student: StudentScoreRecord,
  activities: ActivitySubmission[],
  selfProofs: StudentSelfProof[] = [],
  policy: VersionedScoringPolicy = CANONICAL_SCORING_POLICY,
  scope?: ScoreScope
): ReconstructedStudentScores {
  const cleanStudentId = normalizeStudentId(student.studentId);

  // 1. Activity Contributions (distinct per activityId)
  let calculatedActivityScore = 0;
  let approvedCount = 0;
  const activityDetails: ReconstructedStudentScores['activityContributionDetails'] = [];
  const processedActivityIds = new Set<string>();

  (activities || []).forEach(act => {
    if (!act || act.deleted || act.isDeleted) return;
    if (act.status !== 'Approved') return;
    if (processedActivityIds.has(act.id)) return;

    // Check scope if provided
    if (scope) {
      const match = matchActivityFilters(act, {
        academicYear: scope.academicYear,
        semester: scope.semester,
        activityType: scope.activityType
      });
      if (!match) return;
    }

    if (!act.participants || !Array.isArray(act.participants)) return;

    const participant = act.participants.find(
      p => normalizeStudentId(p.studentId) === cleanStudentId
    );

    if (participant) {
      processedActivityIds.add(act.id);
      approvedCount++;

      // Validate points: use recorded points or fallback to policy
      const role = participant.role || 'Tham dự';
      const expectedPoints = getPointsForRoleVersioned(role, act.programLevel || 1, policy);
      const points = Number.isFinite(participant.pointsAwarded) && participant.pointsAwarded > 0
        ? participant.pointsAwarded
        : expectedPoints;

      calculatedActivityScore += points;
      activityDetails.push({
        activityId: act.id,
        title: act.title,
        role,
        pointsAwarded: points
      });
    }
  });

  // 2. Approved Self-Proofs (Quy chế NLU: Cho phép nộp nhiều minh chứng nhưng chỉ tính 01 mức điểm cao nhất trong mỗi nhóm)
  let proofBonusMax = 0;
  let proofPositionMax = 0;
  let proofResearchMax = 0;
  let proofPartyMax = 0;
  const processedProofIds = new Set<string>();

  (selfProofs || []).forEach(prf => {
    if (!prf || prf.status !== 'Approved') return;
    if (normalizeStudentId(prf.studentId) !== cleanStudentId) return;
    if (processedProofIds.has(prf.id)) return;
    processedProofIds.add(prf.id);

    const score = Number.isFinite(prf.approvedScore)
      ? Number(prf.approvedScore)
      : Number.isFinite(prf.scoreClaimed)
      ? Number(prf.scoreClaimed)
      : 0;

    if (prf.type === 'KHEN_THUONG') {
      proofBonusMax = Math.max(proofBonusMax, score);
    } else if (prf.type === 'CHUC_VU') {
      proofPositionMax = Math.max(proofPositionMax, score);
    } else if (prf.type === 'NCKH') {
      proofResearchMax = Math.max(proofResearchMax, score);
    } else if (prf.type === 'DANG_VIEN_HUONG_DAN') {
      proofPartyMax = Math.max(proofPartyMax, score);
    }
  });

  // 3. Fallback / Baseline: lấy mức cao nhất giữa điểm minh chứng cao nhất và điểm cơ sở
  const baselineBonus = Math.max(
    Number.isFinite(student.bonusScore) ? Number(student.bonusScore) : 0,
    proofBonusMax,
    proofPartyMax
  );
  const baselinePosition = Math.max(
    Number.isFinite(student.positionScore) ? Number(student.positionScore) : 0,
    proofPositionMax
  );
  const baselineResearch = Math.max(
    Number.isFinite(student.researchScore) ? Number(student.researchScore) : 0,
    proofResearchMax
  );

  // If student had an existing activityScore but zero activities were found in Firestore (e.g. legacy migrated student),
  // retain existing activityScore if processedActivityIds is empty and student has legacy score.
  const finalActScore = processedActivityIds.size > 0
    ? calculatedActivityScore
    : (Number.isFinite(student.activityScore) ? Number(student.activityScore) : 0);

  const finalApprovedCount = processedActivityIds.size > 0
    ? approvedCount
    : (Number.isFinite(student.approvedActivitiesCount) ? Number(student.approvedActivitiesCount) : 0);

  // Total has NO 100-point ceiling
  const totalScore = finalActScore + baselineBonus + baselinePosition + baselineResearch;
  const rankGrade = calculateRankGrade(totalScore, student.academicYearNumber);
  const rankGeneral = calculateGeneralRank(totalScore);

  return {
    studentId: cleanStudentId,
    activityScore: finalActScore,
    bonusScore: baselineBonus,
    positionScore: baselinePosition,
    researchScore: baselineResearch,
    totalScore,
    rankGrade,
    rankGeneral,
    approvedActivitiesCount: finalApprovedCount,
    activityContributionDetails: activityDetails
  };
}

/**
 * Standard Emulation Ratio and Metrics Calculation
 */
export interface EmulationCalculationResult {
  score: number | null; // null if denominator is 0 (insufficient data)
  scoreFormatted: string; // "240.00" or "Chưa đủ dữ liệu"
  isInsufficientData: boolean;
  totalStudentsOrMembers: number;
  doanVienCount: number;
  doanVienRatio: number | null; // e.g. 80.0 (80%), null if total is 0
  doanVienRatioFormatted: string; // "80.0%" or "-"
  validDoanVienParticipations: number;
  rawNumerator: number;
  rawDenominator: number;
}

/**
 * Calculates emulation index for Khoa:
 * formula: (validDoanVienParticipations / (totalStudents * 7)) * 300
 */
export function calculateFacultyEmulationMetrics(
  totalStudents: number,
  doanVienCount: number,
  validDoanVienParticipations: number,
  policy: VersionedScoringPolicy = CANONICAL_SCORING_POLICY
): EmulationCalculationResult {
  if (!totalStudents || totalStudents <= 0) {
    return {
      score: null,
      scoreFormatted: 'Chưa đủ dữ liệu',
      isInsufficientData: true,
      totalStudentsOrMembers: 0,
      doanVienCount,
      doanVienRatio: null,
      doanVienRatioFormatted: '-',
      validDoanVienParticipations,
      rawNumerator: validDoanVienParticipations,
      rawDenominator: 0
    };
  }

  const denominatorFactor = policy.legacyParameters.denominatorFactor || 7;
  const multiplier = policy.legacyParameters.facultyMultiplier || 300;
  const denominator = totalStudents * denominatorFactor;
  const rawScore = (validDoanVienParticipations / denominator) * multiplier;
  const doanVienRatio = Number(((doanVienCount / totalStudents) * 100).toFixed(1));

  return {
    score: rawScore,
    scoreFormatted: rawScore.toFixed(2),
    isInsufficientData: false,
    totalStudentsOrMembers: totalStudents,
    doanVienCount,
    doanVienRatio,
    doanVienRatioFormatted: `${doanVienRatio.toFixed(1)}%`,
    validDoanVienParticipations,
    rawNumerator: validDoanVienParticipations * multiplier,
    rawDenominator: denominator
  };
}

/**
 * Calculates emulation index for Chi đoàn:
 * formula: validDoanVienParticipations / (totalStudents * 7)
 */
export function calculateBranchEmulationMetrics(
  totalStudents: number,
  doanVienCount: number,
  validDoanVienParticipations: number,
  policy: VersionedScoringPolicy = CANONICAL_SCORING_POLICY
): EmulationCalculationResult {
  if (!totalStudents || totalStudents <= 0) {
    return {
      score: null,
      scoreFormatted: 'Chưa đủ dữ liệu',
      isInsufficientData: true,
      totalStudentsOrMembers: 0,
      doanVienCount,
      doanVienRatio: null,
      doanVienRatioFormatted: '-',
      validDoanVienParticipations,
      rawNumerator: validDoanVienParticipations,
      rawDenominator: 0
    };
  }

  const denominatorFactor = policy.legacyParameters.denominatorFactor || 7;
  const denominator = totalStudents * denominatorFactor;
  const rawScore = validDoanVienParticipations / denominator;
  const doanVienRatio = Number(((doanVienCount / totalStudents) * 100).toFixed(1));

  return {
    score: rawScore,
    scoreFormatted: rawScore.toFixed(2),
    isInsufficientData: false,
    totalStudentsOrMembers: totalStudents,
    doanVienCount,
    doanVienRatio,
    doanVienRatioFormatted: `${doanVienRatio.toFixed(1)}%`,
    validDoanVienParticipations,
    rawNumerator: validDoanVienParticipations,
    rawDenominator: denominator
  };
}

/**
 * Calculates emulation index for CLB / Tổ / Đội / Nhóm:
 * formula: validDoanVienParticipations / (totalMembers * 7)
 */
export function calculateClubEmulationMetrics(
  totalMembers: number,
  doanVienCount: number,
  validDoanVienParticipations: number,
  policy: VersionedScoringPolicy = CANONICAL_SCORING_POLICY
): EmulationCalculationResult {
  if (!totalMembers || totalMembers <= 0) {
    return {
      score: null,
      scoreFormatted: 'Chưa đủ dữ liệu',
      isInsufficientData: true,
      totalStudentsOrMembers: 0,
      doanVienCount,
      doanVienRatio: null,
      doanVienRatioFormatted: '-',
      validDoanVienParticipations,
      rawNumerator: validDoanVienParticipations,
      rawDenominator: 0
    };
  }

  const denominatorFactor = policy.legacyParameters.denominatorFactor || 7;
  const denominator = totalMembers * denominatorFactor;
  const rawScore = validDoanVienParticipations / denominator;
  const doanVienRatio = Number(((doanVienCount / totalMembers) * 100).toFixed(1));

  return {
    score: rawScore,
    scoreFormatted: rawScore.toFixed(2),
    isInsufficientData: false,
    totalStudentsOrMembers: totalMembers,
    doanVienCount,
    doanVienRatio,
    doanVienRatioFormatted: `${doanVienRatio.toFixed(1)}%`,
    validDoanVienParticipations,
    rawNumerator: validDoanVienParticipations,
    rawDenominator: denominator
  };
}

/**
 * Applies Standard Competition Ranking (1, 1, 3) to sorted items based on exact scores.
 * Items must already be sorted descending.
 */
export function assignCompetitionRanks<T extends { score: number | null }>(
  items: T[],
  secondaryTieBreaker?: (a: T, b: T) => number
): Array<T & { rank: number; isTied: boolean }> {
  let currentRank = 1;

  return items.map((item, index) => {
    if (item.score === null) {
      return { ...item, rank: items.length, isTied: false };
    }

    if (index > 0) {
      const prev = items[index - 1];
      if (prev.score !== null && Math.abs((prev.score || 0) - (item.score || 0)) < 0.0000001) {
        // Tied with previous
        return { ...item, rank: currentRank, isTied: true };
      } else {
        currentRank = index + 1;
      }
    } else {
      currentRank = 1;
    }

    const hasNextTie = index < items.length - 1 &&
      items[index + 1].score !== null &&
      Math.abs((items[index + 1].score || 0) - (item.score || 0)) < 0.0000001;

    return { ...item, rank: currentRank, isTied: hasNextTie };
  });
}
