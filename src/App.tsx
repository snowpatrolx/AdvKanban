import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './components/layout/BottomNav';
import ToastContainer from './components/common/ToastContainer';
import HomeKanbanPage from './pages/HomeKanbanPage';
import ProfilePage from './pages/ProfilePage';
import AdventurePage from './pages/AdventurePage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import DailyStatsPage from './pages/DailyStatsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CategoryManagePage from './pages/CategoryManagePage';
import DataManagePage from './pages/DataManagePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const showNav = ['/', '/stats', '/adventure', '/ai', '/profile'].includes(pathname);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeKanbanPage />} />
        <Route path="/adventure" element={<AdventurePage />} />
        <Route path="/ai" element={<AIAnalysisPage />} />
        <Route path="/stats" element={<DailyStatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/task/new" element={<TaskDetailPage />} />
        <Route path="/categories" element={<CategoryManagePage />} />
        <Route path="/data" element={<DataManagePage />} />
      </Routes>
      {showNav && <BottomNav />}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}
