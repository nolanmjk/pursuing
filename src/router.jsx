import { lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import App from './App';

// When deployment updates change chunk filenames, users with stale
// index.html in cache will fail to load old chunks. Force reload once
// to get the latest version, then the app will work normally.
function lazyWithReload(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      if (String(err).includes('imported module')) {
        window.location.reload();
      }
      throw err;
    })
  );
}

const HomePage = lazyWithReload(() => import('./pages/Home/HomePage'));
const ScoreMatchPage = lazyWithReload(() => import('./pages/ScoreMatch/ScoreMatchPage'));
const CollegeSearchPage = lazyWithReload(() => import('./pages/CollegeSearch/CollegeSearchPage'));
const CollegeDetail = lazyWithReload(() => import('./pages/CollegeSearch/CollegeDetail'));
const MajorDetail = lazyWithReload(() => import('./pages/CollegeSearch/MajorDetail'));
const SimulatedFormPage = lazyWithReload(() => import('./pages/SimulatedForm/SimulatedFormPage'));
const AssessmentPage = lazyWithReload(() => import('./pages/Assessment/AssessmentPage'));
const RankConversionPage = lazyWithReload(() => import('./pages/RankConversion/RankConversionPage'));
const CollegeComparePage = lazyWithReload(() => import('./pages/CollegeCompare/CollegeComparePage'));
const MajorComparePage = lazyWithReload(() => import('./pages/MajorCompare/MajorComparePage'));
const PolicyGuidePage = lazyWithReload(() => import('./pages/PolicyGuide/PolicyGuidePage'));
const RankQueryPage = lazyWithReload(() => import('./pages/RankQuery/RankQueryPage'));
const MajorMatchPage = lazyWithReload(() => import('./pages/MajorMatch/MajorMatchPage'));
const AssistantPage = lazyWithReload(() => import('./pages/Assistant/AssistantPage'));
const AiFillPage = lazyWithReload(() => import('./pages/AiFill/AiFillPage'));

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'rank-conversion', element: <RankConversionPage /> },
      { path: 'score-match', element: <ScoreMatchPage /> },
      { path: 'colleges', element: <CollegeSearchPage /> },
      { path: 'colleges/:id', element: <CollegeDetail /> },
      { path: 'majors/:id', element: <MajorDetail /> },
      { path: 'simulate', element: <SimulatedFormPage /> },
      { path: 'assessment', element: <AssessmentPage /> },
      { path: 'rank-query', element: <RankQueryPage /> },
      { path: 'major-match', element: <MajorMatchPage /> },
      { path: 'college-compare', element: <CollegeComparePage /> },
      { path: 'major-compare', element: <MajorComparePage /> },
      { path: 'assistant', element: <AssistantPage /> },
      { path: 'ai-fill', element: <AiFillPage /> },
      { path: 'policy', element: <PolicyGuidePage /> },
    ],
  },
]);
