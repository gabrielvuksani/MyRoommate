import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      // Handle date formatting for completedAt
      const formattedUpdates = { ...updates };
      if (formattedUpdates.completedAt) {
        formattedUpdates.completedAt = new Date(formattedUpdates.completedAt);
      }
      
      await apiRequest("PATCH", `/api/chores/${id}`, formattedUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({
        title: "Success",
        description: "Chore updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating chore:', error);
      toast({
        title: "Error",
        description: "Failed to update chore",
        variant: "destructive",
      });
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
    <div className="page-container animate-page-enter">
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
      
      <div className="page-content">
        <ChoreBoard chores={chores} onUpdateChore={handleUpdateChore} />
      </div>
    </div>
  );
}
