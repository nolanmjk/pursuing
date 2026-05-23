import { createHashRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/Home/HomePage';
import ScoreMatchPage from './pages/ScoreMatch/ScoreMatchPage';
import CollegeSearchPage from './pages/CollegeSearch/CollegeSearchPage';
import CollegeDetail from './pages/CollegeSearch/CollegeDetail';
import MajorDetail from './pages/CollegeSearch/MajorDetail';
import SimulatedFormPage from './pages/SimulatedForm/SimulatedFormPage';
import AssessmentPage from './pages/Assessment/AssessmentPage';
import RankConversionPage from './pages/RankConversion/RankConversionPage';
import CollegeComparePage from './pages/CollegeCompare/CollegeComparePage';
import MajorComparePage from './pages/MajorCompare/MajorComparePage';
import PolicyGuidePage from './pages/PolicyGuide/PolicyGuidePage';
import RankQueryPage from './pages/RankQuery/RankQueryPage';
import MajorMatchPage from './pages/MajorMatch/MajorMatchPage';
import AssistantPage from './pages/Assistant/AssistantPage';
import AiFillPage from './pages/AiFill/AiFillPage';

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
