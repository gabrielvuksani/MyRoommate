import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ChoreBoard from "@/components/chore-board";

export default function Chores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    recurrence: '',
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      });
      toast({
        title: "Success",
        description: "Chore created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create chore",
        variant: "destructive",
      });
    },
  });

  const updateChoreMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest("PATCH", `/api/chores/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
    },
  });

  const handleCreateChore = () => {
    if (!newChore.title.trim()) return;
    
    createChoreMutation.mutate({
      ...newChore,
      assignedTo: newChore.assignedTo || null,
    });
  };

  const canCreateChore = newChore.title.trim().length > 0;

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
    <div className="page-container">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Chores</h1>
              <p className="page-subtitle">Manage household tasks</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <button className="w-12 h-12 bg-gradient-to-br from-green to-green-light rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Plus size={20} className="text-white" />
                  </button>
                </DialogTrigger>
              <DialogContent className="modal-content">
                <DialogHeader className="px-6 pt-6 pb-2">
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
                  <Select value={newChore.assignedTo} onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })}>
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Assign to..." />
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
      </div>
      
      {/* Enhanced Chores Layout */}
      <div className="flex-1 page-content-with-header">
        {/* Today's Focus */}
        <div className="px-6 mb-6">
          <div className="smart-card bg-gradient-to-br from-green to-green-light text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Today's Focus</h2>
              <CheckSquare size={24} />
            </div>
            {chores.filter((c: any) => c.dueDate && new Date(c.dueDate).toDateString() === new Date().toDateString()).length > 0 ? (
              <div>
                <p className="text-white/90 mb-3">
                  {chores.filter((c: any) => c.dueDate && new Date(c.dueDate).toDateString() === new Date().toDateString()).length} task{chores.filter((c: any) => c.dueDate && new Date(c.dueDate).toDateString() === new Date().toDateString()).length > 1 ? 's' : ''} due today
                </p>
              </div>
            ) : (
              <p className="text-white/90">All tasks completed! 🎉</p>
            )}
          </div>
        </div>

        {/* Chore Board */}
        <div className="px-6">
          <ChoreBoard chores={chores} onUpdateChore={handleUpdateChore} />
        </div>
      </div>
    </div>
  );
}
