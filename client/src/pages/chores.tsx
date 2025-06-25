import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

import ChoreBoard from "@/components/chore-board";
import { Plus } from "lucide-react";

export default function Chores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    recurrence: '',
    priority: 'medium',
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
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

  const createChoreMutation = useMutation({
    mutationFn: async (choreData: any) => {
      const dataToSend = {
        ...choreData,
        dueDate: choreData.dueDate ? new Date(choreData.dueDate).toISOString() : null,
      };
      await apiRequest("POST", "/api/chores", dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      setIsCreateOpen(false);
      setNewChore({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
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
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Assign to... *" />
                    </SelectTrigger>
                    <SelectContent>
                      {household?.members?.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId}>
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
                    placeholder="Due date *"
                  />
                  <Select value={newChore.recurrence} onValueChange={(value) => setNewChore({ ...newChore, recurrence: value })}>
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Recurrence..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={newChore.priority} onValueChange={(value) => setNewChore({ ...newChore, priority: value })}>
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
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
      <div className="page-content space-y-6">
        {/* Today's Focus */}
        {Array.isArray(chores) && chores.length > 0 && (
          <Card className="glass-card border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">🎯</span>
                </div>
                <h2 className="font-semibold text-[#1a1a1a] text-[22px]">Today's Focus</h2>
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
                    <p className="font-medium text-[#1a1a1a]">All caught up! No pending chores.
                                          </p>
                  );
                }
                
                return (
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                    <h3 className="font-semibold text-primary mb-2">{priorityChore.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-secondary mb-3">
                      <span>{priorityChore.assignedUser?.firstName || 'Unassigned'}</span>
                      {priorityChore.dueDate && (
                        <span className={new Date(priorityChore.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                          Due {new Date(priorityChore.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {priorityChore.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          priorityChore.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          priorityChore.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {priorityChore.priority.charAt(0).toUpperCase() + priorityChore.priority.slice(1)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleUpdateChore(priorityChore.id, { status: 'doing' })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Start Now
                    </button>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'todo' || !c.status).length : 0}
              </div>
              <div className="text-sm text-secondary">To Do</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'doing').length : 0}
              </div>
              <div className="text-sm text-secondary">In Progress</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {Array.isArray(chores) ? chores.filter((c: any) => c.status === 'done').length : 0}
              </div>
              <div className="text-sm text-secondary">Done</div>
            </CardContent>
          </Card>
        </div>

        {/* All Chores */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold text-primary mb-4">All Chores</h2>
            <ChoreBoard chores={Array.isArray(chores) ? chores : []} onUpdateChore={handleUpdateChore} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
