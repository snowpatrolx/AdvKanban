import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/Modal';
import { exportTasksToExcel, downloadJSON } from '../utils/export';
import {
  IconBack, IconChart, IconDatabase, IconDownload, IconUpload, IconFolder,
  IconRefresh, IconTag, IconBook, IconWarning,
} from '../components/common/Icons';
import './DataManagePage.css';

export default function DataManagePage() {
  const navigate = useNavigate();
  const { tasks, categories, knowledge, exportJSON, importJSON, resetAll } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset] = useState(false);

  const handleExportExcel = () => {
    if (tasks.length === 0) {
      addToast({ icon: '⚠', title: '暂无任务可导出' });
      return;
    }
    exportTasksToExcel(tasks, categories);
    addToast({ icon: '✓', title: 'Excel 已导出' });
  };

  const handleExportJSON = () => {
    const json = exportJSON();
    downloadJSON(json, `冒险清单备份_${new Date().toISOString().slice(0, 10)}.json`);
    addToast({ icon: '✓', title: 'JSON 备份已下载' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (importJSON(text)) {
        addToast({ icon: '✓', title: '数据已恢复' });
      } else {
        addToast({ icon: '✗', title: '恢复失败', subtitle: '文件格式不正确' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    resetAll();
    setShowReset(false);
    addToast({ icon: '↻', title: '数据已重置' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate('/profile')}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">数据管理</h1>
      </div>

      {/* 数据统计 */}
      <div className="card data-stats-card">
        <div className="data-stat-row">
          <span className="data-stat-label">
            <IconBook size={18} color="var(--color-primary)" /> 任务
          </span>
          <span>{tasks.length} 条</span>
        </div>
        <div className="data-stat-row">
          <span className="data-stat-label">
            <IconTag size={18} color="var(--color-primary)" /> 分类
          </span>
          <span>{categories.length} 个</span>
        </div>
        <div className="data-stat-row">
          <span className="data-stat-label">
            <IconDatabase size={18} color="var(--color-primary)" /> 知识
          </span>
          <span>{knowledge.length} 条</span>
        </div>
      </div>

      {/* 导出 */}
      <div className="card">
        <h3 className="data-section-title">导出数据</h3>
        <button className="btn btn-primary btn-block data-action-btn" onClick={handleExportExcel}>
          <IconChart size={18} color="#fff" /> 导出任务为 Excel
        </button>
        <button className="btn btn-secondary btn-block data-action-btn" onClick={handleExportJSON}>
          <IconDownload size={18} color="var(--color-text)" /> 导出完整 JSON 备份
        </button>
      </div>

      {/* 恢复 */}
      <div className="card">
        <h3 className="data-section-title">恢复数据</h3>
        <p className="data-hint">从 JSON 备份文件恢复数据，将覆盖当前所有数据</p>
        <button
          className="btn btn-secondary btn-block data-action-btn"
          onClick={() => fileRef.current?.click()}
        >
          <IconFolder size={18} color="var(--color-text)" /> 选择 JSON 文件恢复
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {/* 重置 */}
      <div className="card data-danger-card">
        <h3 className="data-section-title">
          <IconWarning size={18} color="var(--color-danger)" /> 危险操作
        </h3>
        <p className="data-hint">重置将清除所有任务、知识、积分和冒险进度</p>
        <button className="btn btn-danger btn-block data-action-btn" onClick={() => setShowReset(true)}>
          <IconRefresh size={18} color="#fff" /> 重置所有数据
        </button>
      </div>

      <ConfirmDialog
        open={showReset}
        title="重置所有数据"
        message={'确定要清除所有数据吗？此操作不可撤销，所有任务、知识、积分和冒险进度将被删除。'}
        confirmText="确认重置"
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
}
