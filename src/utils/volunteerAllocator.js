import majorsData from '../data/majors.json';
import collegesData from '../data/colleges.json';

const collegeMap = Object.fromEntries(collegesData.map(c => [c.id, c]));
const majorMap = Object.fromEntries(majorsData.map(m => [m.id, m]));

// Normalize city name for comparison: strip "市" suffix, lowercase
const norm = (s) => (s || '').replace(/市$/, '').trim();

function cityMatches(college, userCity) {
  if (!college || !college.city) return false;
  const colCity = norm(college.city);
  const usrCity = norm(userCity);
  // Direct match
  if (colCity === usrCity) return true;
  // College name contains the city (e.g. 上海交通大学 for 上海)
  if (college.name && college.name.includes(usrCity)) return true;
  // Province-level fallback: if user types 兰州, match colleges in 兰州 OR 兰州市
  if (colCity.includes(usrCity) || usrCity.includes(colCity)) return true;
  return false;
}

/**
 * Filter match pools by user's city and major preferences.
 * Falls back progressively if a pool becomes too small.
 */
export function filterByPreferences(pools, preferences, isSafetyOnly = false) {
  const { cities = [], majors = [] } = preferences;
  let result = { reach: [...pools.reach], match: [...pools.match], safety: [...pools.safety] };

  const hasCityFilter = cities.length > 0;
  const hasMajorFilter = majors.length > 0;

  if (!hasCityFilter && !hasMajorFilter) return result;

  const applyFilters = (entries, applyCity) => {
    let filtered = entries;
    if (applyCity && hasCityFilter) {
      filtered = filtered.filter(e => {
        const c = collegeMap[e.collegeId];
        if (!c) return false;
        return cities.some(city => cityMatches(c, city));
      });
    }
    if (hasMajorFilter) {
      // Check if preferences lean toward a specific field (医学, 计算机, etc.)
      const fieldHints = new Set();
      for (const pref of majors) {
        if (pref.includes('医') || pref.includes('临床') || pref.includes('护理') || pref.includes('药') || pref.includes('麻醉')) fieldHints.add('医学');
        if (pref.includes('计算机') || pref.includes('软件') || pref.includes('人工智能') || pref.includes('数据')) fieldHints.add('计算机');
        if (pref.includes('电子') || pref.includes('通信') || pref.includes('微电子') || pref.includes('集成电路')) fieldHints.add('电子信息');
        if (pref.includes('机械') || pref.includes('车辆') || pref.includes('自动化')) fieldHints.add('机械');
        if (pref.includes('土木') || pref.includes('建筑') || pref.includes('给排水')) fieldHints.add('土木建筑');
      }

      filtered = filtered.filter(e => {
        const m = majorMap[e.majorId];
        if (!m) return false;

        // "普通类" groups contain many majors — keep them regardless of preference
        const groupName = e._groupName || '';
        if (groupName.includes('普通类') || groupName.includes('不限')) return true;

        const exactMatch = majors.some(pref =>
          m.name?.includes(pref) ||
          m.subcategory?.includes(pref) ||
          m.coreCourses?.some(c => c.includes(pref))
        );
        if (exactMatch) return true;
        // Broader: match by category/field hint
        if (fieldHints.size > 0) {
          const cat = m.category || '';
          const sub = m.subcategory || '';
          return [...fieldHints].some(hint => cat.includes(hint) || sub.includes(hint));
        }
        return false;
      });
    }
    return filtered;
  };

  // Apply filters: safety-only cities means city filter only applies to safety
  result.reach = applyFilters(result.reach, !isSafetyOnly);
  result.match = applyFilters(result.match, !isSafetyOnly);
  result.safety = applyFilters(result.safety, true);

  // Only relax city constraint if filtered pools are too small — NEVER drop major preference
  if ((result.reach.length + result.match.length + result.safety.length) < 10 && hasCityFilter) {
    const relaxed = { reach: [...pools.reach], match: [...pools.match], safety: [...pools.safety] };
    relaxed.reach = applyFilters(relaxed.reach, false);
    relaxed.match = applyFilters(relaxed.match, false);
    relaxed.safety = applyFilters(relaxed.safety, false);
    result = relaxed;
  }

  return result;
}

/**
 * Allocate a 45-choice志愿表 from filtered pools.
 */
export function allocateVolunteerTable(filteredPools, userRank, config = {}) {
  const { totalChoices = 45, reachRatio = 0.33, matchRatio = 0.37 } = config;

  const reach = filteredPools.reach.slice(0, 40);
  const match = filteredPools.match.slice(0, 40);
  const safety = filteredPools.safety.slice(0, 40);

  // Sort each pool by proximity to userRank (closest first)
  const byProximity = (a, b) => Math.abs(a.matchRatio - 1) - Math.abs(b.matchRatio - 1);
  reach.sort(byProximity);
  match.sort(byProximity);
  safety.sort(byProximity);

  // Calculate allocations
  let rCount = Math.floor(totalChoices * reachRatio);
  let mCount = Math.floor(totalChoices * matchRatio);
  let sCount = totalChoices - rCount - mCount;

  // Adjust if pools have insufficient entries
  const available = { reach: reach.length, match: match.length, safety: safety.length };
  if (rCount > available.reach) {
    const overflow = rCount - available.reach;
    rCount = available.reach;
    mCount = Math.min(available.match, mCount + overflow);
  }
  if (mCount > available.match) {
    const overflow = mCount - available.match;
    mCount = available.match;
    sCount = Math.min(available.safety, sCount + overflow);
  }

  const allocated = [];
  let idx = 1;

  // Take entries from each pool
  for (const e of reach.slice(0, rCount)) {
    allocated.push({ ...e, index: idx++, zone: '冲刺' });
  }
  for (const e of match.slice(0, mCount)) {
    allocated.push({ ...e, index: idx++, zone: '稳妥' });
  }
  for (const e of safety.slice(0, sCount)) {
    allocated.push({ ...e, index: idx++, zone: '保底' });
  }

  return allocated;
}

export { collegeMap, majorMap };
