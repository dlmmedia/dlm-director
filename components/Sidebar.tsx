'use client';

import React, { useState, useEffect } from 'react';
import { 
  fetchProjects, 
  createProject, 
  deleteProject, 
  renameProject,
  ProjectListItem 
} from '@/lib/projectStore';

// Icons
const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg 
    className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface SidebarProps {
  currentProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
}

export function Sidebar({ currentProjectId, onProjectSelect, onNewProject }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleCreateProject = async () => {
    const project = await createProject('New Project');
    if (project) {
      setProjects(prev => [project, ...prev]);
      onProjectSelect(project.id);
      setEditingId(project.id);
      setEditingTitle('New Project');
    }
  };

  const handleRename = async (id: string) => {
    if (editingTitle.trim()) {
      const success = await renameProject(id, editingTitle.trim());
      if (success) {
        setProjects(prev => 
          prev.map(p => p.id === id ? { ...p, title: editingTitle.trim() } : p)
        );
      }
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProject(id);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProjectId === id) {
        onNewProject();
      }
    }
    setDeleteConfirmId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside 
      className={`h-screen bg-[#0a0a0a] border-r border-dlm-700 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-dlm-700 flex items-center justify-between px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-dlm-accent to-yellow-700 rounded-lg flex items-center justify-center text-black font-bold font-serif text-sm">
              D
            </div>
            <span className="font-serif font-bold text-sm">Projects</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-dlm-700 rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      {/* New Project Button */}
      <div className="p-2">
        <button
          onClick={handleCreateProject}
          className={`w-full flex items-center gap-2 px-3 py-2 bg-dlm-accent text-black font-medium rounded-lg hover:bg-dlm-accentHover transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <PlusIcon />
          {!collapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-dlm-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className={`text-center py-8 text-gray-500 ${collapsed ? 'hidden' : ''}`}>
            <FolderIcon />
            <p className="text-xs mt-2">No projects yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div
                  className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentProjectId === project.id
                      ? 'bg-dlm-700 border border-dlm-accent/30'
                      : 'hover:bg-dlm-800 border border-transparent'
                  }`}
                  onClick={() => onProjectSelect(project.id)}
                >
                  {/* Thumbnail or Icon */}
                  <div className="w-8 h-8 rounded bg-dlm-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FilmIcon />
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        {editingId === project.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRename(project.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(project.id);
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditingTitle('');
                              }
                            }}
                            className="w-full bg-dlm-900 px-1 py-0.5 text-sm rounded border border-dlm-accent outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <p 
                              className="text-sm truncate"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingId(project.id);
                                setEditingTitle(project.title);
                              }}
                            >
                              {project.title}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {formatDate(project.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Delete Button */}
                      {deleteConfirmId === project.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-dlm-600 rounded hover:bg-dlm-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(project.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 rounded transition-all text-gray-400 hover:text-red-400"
                          title="Delete project"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-dlm-700">
          <p className="text-[10px] text-gray-600 text-center">
            DLM Director • Elite Edition
          </p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
