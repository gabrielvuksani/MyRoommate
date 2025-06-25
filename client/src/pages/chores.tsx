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
      <div className="h-6 bg-surface-elevated"></div>
      
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-large-title font-bold text-primary">Chores</h1>
            <p className="text-subhead text-secondary mt-2">Keep the house running smoothly</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary rounded-full w-12 h-12 flex items-center justify-center text-xl">
                +
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Chore</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Chore title"
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                />
                <Select value={newChore.assignedTo} onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {household?.members?.map((member: any) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user.firstName || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newChore.dueDate}
                  onChange={(e) => setNewChore({ ...newChore, dueDate: e.target.value })}
                />
                <Select value={newChore.recurrence} onValueChange={(value) => setNewChore({ ...newChore, recurrence: value })}>
                  <SelectTrigger>
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
      
      <div className="page-content">
        <ChoreBoard chores={chores} onUpdateChore={handleUpdateChore} />
      </div>
    </div>
  );
}
