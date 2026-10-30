import { NavLink } from 'react-router-dom';
import { IconTasks, IconList, IconChart, IconNote, IconMap, IconUser } from '../common/Icons';
import './BottomNav.css';

const tabs = [
  { path: '/', label: '首页', Icon: IconTasks },
  { path: '/kanban', label: '任务', Icon: IconList },
  { path: '/notes', label: '便签', Icon: IconNote },
  { path: '/adventure', label: '冒险', Icon: IconMap },
  { path: '/profile', label: '我的', Icon: IconUser },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <tab.Icon size={22} color="currentColor" className="nav-icon" />
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
