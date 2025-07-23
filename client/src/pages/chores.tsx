import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Calendar,
  Filter,
  Search,
  MoreVertical,
  CheckSquare,
  Square,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Users,
  ChevronDown,
  X
} from "lucide-react";

type ViewMode = 'overview' | 'my-tasks' | 'all-tasks' | 'completed';
type FilterType = 'all' | 'urgent' | 'today' | 'overdue' | 'assigned-to-me';
type SortType = 'priority' | 'due-date' | 'created' | 'alphabetical';

export default function Chores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSortType] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0],
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

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/households/current/members"],
    enabled: !!household,
  }) as { data: any[] };

  const householdMembers = (household as any)?.members || members;

  // Enhanced chore processing with smart categorization
  const processedChores = useMemo(() => {
    if (!chores || !user) return { all: [], urgent: [], today: [], overdue: [], myTasks: [], completed: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const categorized = {
      all: (chores as any[]).filter((chore: any) => chore.status !== 'done'),
      urgent: [] as any[],
      today: [] as any[],
      overdue: [] as any[],
      myTasks: (chores as any[]).filter((chore: any) => chore.assignedTo === user.id && chore.status !== 'done'),
      completed: (chores as any[]).filter((chore: any) => chore.status === 'done'),
    };

    categorized.all.forEach((chore: any) => {
      const dueDate = chore.dueDate ? new Date(chore.dueDate) : null;
      
      // Priority-based urgent classification
      if (chore.priority === 'urgent') {
        categorized.urgent.push(chore);
      }
      
      // Due today
      if (dueDate && dueDate >= today && dueDate < tomorrow) {
        categorized.today.push(chore);
      }
      
      // Overdue
      if (dueDate && dueDate < today) {
        categorized.overdue.push(chore);
        if (!categorized.urgent.includes(chore)) {
          categorized.urgent.push(chore);
        }
      }
    });

    return categorized;
  }, [chores, user]);

  // Smart filtering and sorting
  const filteredAndSortedChores = useMemo(() => {
    let filtered = [...processedChores.all];

    // Apply filters
    switch (filter) {
      case 'urgent':
        filtered = processedChores.urgent;
        break;
      case 'today':
        filtered = processedChores.today;
        break;
      case 'overdue':
        filtered = processedChores.overdue;
        break;
      case 'assigned-to-me':
        filtered = processedChores.myTasks;
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((chore: any) =>
        chore.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chore.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sort) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          if (aPriority !== bPriority) return bPriority - aPriority;
          // Secondary sort by due date
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDue - bDue;
        case 'due-date':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDate - bDate;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedChores, filter, searchQuery, sort]);

  // Statistics for overview
  const stats = useMemo(() => {
    const total = processedChores.all.length;
    const completed = processedChores.completed.length;
    const myTasks = processedChores.myTasks.length;
    const urgent = processedChores.urgent.length;
    const overdue = processedChores.overdue.length;
    const today = processedChores.today.length;
    const completionRate = total > 0 ? Math.round((completed / (total + completed)) * 100) : 0;

    return { total, completed, myTasks, urgent, overdue, today, completionRate };
  }, [processedChores]);

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
      
      setIsCreateOpen(false);
      setNewChore({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: new Date().toISOString().split('T')[0],
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
                      border: '1px solid var(--border-color)'
                    }}>
                      {Array.isArray(householdMembers) && householdMembers.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId} style={{ color: 'var(--text-primary)' }}>
                          {member.user.firstName || member.user.email?.split('@')[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newChore.priority} onValueChange={(value) => setNewChore({ ...newChore, priority: value })}>
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <SelectItem value="low" style={{ color: 'var(--text-primary)' }}>🟢 Low</SelectItem>
                      <SelectItem value="medium" style={{ color: 'var(--text-primary)' }}>🟡 Medium</SelectItem>
                      <SelectItem value="high" style={{ color: 'var(--text-primary)' }}>🟠 High</SelectItem>
                      <SelectItem value="urgent" style={{ color: 'var(--text-primary)' }}>🔴 Urgent</SelectItem>
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
                      border: '1px solid var(--border-color)'
                    }}>
                      <SelectItem value="daily" style={{ color: 'var(--text-primary)' }}>Daily</SelectItem>
                      <SelectItem value="weekly" style={{ color: 'var(--text-primary)' }}>Weekly</SelectItem>
                      <SelectItem value="monthly" style={{ color: 'var(--text-primary)' }}>Monthly</SelectItem>
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
                const urgentChores = (chores as any[]).filter((c: any) => 
                  (c.status === 'todo' || !c.status) && 
                  c.priority === 'urgent'
                );
                const overdueChores = (chores as any[]).filter((c: any) => 
                  (c.status === 'todo' || !c.status) && 
                  c.dueDate && new Date(c.dueDate) < new Date()
                );
                const priorityChore = urgentChores[0] || overdueChores[0] || 
                  (chores as any[]).find((c: any) => c.status === 'todo' || !c.status);
                
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
                          <span>{householdMembers.find((m: any) => m.userId === priorityChore.assignedTo)?.user?.firstName || 'Unassigned'}</span>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>All Tasks</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg text-sm"
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1"
                  >
                    <Filter size={16} />
                    <span>Filter</span>
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="justify-start"
                  >
                    All ({processedChores.all.length})
                  </Button>
                  <Button
                    variant={filter === 'urgent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('urgent')}
                    className="justify-start"
                  >
                    🔥 Urgent ({processedChores.urgent.length})
                  </Button>
                  <Button
                    variant={filter === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('today')}
                    className="justify-start"
                  >
                    📅 Today ({processedChores.today.length})
                  </Button>
                  <Button
                    variant={filter === 'assigned-to-me' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('assigned-to-me')}
                    className="justify-start"
                  >
                    👤 My Tasks ({processedChores.myTasks.length})
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {filteredAndSortedChores.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      All caught up!
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {searchQuery ? 'No tasks match your search.' : 'No tasks in this category.'}
                    </p>
                  </div>
                ) : (
                  filteredAndSortedChores.map((chore: any) => (
                    <div
                      key={chore.id}
                      className="rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                      style={{
                        border: '1px solid var(--border-color)',
                        background: 'var(--surface-secondary)'
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateChore(chore.id, { 
                            status: chore.status === 'done' ? 'todo' : 'done' 
                          })}
                          className="mt-1 p-0 w-6 h-6 rounded-full"
                        >
                          {chore.status === 'done' ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : (
                            <Circle size={20} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 
                                className={`font-medium mb-1 ${chore.status === 'done' ? 'line-through opacity-60' : ''}`}
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {chore.title}
                              </h3>
                              {chore.description && (
                                <p 
                                  className={`text-sm mb-2 ${chore.status === 'done' ? 'line-through opacity-60' : ''}`}
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {chore.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span>
                                  {householdMembers.find((m: any) => m.userId === chore.assignedTo)?.user?.firstName || 'Unassigned'}
                                </span>
                                {chore.dueDate && (
                                  <>
                                    <span>•</span>
                                    <span className={new Date(chore.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                                      Due {new Date(chore.dueDate).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              {chore.priority && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    background: chore.priority === 'urgent' ? 'rgba(255, 69, 58, 0.1)' :
                                               chore.priority === 'high' ? 'rgba(255, 159, 10, 0.1)' :
                                               chore.priority === 'medium' ? 'rgba(0, 122, 255, 0.1)' :
                                               'var(--surface-secondary)',
                                    color: chore.priority === 'urgent' ? '#FF453A' :
                                          chore.priority === 'high' ? '#FF9F0A' :
                                          chore.priority === 'medium' ? 'var(--primary)' :
                                          'var(--text-secondary)'
                                  }}
                                >
                                  {chore.priority === 'urgent' ? '🔥' :
                                   chore.priority === 'high' ? '⚡' :
                                   chore.priority === 'medium' ? '📌' : '📝'} {chore.priority}
                                </Badge>
                              )}

                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  background: chore.status === 'done' ? 'rgba(48, 209, 88, 0.1)' :
                                             chore.status === 'doing' ? 'rgba(255, 159, 10, 0.1)' :
                                             'rgba(0, 122, 255, 0.1)',
                                  color: chore.status === 'done' ? '#30D158' :
                                        chore.status === 'doing' ? '#FF9F0A' :
                                        'var(--primary)'
                                }}
                              >
                                {chore.status === 'done' ? '✅ Done' :
                                 chore.status === 'doing' ? '🚀 In Progress' :
                                 '📋 To Do'}
                              </Badge>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteChore(chore.id)}
                                className="p-1 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} className="text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {chore.status !== 'done' && (
                            <div className="flex items-center space-x-2 mt-3">
                              {chore.status === 'todo' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateChore(chore.id, { status: 'doing' })}
                                  className="text-xs"
                                >
                                  <Clock size={14} className="mr-1" />
                                  Start
                                </Button>
                              )}
                              {chore.status === 'doing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateChore(chore.id, { status: 'done' })}
                                  className="text-xs"
                                >
                                  <CheckCircle2 size={14} className="mr-1" />
                                  Complete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
