import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import BottomNav from './components/layout/BottomNav';
import ToastContainer from './components/common/ToastContainer';
import WheelHomePage from './pages/WheelHomePage';
import HomeKanbanPage from './pages/HomeKanbanPage';
import ProfilePage from './pages/ProfilePage';
import AdventurePage from './pages/AdventurePage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import DailyStatsPage from './pages/DailyStatsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CategoryManagePage from './pages/CategoryManagePage';
import TagManagePage from './pages/TagManagePage';
import DataManagePage from './pages/DataManagePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// 跨天检测：每日任务每天自动重置
function DailyResetWatcher() {
  const resetDailyTasks = useStore(s => s.resetDailyTasks);
  const syncRepeatDates = useStore(s => s.syncRepeatDates);

  useEffect(() => {
    const run = () => {
      resetDailyTasks();
      syncRepeatDates();
    };
    run();

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(run, 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [resetDailyTasks, syncRepeatDates]);

  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const showNav = ['/', '/kanban', '/stats', '/adventure', '/ai', '/profile'].includes(pathname);

  return (
    <>
      <ScrollToTop />
      <DailyResetWatcher />
      <Routes>
        <Route path="/" element={<WheelHomePage />} />
        <Route path="/kanban" element={<HomeKanbanPage />} />
        <Route path="/adventure" element={<AdventurePage />} />
        <Route path="/ai" element={<AIAnalysisPage />} />
        <Route path="/stats" element={<DailyStatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/task/new" element={<TaskDetailPage />} />
        <Route path="/categories" element={<CategoryManagePage />} />
        <Route path="/tags" element={<TagManagePage />} />
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
