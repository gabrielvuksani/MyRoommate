import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";

import ChoreBoard from "@/components/chore-board";
import { Plus } from "lucide-react";

export default function Chores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    recurrence: '',
    priority: 'medium',
  });
  
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

  const createChoreMutation = useMutation({
    mutationFn: async (choreData: any) => {
      const dataToSend = {
        ...choreData,
        dueDate: choreData.dueDate ? new Date(choreData.dueDate).toISOString() : null,
      };
      await apiRequest("POST", "/api/chores", dataToSend);
    },
    onSuccess: (_, choreData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      
      // Send notification for new chore assignment
      if (choreData.assignedTo && choreData.title && Array.isArray(members)) {
        const assignedUser = members.find((m: any) => m.user.id === choreData.assignedTo);
        const assignedName = assignedUser ? `${assignedUser.user.firstName || assignedUser.user.email?.split('@')[0]}` : 'someone';
        notificationService.showChoreNotification(choreData.title, assignedName);
      }
      
      setIsCreateOpen(false);
      setNewChore({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: new Date().toISOString().split('T')[0], // Reset to today's date
        recurrence: '',
        priority: 'medium',
      });
    },
    onError: (error) => {
      console.error("Failed to create chore:", error);
    },
  });

  const updateChoreMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/chores/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
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

  const handleCreateChore = () => {
    if (!newChore.title.trim()) return;
    
    createChoreMutation.mutate({
      ...newChore,
      assignedTo: newChore.assignedTo || null,
    });
  };

  const canCreateChore = newChore.title.trim().length > 0 && 
                         newChore.assignedTo.length > 0 && 
                         newChore.dueDate.length > 0;

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
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <button className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated">
                  <Plus size={24} className="text-white" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="px-6 pt-6 pb-6">
                  <DialogTitle className="text-title-2 font-bold text-primary">Create New Chore</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-5">
                  <input
                    placeholder="Chore title"
                    value={newChore.title}
                    onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                    className="input-modern w-full"
                  />
                  <input
                    placeholder="Description (optional)"
                    value={newChore.description}
                    onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                    className="input-modern w-full"
                  />
                  <Select value={newChore.assignedTo} onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })} required>
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Assign to... *" />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      zIndex: 9999
                    }}>
                      {Array.isArray(members) && members.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId} style={{ color: 'var(--text-primary)' }}>
                          {member.user.firstName || member.user.email?.split('@')[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input 
                    type="date"
                    value={newChore.dueDate}
                    onChange={(e) => setNewChore({ ...newChore, dueDate: e.target.value })}
                    className="input-modern w-full"
                    required
                  />
                  <Select value={newChore.recurrence} onValueChange={(value) => setNewChore({ ...newChore, recurrence: value })}>
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Recurrence..." />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      zIndex: 9999
                    }}>
                      <SelectItem value="daily" style={{ color: 'var(--text-primary)' }}>Daily</SelectItem>
                      <SelectItem value="weekly" style={{ color: 'var(--text-primary)' }}>Weekly</SelectItem>
                      <SelectItem value="monthly" style={{ color: 'var(--text-primary)' }}>Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={newChore.priority} onValueChange={(value) => setNewChore({ ...newChore, priority: value })}>
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Priority..." />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      zIndex: 9999
                    }}>
                      <SelectItem value="low" style={{ color: 'var(--text-primary)' }}>Low Priority</SelectItem>
                      <SelectItem value="medium" style={{ color: 'var(--text-primary)' }}>Medium Priority</SelectItem>
                      <SelectItem value="high" style={{ color: 'var(--text-primary)' }}>High Priority</SelectItem>
                      <SelectItem value="urgent" style={{ color: 'var(--text-primary)' }}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={handleCreateChore}
                    disabled={!canCreateChore || createChoreMutation.isPending}
                    className="btn-primary w-full"
                  >
                    {createChoreMutation.isPending ? "Creating..." : "Create Chore"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div className="pt-32 px-6 space-y-6">
        {/* Today's Focus */}
        {Array.isArray(chores) && chores.length > 0 && (
          <Card className="glass-card" style={{ 
            border: '1px solid var(--border-color)',
            background: 'var(--surface-secondary)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                  background: 'var(--surface-overlay)'
                }}>
                  <span className="font-semibold" style={{ color: 'var(--primary)' }}>🎯</span>
                </div>
                <h2 className="font-semibold text-[22px]" style={{ color: 'var(--text-primary)' }}>Today's Focus</h2>
              </div>
              
              {(() => {
                const urgentChores = chores.filter((c: any) => 
                  (c.status === 'todo' || !c.status) && 
                  c.priority === 'urgent'
                );
                const overdueChores = chores.filter((c: any) => 
                  (c.status === 'todo' || !c.status) && 
                  c.dueDate && new Date(c.dueDate) < new Date()
                );
                const priorityChore = urgentChores[0] || overdueChores[0] || 
                  chores.find((c: any) => c.status === 'todo' || !c.status);
                
                if (!priorityChore) {
                  return (
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>All caught up! No pending chores.
                                          </p>
                  );
                }
                
                return (
                  <div className="rounded-xl p-4 hover:shadow-sm transition-shadow" style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface)'
                  }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-body font-semibold mb-1" style={{ color: 'var(--primary)' }}>{priorityChore.title}</h3>
                        {priorityChore.description && (
                          <p className="text-footnote mb-2" style={{ color: 'var(--text-secondary)' }}>{priorityChore.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-footnote" style={{ color: 'var(--text-secondary)' }}>
                          <span>{priorityChore.assignedUser?.firstName || priorityChore.assignedUser?.email?.split('@')[0] || 'Unassigned'}</span>
                          {priorityChore.dueDate && (
                            <>
                              <span>•</span>
                              <span className={new Date(priorityChore.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                Due {new Date(priorityChore.dueDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {priorityChore.priority && (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                            background: priorityChore.priority === 'urgent' ? 'rgba(255, 69, 58, 0.1)' :
                                       priorityChore.priority === 'high' ? 'rgba(255, 159, 10, 0.1)' :
                                       priorityChore.priority === 'medium' ? 'rgba(0, 122, 255, 0.1)' :
                                       'var(--surface-secondary)',
                            color: priorityChore.priority === 'urgent' ? '#FF453A' :
                                  priorityChore.priority === 'high' ? '#FF9F0A' :
                                  priorityChore.priority === 'medium' ? 'var(--primary)' :
                                  'var(--text-secondary)'
                          }}>
                            {priorityChore.priority === 'urgent' ? '🔥' :
                             priorityChore.priority === 'high' ? '⚡' :
                             priorityChore.priority === 'medium' ? '📌' : '📝'} {priorityChore.priority.charAt(0).toUpperCase() + priorityChore.priority.slice(1)}
                          </span>
                        )}
                        
                        <div className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                          background: 'rgba(0, 122, 255, 0.1)',
                          color: 'var(--primary)'
                        }}>
                          To Do
                        </div>
                      </div>
                    </div>

                    {priorityChore.dueDate && new Date(priorityChore.dueDate) < new Date() && (
                      <div className="mb-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                          background: 'rgba(255, 69, 58, 0.1)',
                          color: '#FF453A'
                        }}>
                          ⚠️ Overdue
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateChore(priorityChore.id, { status: 'doing' })}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

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
