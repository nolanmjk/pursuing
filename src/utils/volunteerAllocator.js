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
  const { cities = [], safetyCities = [], majors = [] } = preferences;
  let result = { reach: [...pools.reach], match: [...pools.match], safety: [...pools.safety] };
  const warnings = [];

  const hasCityFilter = cities.length > 0 || safetyCities.length > 0;
  const hasMajorFilter = majors.length > 0;

  if (!hasCityFilter && !hasMajorFilter) return { ...result, warnings };

  const filterByCityList = (entries, cityList) => {
    if (!cityList || cityList.length === 0) return entries;
    return entries.filter(e => {
      const c = collegeMap[e.collegeId];
      if (!c) return false;
      return cityList.some(city => cityMatches(c, city));
    });
  };

  const filterByMajor = (entries) => {
    const fieldHints = new Set();
    for (const pref of majors) {
      if (pref.includes('医') || pref.includes('临床') || pref.includes('护理') || pref.includes('药') || pref.includes('麻醉')) fieldHints.add('医学');
      if (pref.includes('计算机') || pref.includes('软件') || pref.includes('人工智能') || pref.includes('数据')) fieldHints.add('计算机');
      if (pref.includes('电子') || pref.includes('通信') || pref.includes('微电子') || pref.includes('集成电路')) fieldHints.add('电子信息');
      if (pref.includes('机械') || pref.includes('车辆') || pref.includes('自动化')) fieldHints.add('机械');
      if (pref.includes('土木') || pref.includes('建筑') || pref.includes('给排水')) fieldHints.add('土木建筑');
    }

    return entries.filter(e => {
      const m = majorMap[e.majorId];
      if (!m) return false;

      const groupName = e._groupName || '';

      const exactMatch = majors.some(pref =>
        m.name?.includes(pref) ||
        m.subcategory?.includes(pref) ||
        m.coreCourses?.some(c => c.includes(pref))
      );
      if (exactMatch) return true;

      // 普通类 groups: don't unconditionally keep — check if college type matches field
      if (groupName.includes('普通类') || groupName.includes('不限')) {
        if (fieldHints.size === 0) return true;
        const c = collegeMap[e.collegeId];
        const collegeType = c?.type || '';
        for (const hint of fieldHints) {
          if (hint === '医学' && collegeType.includes('医药')) return true;
          if ((hint === '计算机' || hint === '电子信息' || hint === '机械' || hint === '土木建筑') &&
              (collegeType.includes('理工') || collegeType.includes('综合'))) return true;
        }
        return false;
      }

      if (fieldHints.size > 0) {
        const cat = m.category || '';
        const sub = m.subcategory || '';
        return [...fieldHints].some(hint => cat.includes(hint) || sub.includes(hint));
      }
      return false;
    });
  };

  if (isSafetyOnly) {
    result.reach = filterByCityList(result.reach, cities);
    result.reach = hasMajorFilter ? filterByMajor(result.reach) : result.reach;
    result.match = filterByCityList(result.match, cities);
    result.match = hasMajorFilter ? filterByMajor(result.match) : result.match;
    const safetyCityList = safetyCities.length > 0 ? safetyCities : cities;
    result.safety = filterByCityList(result.safety, safetyCityList);
    result.safety = hasMajorFilter ? filterByMajor(result.safety) : result.safety;
  } else {
    result.reach = filterByCityList(result.reach, cities);
    result.reach = hasMajorFilter ? filterByMajor(result.reach) : result.reach;
    result.match = filterByCityList(result.match, cities);
    result.match = hasMajorFilter ? filterByMajor(result.match) : result.match;
    result.safety = filterByCityList(result.safety, cities);
    result.safety = hasMajorFilter ? filterByMajor(result.safety) : result.safety;
  }

  // If filtered pools too small, relax major filter BEFORE relaxing city filter.
  const totalFiltered = result.reach.length + result.match.length + result.safety.length;
  if (totalFiltered < 10 && hasCityFilter && hasMajorFilter) {
    if (isSafetyOnly) {
      result.reach = filterByCityList([...pools.reach], cities);
      result.match = filterByCityList([...pools.match], cities);
      result.safety = filterByCityList([...pools.safety], safetyCities.length > 0 ? safetyCities : cities);
    } else {
      result.reach = filterByCityList([...pools.reach], cities);
      result.match = filterByCityList([...pools.match], cities);
      result.safety = filterByCityList([...pools.safety], cities);
    }
    warnings.push('你的专业偏好在目标城市数据较少，已展示该城市所有专业方向');
  }

  // Still too few? Expand city to preferred + safety (or nationwide)
  const total2 = result.reach.length + result.match.length + result.safety.length;
  if (total2 < 10 && hasCityFilter) {
    if (isSafetyOnly) {
      const allCities = [...new Set([...cities, ...safetyCities])];
      result.reach = filterByCityList([...pools.reach], allCities);
      result.match = filterByCityList([...pools.match], allCities);
      result.safety = filterByCityList([...pools.safety], safetyCities.length > 0 ? safetyCities : allCities);
      warnings.push('倾向城市数据不足，已将保底城市纳入搜索范围');
    } else {
      result.reach = [...pools.reach];
      result.match = [...pools.match];
      result.safety = [...pools.safety];
      warnings.push('目标城市数据较少，已扩展到全国范围搜索');
    }
  }

  // Still < 5? Drop all city filters as last resort
  const total3 = result.reach.length + result.match.length + result.safety.length;
  if (total3 < 5 && hasCityFilter) {
    result.reach = [...pools.reach];
    result.match = [...pools.match];
    result.safety = [...pools.safety];
    warnings.push('你指定的城市暂无足够数据，已展示全国结果。建议放宽城市或专业限制');
  }

  return { ...result, warnings };
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

  // Adjust if pools have insufficient entries, fill remaining from any pool
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
  if (sCount > available.safety) {
    sCount = available.safety;
  }
  // Fill remaining slots from any pool that still has entries
  let remaining = totalChoices - rCount - mCount - sCount;
  if (remaining > 0) {
    const extraReach = Math.min(remaining, Math.max(0, available.reach - rCount));
    rCount += extraReach; remaining -= extraReach;
    const extraMatch = Math.min(remaining, Math.max(0, available.match - mCount));
    mCount += extraMatch; remaining -= extraMatch;
    const extraSafety = Math.min(remaining, Math.max(0, available.safety - sCount));
    sCount += extraSafety;
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
