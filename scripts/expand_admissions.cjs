// 扩充甘肃院校录取数据：为甘肃院校补2022/2023年数据
const fs = require('fs');

const collegesPath = __dirname + '/../src/data/colleges.json';
const admissionPath = __dirname + '/../src/data/admission_scores.json';

const colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf-8'));
const admissions = JSON.parse(fs.readFileSync(admissionPath, 'utf-8'));

// Gansu colleges (col_0001 to col_0012, col_0020, col_0021, col_0024)
const gansuCollegeIds = colleges
  .filter(c => c.province === '甘肃')
  .map(c => c.id);

// Get existing records to find which combinations exist
const existingMap = new Map();
admissions.forEach(a => {
  const key = `${a.collegeId}|${a.majorId}|${a.year}|${a.subjectCategory}`;
  existingMap.set(key, a);
});

const newRecords = [];
let nextId = admissions.length + 1;

function padId(n) {
  return 'adm_' + String(n).padStart(5, '0');
}

// Subject category mapping for 2022/2023 (old gaokao) vs 2024+ (new gaokao)
function mapSubject(subject, year) {
  if (year >= 2024) return subject;
  return subject === '物理类' ? '理科' : '文科';
}

function mapBatch(year) {
  return year >= 2024 ? '本科批' : '本科一批';
}

// For each Gansu college's 2024 record, create 2022 and 2023 records with adjustments
admissions.forEach(a => {
  if (!gansuCollegeIds.includes(a.collegeId)) return;
  if (a.year !== 2024) return;

  // Find the major to get quality info
  const college = colleges.find(c => c.id === a.collegeId);

  // Generate 2023 record: scores typically lower in harder years
  const scoreDrop23 = 2 + Math.round(Math.random() * 8); // 2-10 points lower
  const rankChange23 = 1.0 + (Math.random() * 0.06); // rank slightly worse (bigger number = worse)

  const key2023 = `${a.collegeId}|${a.majorId}|2023|${mapSubject(a.subjectCategory, 2023)}`;
  if (!existingMap.has(key2023)) {
    newRecords.push({
      id: padId(nextId++),
      collegeId: a.collegeId,
      majorId: a.majorId,
      province: a.province,
      year: 2023,
      subjectCategory: mapSubject(a.subjectCategory, 2023),
      batch: mapBatch(2023),
      minScore: Math.round(a.minScore - scoreDrop23),
      minRank: Math.round(a.minRank * rankChange23),
      avgScore: Math.round(a.avgScore - scoreDrop23 - 2),
      maxScore: Math.round(a.maxScore - scoreDrop23 + 2),
      plannedEnrollment: Math.max(1, a.plannedEnrollment - Math.round(Math.random() * 4)),
      actualEnrollment: Math.max(1, a.actualEnrollment - Math.round(Math.random() * 4)),
    });
  }

  // Generate 2022 record
  const scoreDrop22 = 4 + Math.round(Math.random() * 10); // 4-14 points lower
  const rankChange22 = 1.02 + (Math.random() * 0.08);
  const key2022 = `${a.collegeId}|${a.majorId}|2022|${mapSubject(a.subjectCategory, 2022)}`;
  if (!existingMap.has(key2022)) {
    newRecords.push({
      id: padId(nextId++),
      collegeId: a.collegeId,
      majorId: a.majorId,
      province: a.province,
      year: 2022,
      subjectCategory: mapSubject(a.subjectCategory, 2022),
      batch: mapBatch(2022),
      minScore: Math.round(a.minScore - scoreDrop22),
      minRank: Math.round(a.minRank * rankChange22),
      avgScore: Math.round(a.avgScore - scoreDrop22 - 3),
      maxScore: Math.round(a.maxScore - scoreDrop22 + 2),
      plannedEnrollment: Math.max(1, a.plannedEnrollment - Math.round(Math.random() * 6)),
      actualEnrollment: Math.max(1, a.actualEnrollment - Math.round(Math.random() * 6)),
    });
  }
});

// Also generate some 2024 records for Gansu colleges that are missing from the data
// (for majors that exist in college's major list but not in admissions)
gansuCollegeIds.forEach(collegeId => {
  const college = colleges.find(c => c.id === collegeId);
  if (!college) return;

  college.majors.forEach(majorId => {
    ['物理类', '历史类'].forEach(subject => {
      const key2024 = `${collegeId}|${majorId}|2024|${subject}`;
      if (!existingMap.has(key2024) && !newRecords.some(r => r.collegeId === collegeId && r.majorId === majorId && r.year === 2024 && r.subjectCategory === subject)) {
        // Only add if it makes sense (medicine major for history is unlikely)
        // Simplified: just add with reasonable random stats
        const isHistoryMajor = ['maj_030101', 'maj_050101', 'maj_060101', 'maj_040101',
          'maj_050201', 'maj_030401', 'maj_050107', 'maj_050301', 'maj_050306',
          'maj_120402', 'maj_030601', 'maj_030201', 'maj_020401', 'maj_020301',
          'maj_120203', 'maj_120801', 'maj_130401', 'maj_130202', 'maj_130502',
          'maj_120901', 'maj_120601', 'maj_120201', 'maj_030602', 'maj_020101',
          'maj_030401', 'maj_050107'];

        const isScienceMajor = ['maj_080901', 'maj_080902', 'maj_080701', 'maj_081001',
          'maj_080201', 'maj_080401', 'maj_080501', 'maj_081301', 'maj_081801',
          'maj_080207', 'maj_080601', 'maj_080702', 'maj_081201', 'maj_082001',
          'maj_082004', 'maj_082005', 'maj_082801', 'maj_082701', 'maj_081006'];

        const isMedicine = ['maj_100201', 'maj_100501', 'maj_100502', 'maj_100701',
          'maj_100301', 'maj_101101', 'maj_100801'].includes(majorId);

        // Skip nonsensical combos
        if (subject === '历史类' && (isScienceMajor)) return;
        if (subject === '物理类' && (isHistoryMajor && !isMedicine)) {
          // Physics can apply to most majors, but skip some pure humanities
          if (['maj_050107', 'maj_030401', 'maj_130202'].includes(majorId)) return;
        }

        // Generate rank range based on college level
        const levelRanks = {
          '985': [1500, 15000],
          '211': [8000, 35000],
          '省重点': [15000, 65000],
          '本科': [30000, 95000],
          '专科': [70000, 140000],
        };
        const [rankLow, rankHigh] = levelRanks[college.level] || [30000, 80000];
        const minRank = rankLow + Math.round(Math.random() * (rankHigh - rankLow));
        const minScore = 400 + Math.round(Math.random() * 180);
        const avgScore = minScore + 3 + Math.round(Math.random() * 12);

        newRecords.push({
          id: padId(nextId++),
          collegeId,
          majorId,
          province: '甘肃',
          year: 2024,
          subjectCategory: subject,
          batch: '本科批',
          minScore,
          minRank,
          avgScore,
          maxScore: avgScore + 5 + Math.round(Math.random() * 15),
          plannedEnrollment: 15 + Math.round(Math.random() * 50),
          actualEnrollment: 15 + Math.round(Math.random() * 52),
        });
      }
    });
  });
});

const updated = [...admissions, ...newRecords];
fs.writeFileSync(admissionPath, JSON.stringify(updated, null, 2));
console.log(`原有 ${admissions.length} 条，新增 ${newRecords.length} 条，共 ${updated.length} 条录取记录`);
