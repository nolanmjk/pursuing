import majorsData from '../data/majors.json';

// Categories typically requiring 物理 — exclude for 历史类 students
const STEM_CATEGORIES = new Set(['工学', '医学', '农学']);

const categoryCache = {};
majorsData.forEach(m => { categoryCache[m.id] = m.category; });

/**
 * Check if a major is compatible with the student's chosen subject category.
 * In 新高考 (3+1+2), 历史类 students generally cannot enter engineering/medicine/agriculture.
 *
 * @param {string} majorId
 * @param {string} subjectCategory - '物理类' | '历史类' | '理科' | '文科'
 * @returns {boolean}
 */
export function isMajorCompatible(majorId, subjectCategory) {
  // 物理类/理科 students can apply to everything
  if (subjectCategory === '物理类' || subjectCategory === '理科') return true;

  // 历史类/文科 — exclude pure STEM categories
  if (subjectCategory === '历史类' || subjectCategory === '文科') {
    const category = categoryCache[majorId];
    if (!category) return true; // unknown major → keep
    return !STEM_CATEGORIES.has(category);
  }

  return true;
}
