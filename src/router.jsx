import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/Home/HomePage';
import ScoreMatchPage from './pages/ScoreMatch/ScoreMatchPage';
import CollegeSearchPage from './pages/CollegeSearch/CollegeSearchPage';
import CollegeDetail from './pages/CollegeSearch/CollegeDetail';
import MajorDetail from './pages/CollegeSearch/MajorDetail';
import SimulatedFormPage from './pages/SimulatedForm/SimulatedFormPage';
import AssessmentPage from './pages/Assessment/AssessmentPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'score-match', element: <ScoreMatchPage /> },
      { path: 'colleges', element: <CollegeSearchPage /> },
      { path: 'colleges/:id', element: <CollegeDetail /> },
      { path: 'majors/:id', element: <MajorDetail /> },
      { path: 'simulate', element: <SimulatedFormPage /> },
      { path: 'assessment', element: <AssessmentPage /> },
    ],
  },
]);
