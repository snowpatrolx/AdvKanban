import { NavLink } from 'react-router-dom';
import { IconTasks, IconChart, IconMap, IconUser } from '../common/Icons';
import './BottomNav.css';

const tabs = [
  { path: '/', label: '任务', Icon: IconTasks },
  { path: '/stats', label: '统计', Icon: IconChart },
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
