import { lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import App from './App';

const HomePage = lazy(() => import('./pages/Home/HomePage'));
const ScoreMatchPage = lazy(() => import('./pages/ScoreMatch/ScoreMatchPage'));
const CollegeSearchPage = lazy(() => import('./pages/CollegeSearch/CollegeSearchPage'));
const CollegeDetail = lazy(() => import('./pages/CollegeSearch/CollegeDetail'));
const MajorDetail = lazy(() => import('./pages/CollegeSearch/MajorDetail'));
const SimulatedFormPage = lazy(() => import('./pages/SimulatedForm/SimulatedFormPage'));
const AssessmentPage = lazy(() => import('./pages/Assessment/AssessmentPage'));
const RankConversionPage = lazy(() => import('./pages/RankConversion/RankConversionPage'));
const CollegeComparePage = lazy(() => import('./pages/CollegeCompare/CollegeComparePage'));
const MajorComparePage = lazy(() => import('./pages/MajorCompare/MajorComparePage'));
const PolicyGuidePage = lazy(() => import('./pages/PolicyGuide/PolicyGuidePage'));
const RankQueryPage = lazy(() => import('./pages/RankQuery/RankQueryPage'));
const MajorMatchPage = lazy(() => import('./pages/MajorMatch/MajorMatchPage'));
const AssistantPage = lazy(() => import('./pages/Assistant/AssistantPage'));
const AiFillPage = lazy(() => import('./pages/AiFill/AiFillPage'));

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
