import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ListTodo, 
  Clock, 
  CalendarDays, 
  AlertCircle, 
  CheckSquare,
  User,
  Tag,
  Bell,
  Repeat,
  FileText,
  Timer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import BackButton from "@/components/back-button";

interface NewChore {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  dueTime: string;
  priority: string;
  recurrence: string;
  category: string;
  estimatedDuration: string;
  reminder: string;
  notes: string;
  subtasks: string[];
}

export function AddChore() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  
  const [newChore, setNewChore] = useState<NewChore>({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: today,
    dueTime: "",
    priority: "medium",
    recurrence: "",
    category: "general",
    estimatedDuration: "30",
    reminder: "none",
    notes: "",
    subtasks: []
  });

  const [currentSubtask, setCurrentSubtask] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const householdMembers = (household as any)?.members || [];

  const createChoreMutation = useMutation({
    mutationFn: async (choreData: any) => {
      const response = await apiRequest("POST", "/api/chores", choreData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      navigate("/chores");
    },
  });

  const handleCreateChore = () => {
    if (!canCreateChore) return;

    const choreData = {
      title: newChore.title.trim(),
      description: newChore.description.trim(),
      assignedTo: newChore.assignedTo,
      dueDate: newChore.dueTime 
        ? `${newChore.dueDate}T${newChore.dueTime}:00` 
        : `${newChore.dueDate}T23:59:00`,
      priority: newChore.priority,
      recurrence: newChore.recurrence || null,
      status: "todo",
      category: newChore.category,
      estimatedDuration: parseInt(newChore.estimatedDuration),
      reminder: newChore.reminder,
      notes: newChore.notes.trim(),
      subtasks: newChore.subtasks.filter(task => task.trim())
    };

    createChoreMutation.mutate(choreData);
  };

  const canCreateChore =
    newChore.title.trim().length > 0 &&
    newChore.assignedTo.length > 0 &&
    newChore.dueDate.length > 0;

  const addSubtask = () => {
    if (currentSubtask.trim()) {
      setNewChore({
        ...newChore,
        subtasks: [...newChore.subtasks, currentSubtask.trim()]
      });
      setCurrentSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setNewChore({
      ...newChore,
      subtasks: newChore.subtasks.filter((_, i) => i !== index)
    });
  };

  const choreCategories = [
    { value: "general", label: "🏠 General", icon: "🏠" },
    { value: "kitchen", label: "🍳 Kitchen", icon: "🍳" },
    { value: "bathroom", label: "🚿 Bathroom", icon: "🚿" },
    { value: "bedroom", label: "🛏️ Bedroom", icon: "🛏️" },
    { value: "living", label: "🛋️ Living Room", icon: "🛋️" },
    { value: "outdoor", label: "🌿 Outdoor", icon: "🌿" },
    { value: "laundry", label: "👔 Laundry", icon: "👔" },
    { value: "maintenance", label: "🔧 Maintenance", icon: "🔧" },
    { value: "shopping", label: "🛒 Shopping", icon: "🛒" },
    { value: "finance", label: "💰 Finance", icon: "💰" }
  ];

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center space-x-3">
            <BackButton to="/chores" />
            <div>
              <h1 className="page-title">Create Chore</h1>
              <p className="page-subtitle">Add a new task or chore</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-with-header-compact px-6 space-y-6 pb-32">
        
        {/* Basic Details */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <ListTodo size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Chore Details</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What needs to be done?</p>
              </div>
            </div>

            <input
              placeholder="What's the task?"
              value={newChore.title}
              onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
              className="w-full h-14 px-4 rounded-xl text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />

            <Textarea
              placeholder="Add more details (optional)"
              value={newChore.description}
              onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
              className="w-full min-h-[100px] p-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />

            <Select
              value={newChore.category}
              onValueChange={(value) => setNewChore({ ...newChore, category: value })}
            >
              <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choreCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Assignment & Priority */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Assignment</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Who's responsible?</p>
              </div>
            </div>

            <Select
              value={newChore.assignedTo}
              onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })}
            >
              <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue placeholder="Select household member..." />
              </SelectTrigger>
              <SelectContent>
                {householdMembers.map((member: any) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.firstName || member.user.email?.split('@')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newChore.priority}
              onValueChange={(value) => setNewChore({ ...newChore, priority: value })}
            >
              <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low Priority</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                <SelectItem value="high">🟠 High Priority</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <CalendarDays size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Schedule</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>When is it due?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={newChore.dueDate}
                  onChange={(e) => setNewChore({ ...newChore, dueDate: e.target.value })}
                  className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ 
                    background: 'var(--surface-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Due Time (Optional)
                </label>
                <input
                  type="time"
                  value={newChore.dueTime}
                  onChange={(e) => setNewChore({ ...newChore, dueTime: e.target.value })}
                  className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ 
                    background: 'var(--surface-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Estimated Duration
              </label>
              <Select
                value={newChore.estimatedDuration}
                onValueChange={(value) => setNewChore({ ...newChore, estimatedDuration: value })}
              >
                <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Recurrence
              </label>
              <Select
                value={newChore.recurrence}
                onValueChange={(value) => setNewChore({ ...newChore, recurrence: value })}
              >
                <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="One-time task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time task</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reminders & Notifications */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Reminders</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get notified before it's due</p>
              </div>
            </div>

            <Select
              value={newChore.reminder}
              onValueChange={(value) => setNewChore({ ...newChore, reminder: value })}
            >
              <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No reminder</SelectItem>
                <SelectItem value="5min">5 minutes before</SelectItem>
                <SelectItem value="15min">15 minutes before</SelectItem>
                <SelectItem value="30min">30 minutes before</SelectItem>
                <SelectItem value="1hour">1 hour before</SelectItem>
                <SelectItem value="2hours">2 hours before</SelectItem>
                <SelectItem value="1day">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Subtasks */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                <CheckSquare size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Subtasks</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Break it down into smaller steps</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <input
                placeholder="Add a subtask"
                value={currentSubtask}
                onChange={(e) => setCurrentSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                className="flex-1 h-12 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ 
                  background: 'var(--surface-secondary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={addSubtask}
                disabled={!currentSubtask.trim()}
                className="px-4 h-12 rounded-xl font-medium transition-all hover:scale-105"
                style={{
                  background: currentSubtask.trim() ? 'var(--primary)' : 'var(--surface-secondary)',
                  color: currentSubtask.trim() ? 'white' : 'var(--text-secondary)',
                  opacity: currentSubtask.trim() ? 1 : 0.5
                }}
              >
                Add
              </button>
            </div>

            {newChore.subtasks.length > 0 && (
              <div className="space-y-2">
                {newChore.subtasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl" style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>{task}</span>
                    <button
                      onClick={() => removeSubtask(index)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notes</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Any additional information</p>
              </div>
            </div>

            <Textarea
              placeholder="Add notes, instructions, or special requirements..."
              value={newChore.notes}
              onChange={(e) => setNewChore({ ...newChore, notes: e.target.value })}
              className="w-full min-h-[120px] p-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Pinned Create Button Above Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[430px] mx-auto px-4 pb-28">
          <button
            onClick={handleCreateChore}
            disabled={!canCreateChore || createChoreMutation.isPending}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300 pointer-events-auto transform ${
              canCreateChore && !createChoreMutation.isPending
                ? 'hover:scale-[1.02] active:scale-[0.98]'
                : 'opacity-60 cursor-not-allowed'
            }`}
            style={{
              background: canCreateChore && !createChoreMutation.isPending
                ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)'
                : 'var(--surface-secondary)',
              color: canCreateChore && !createChoreMutation.isPending
                ? 'white'
                : 'var(--text-secondary)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: canCreateChore && !createChoreMutation.isPending
                ? '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 2px 12px rgba(255, 255, 255, 0.2)'
                : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 2px 8px rgba(255, 255, 255, 0.1)'
            }}
          >
            {createChoreMutation.isPending ? "Creating..." : "Create Chore"}
          </button>
        </div>
      </div>
    </div>
  );
}