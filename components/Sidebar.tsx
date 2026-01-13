'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchProjects, 
  createProject, 
  deleteProject, 
  renameProject,
  ProjectListItem 
} from '@/lib/projectStore';

// Icons
const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" 
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" 
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <motion.svg 
    className="w-4 h-4 text-gray-500"
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    animate={{ rotate: collapsed ? -90 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </motion.svg>
);

interface SidebarProps {
  currentProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
  onRename?: (id: string, newTitle: string) => void;
  refreshTrigger?: number; // Increment to trigger a refresh
}

export function Sidebar({ currentProjectId, onProjectSelect, onNewProject, onRename, refreshTrigger }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [refreshTrigger]);

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
      // Force focus on next render
      setTimeout(() => {
        const input = document.getElementById(`rename-input-${project.id}`) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  };

  const handleRename = async (id: string) => {
    if (editingTitle.trim()) {
      const newTitle = editingTitle.trim();
      
      // If renaming the current project, update via parent and let auto-save handle persistence
      // This prevents race conditions between the rename API call and auto-save
      if (id === currentProjectId) {
        setProjects(prev => 
          prev.map(p => p.id === id ? { ...p, title: newTitle } : p)
        );
        if (onRename) {
          onRename(id, newTitle);
        }
      } else {
        // For other projects, use the direct API call
        const success = await renameProject(id, newTitle);
        if (success) {
          setProjects(prev => 
            prev.map(p => p.id === id ? { ...p, title: newTitle } : p)
          );
          if (onRename) {
            onRename(id, newTitle);
          }
        }
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
    <motion.aside 
      className="h-screen bg-[#080808] border-r border-white/10 flex flex-col shrink-0"
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-3">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              className="flex items-center gap-3 overflow-hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm tracking-tight text-white">Projects</span>
                <span className="text-[10px] text-gray-500">{projects.length} total</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      {/* New Project Button */}
      <div className="p-3">
        <motion.button
          onClick={handleCreateProject}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-dlm-accent to-amber-500 text-black font-semibold rounded-xl shadow-lg shadow-dlm-accent/20 hover:shadow-dlm-accent/30 transition-shadow ${
          collapsed ? 'justify-center' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm whitespace-nowrap overflow-hidden"
              >
                New Project
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-dlm-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                className="text-center py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-gray-600 mb-3 flex justify-center">
                  <FolderIcon />
                </div>
                <p className="text-xs text-gray-500">No projects yet</p>
                <p className="text-[10px] text-gray-600 mt-1">Create your first project</p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div
                  className={`group relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    currentProjectId === project.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => onProjectSelect(project.id)}
                >
                  {/* Active Indicator */}
                  {currentProjectId === project.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-dlm-accent rounded-full" />
                  )}

                  {/* Thumbnail or Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                    currentProjectId === project.id 
                      ? 'bg-dlm-accent/20 text-dlm-accent' 
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        crossOrigin="anonymous"
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FilmIcon />
                    )}
                  </div>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        className="flex-1 min-w-0 flex items-center justify-between"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {/* Title */}
                        <div className="flex-1 min-w-0 mr-2">
                          {editingId === project.id ? (
                            <input
                              id={`rename-input-${project.id}`}
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
                              className="w-full bg-white/10 px-2 py-1 text-sm text-white rounded-lg border border-dlm-accent/50 outline-none focus:border-dlm-accent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center justify-between group/title">
                              <div className="overflow-hidden">
                                <p 
                                  className={`text-sm truncate font-medium ${
                                    currentProjectId === project.id ? 'text-white' : 'text-gray-300'
                                  }`}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(project.id);
                                    setEditingTitle(project.title);
                                  }}
                                >
                                  {project.title}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {formatDate(project.updatedAt)}
                                </p>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(project.id);
                                  setEditingTitle(project.title);
                                  setTimeout(() => {
                                    const input = document.getElementById(`rename-input-${project.id}`) as HTMLInputElement;
                                    if (input) {
                                      input.focus();
                                      input.select();
                                    }
                                  }, 50);
                                }}
                                className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-white"
                                title="Rename"
                                >
                                <PencilIcon />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        {deleteConfirmId === project.id ? (
                          <div 
                            className="flex items-center gap-1 ml-2" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="px-2 py-1 text-[10px] font-medium bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-[10px] font-medium bg-white/5 text-gray-400 rounded-md hover:bg-white/10 transition-colors"
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
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-gray-500 hover:text-red-400"
                            title="Delete project"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            className="p-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-50">
                 <img src="/logo.png" alt="DLM" className="h-4 w-auto" />
              </div>
              <span className="text-[9px] text-gray-600 font-mono">v2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export default Sidebar;
