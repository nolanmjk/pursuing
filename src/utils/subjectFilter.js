import majorsData from '../data/majors.json';
import subjectMap from '../data/subject_major_map.json';

const mapByMajorId = {};
subjectMap.forEach(m => { mapByMajorId[m.majorId] = m; });

const categoryCache = {};
majorsData.forEach(m => { categoryCache[m.id] = m.category; });

/**
 * Check if a major is compatible with the student's chosen subject category.
 * Uses the official MOE 选考科目要求指引 for 3+1+2 provinces.
 *
 * @param {string} majorId
 * @param {string} subjectCategory - '物理类' | '历史类' | '理科' | '文科'
 * @param {string[]} [reselectedSubjects] - optional, e.g. ['化学','生物']
 * @returns {boolean}
 */
export function isMajorCompatible(majorId, subjectCategory, reselectedSubjects = []) {
  const mapping = mapByMajorId[majorId];

  // If we have explicit mapping data, use it
  if (mapping) {
    // 首选科目 check
    if (mapping.preferredSubject === '仅物理') {
      if (subjectCategory === '历史类' || subjectCategory === '文科') return false;
    }
    if (mapping.preferredSubject === '仅历史') {
      if (subjectCategory === '物理类' || subjectCategory === '理科') return false;
    }

    // 再选科目 check — only if user provided their reselected subjects
    if (reselectedSubjects.length > 0 && mapping.reselectionRequired.length > 0) {
      return mapping.reselectionRequired.every(req => reselectedSubjects.includes(req));
    }

    return true;
  }

  // Fallback: use category-based rules (coarse but safe)
  if (subjectCategory === '物理类' || subjectCategory === '理科') return true;

  const STEM_CATEGORIES = new Set(['工学', '医学', '农学']);
  const category = categoryCache[majorId];
  if (!category) return true;
  return !STEM_CATEGORIES.has(category);
}

/**
 * Get the full subject requirement for a major.
 * @param {string} majorId
 * @returns {{ preferredSubject: string, reselectionRequired: string[], note: string } | null}
 */
export function getMajorSubjectRequirement(majorId) {
  return mapByMajorId[majorId] || null;
}

/**
 * Get all majors compatible with given subject combination.
 * @param {string} preferredSubject - '物理类' | '历史类' | '物理' | '历史'
 * @param {string[]} [reselectedSubjects] - e.g. ['化学','生物','政治','地理']
 * @returns {string[]} array of compatible major IDs
 */
export function getCompatibleMajors(preferredSubject, reselectedSubjects = []) {
  const normSubject = preferredSubject === '物理' ? '物理类' : preferredSubject === '历史' ? '历史类' : preferredSubject;

  return subjectMap
    .filter(m => {
      if (m.preferredSubject === '仅物理' && normSubject !== '物理类') return false;
      if (m.preferredSubject === '仅历史' && normSubject !== '历史类') return false;
      if (m.reselectionRequired.length > 0 && reselectedSubjects.length > 0) {
        return m.reselectionRequired.every(req => reselectedSubjects.includes(req));
      }
      return true;
    })
    .map(m => m.majorId);
}
