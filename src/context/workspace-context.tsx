"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  currentUser: any;
  userRole: string;
  isLoading: boolean;
  setActiveWorkspaceById: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("Member");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // 1. SINGLE AUTH LISTENER (Solves the "Lock Broken" error)
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUser(session.user);
    };
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setCurrentUser(session.user);
      else setCurrentUser(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data: owned } = await supabase.from('workspaces').select('*').eq('owner_id', currentUser.id);
      const { data: memberOf } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', currentUser.id);
      const ids = memberOf?.map(m => m.workspace_id) || [];
      const { data: joined } = await supabase.from('workspaces').select('*').in('id', ids);

      const combined = [...(owned || []), ...(joined || [])];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setWorkspaces(unique);

      const savedId = localStorage.getItem('active_workspace_id');
      if (savedId) {
        const found = unique.find(w => w.id === savedId);
        if (found) setActiveWorkspace(found);
      } else if (unique.length > 0 && !activeWorkspace) {
        setActiveWorkspace(unique[0]);
      }
    } catch (e) {
      console.warn("Retrying fetch...");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) refreshWorkspaces();
  }, [currentUser]);

  // Sync Role
  useEffect(() => {
    const syncRole = async () => {
      if (!currentUser || !activeWorkspace) return;
      if (activeWorkspace.owner_id === currentUser.id) {
        setUserRole("Owner");
      } else {
        const { data } = await supabase.from('workspace_members').select('role').eq('workspace_id', activeWorkspace.id).eq('user_id', currentUser.id).maybeSingle();
        if (data) setUserRole(data.role.charAt(0).toUpperCase() + data.role.slice(1));
      }
    };
    syncRole();
  }, [activeWorkspace, currentUser]);

  const setActiveWorkspaceById = (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('active_workspace_id', id);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, currentUser, userRole, isLoading, setActiveWorkspaceById, refreshWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspaces wrap missing');
  return context;
}
