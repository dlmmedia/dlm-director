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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  FolderIcon, 
  PlusIcon, 
  Trash2, 
  Film, 
  Pencil, 
  ChevronDown,
  Loader2
} from 'lucide-react';

interface SidebarProps {
  currentProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
  onRename?: (id: string, newTitle: string) => void;
  refreshTrigger?: number;
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
    onNewProject();
  };

  const handleRename = async (id: string) => {
    if (editingTitle.trim()) {
      const newTitle = editingTitle.trim();
      const success = await renameProject(id, newTitle);
      if (success) {
        setProjects(prev => 
          prev.map(p => p.id === id ? { ...p, title: newTitle } : p)
        );
        if (id === currentProjectId && onRename) {
          onRename(id, newTitle);
        }
      }
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProject(id);
    if (success) {
      await loadProjects();
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
      className="h-screen bg-card border-r border-border flex flex-col shrink-0 transition-colors duration-300"
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-3">
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
                <span className="font-medium text-sm tracking-tight">Projects</span>
                <span className="text-xs text-muted-foreground">{projects.length} total</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </Button>
      </div>

      {/* New Project Button */}
      <div className="p-3">
        <Button
          onClick={handleCreateProject}
          variant="gold"
          className={cn("w-full", collapsed && "px-2")}
        >
          <PlusIcon className="w-4 h-4" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                New Project
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
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
                <div className="text-muted-foreground mb-3 flex justify-center">
                  <FolderIcon className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Create your first project</p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <ul className="space-y-1 py-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div
                  className={cn(
                    "group relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer transition-colors",
                    currentProjectId === project.id
                      ? 'bg-accent/20'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onProjectSelect(project.id)}
                >
                  {/* Active Indicator */}
                  {currentProjectId === project.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full" />
                  )}

                  {/* Thumbnail or Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                    currentProjectId === project.id 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        crossOrigin="anonymous"
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-4 h-4" />
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
                            <Input
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
                              className="h-7 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center justify-between group/title">
                              <div className="overflow-hidden">
                                <p 
                                  className={cn(
                                    "text-sm truncate font-medium",
                                    currentProjectId === project.id ? 'text-foreground' : 'text-foreground/80'
                                  )}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(project.id);
                                    setEditingTitle(project.title);
                                  }}
                                >
                                  {project.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatDate(project.updatedAt)}
                                </p>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover/title:opacity-100 h-6 w-6"
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
                                title="Rename"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        {deleteConfirmId === project.id ? (
                          <div 
                            className="flex items-center gap-1 ml-2" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleDelete(project.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(project.id);
                            }}
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            className="p-4 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-50">
                <img src="/logo.png" alt="DLM" className="h-4 w-auto dark:brightness-100 brightness-90" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">v2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export default Sidebar;
