import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './components/layout/BottomNav';
import ToastContainer from './components/common/ToastContainer';
import HomeKanbanPage from './pages/HomeKanbanPage';
import KnowledgePage from './pages/KnowledgePage';
import ProfilePage from './pages/ProfilePage';
import AdventurePage from './pages/AdventurePage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import TaskDetailPage from './pages/TaskDetailPage';
import KnowledgeDetailPage from './pages/KnowledgeDetailPage';
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
  const showNav = ['/', '/knowledge', '/adventure', '/ai', '/profile'].includes(pathname);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeKanbanPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/adventure" element={<AdventurePage />} />
        <Route path="/ai" element={<AIAnalysisPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/task/new" element={<TaskDetailPage />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
        <Route path="/knowledge/new" element={<KnowledgeDetailPage />} />
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
