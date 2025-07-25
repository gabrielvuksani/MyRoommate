import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";

import ChoreBoard from "@/components/chore-board";
import { Plus } from "lucide-react";

export default function Chores() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [, navigate] = useLocation();
  
  const queryClient = useQueryClient();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: chores = [], isLoading } = useQuery({
    queryKey: ["/api/chores"],
    enabled: !!household,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/households/current/members"],
    enabled: !!household,
  }) as { data: any[] };

  // Use household members if available, otherwise fall back to separate members query
  const householdMembers = (household as any)?.members || members;

  const updateChoreMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/chores/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, { id, updates }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      
      // Send notification for chore completion
      if (updates.status === 'done') {
        const chore = (chores as any[]).find((c: any) => c.id === id);
        if (chore && chore.title) {
          notificationService.showChoreNotification(`✅ ${chore.title} completed!`);
        }
      }
    },
    onError: (error) => {
      console.error('Error updating chore:', error);
    },
  });

  const deleteChoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/chores/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
    },
    onError: (error) => {
      console.error('Error deleting chore:', error);
    },
  });

  const handleUpdateChore = (id: string, updates: any) => {
    updateChoreMutation.mutate({ id, updates });
  };

  const handleDeleteChore = (id: string) => {
    deleteChoreMutation.mutate(id);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Chores</h1>
              <p className="page-subtitle">Manage household tasks</p>
            </div>
            
            <button 
              onClick={() => navigate('/add-chore')}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated">
              <Plus size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
      <div className="content-with-header-compact px-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)'
          }}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'todo' || !c.status).length : 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>To Do</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)'
          }}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#FF9F0A' }}>
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'doing').length : 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>In Progress</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)'
          }}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#30D158' }}>
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'done').length : 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Done</div>
            </CardContent>
          </Card>
        </div>

        {/* All Chores */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)'
        }}>
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>All Chores</h2>
            <ChoreBoard chores={Array.isArray(chores) ? chores : []} onUpdateChore={handleUpdateChore} onDeleteChore={handleDeleteChore} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
