import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, DollarSign, Users, Calendar, Plus, Minus } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { notificationService } from '../lib/notifications';
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddExpense() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    splitType: "equal",
    paidBy: "",
    customSplits: {} as Record<string, string>,
    isRecurring: false,
    recurringInterval: "monthly",
  });
  
  const [showCustomSplits, setShowCustomSplits] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  // Fetch household data
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  }) as { data: any };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle scroll for floating header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize custom splits when switching to custom/percentage
  useEffect(() => {
    if (newExpense.splitType !== "equal" && household?.members) {
      const initialSplits: Record<string, string> = {};
      household.members.forEach((member: any) => {
        if (!newExpense.customSplits[member.userId]) {
          initialSplits[member.userId] = newExpense.splitType === "percentage" ? "0" : "0.00";
        }
      });
      setNewExpense(prev => ({
        ...prev,
        customSplits: { ...prev.customSplits, ...initialSplits }
      }));
    }
  }, [newExpense.splitType, household?.members]);

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      let splits;
      const totalAmount = parseFloat(expenseData.amount);
      
      if (expenseData.splitType === "equal") {
        const amountPerPerson = (totalAmount / (household as any).members.length).toFixed(2);
        splits = (household as any).members.map((member: any) => ({
          userId: member.userId,
          amount: amountPerPerson,
        }));
      } else if (expenseData.splitType === "custom") {
        splits = (household as any).members.map((member: any) => ({
          userId: member.userId,
          amount: expenseData.customSplits[member.userId] || "0",
        }));
      } else if (expenseData.splitType === "percentage") {
        splits = (household as any).members.map((member: any) => {
          const percentage = parseFloat(expenseData.customSplits[member.userId] || "0") / 100;
          return {
            userId: member.userId,
            amount: (totalAmount * percentage).toFixed(2),
          };
        });
      }

      await apiRequest("POST", "/api/expenses", {
        expense: {
          ...expenseData,
          amount: totalAmount.toString(),
          paidBy: expenseData.paidBy,
        },
        splits,
      });
    },
    onSuccess: (_, expenseData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      
      // Send notification for new expense
      if (expenseData && expenseData.expense) {
        const paidByUser = (household as any)?.members?.find((m: any) => m.userId === expenseData.expense.paidBy);
        const paidByName = paidByUser ? `${paidByUser.user.firstName || paidByUser.user.email?.split('@')[0]}` : 'someone';
        const amount = parseFloat(expenseData.expense.amount);
        notificationService.showExpenseNotification(expenseData.expense.title, amount, paidByName);
      }
      
      setLocation("/expenses");
    },
    onError: (error) => {
      console.error("Failed to add expense:", error);
    },
  });

  const handleCreateExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount || !canCreateExpense) return;
    createExpenseMutation.mutate(newExpense);
  };

  // Enhanced validation logic
  const validateCustomSplits = () => {
    if (newExpense.splitType === "equal") return true;
    
    const totalMembers = (household as any)?.members?.length || 0;
    const splitValues = Object.values(newExpense.customSplits);
    
    if (splitValues.length !== totalMembers) return false;
    
    if (newExpense.splitType === "percentage") {
      const totalPercentage = splitValues.reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0);
      return Math.abs(totalPercentage - 100) < 0.1;
    }
    
    if (newExpense.splitType === "custom") {
      const totalCustom = splitValues.reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0);
      const expenseAmount = parseFloat(newExpense.amount) || 0;
      return Math.abs(totalCustom - expenseAmount) < 0.01;
    }
    
    return true;
  };

  const canCreateExpense =
    newExpense.title.trim().length > 0 &&
    newExpense.amount.trim().length > 0 &&
    parseFloat(newExpense.amount) > 0 &&
    newExpense.paidBy.trim().length > 0 &&
    validateCustomSplits();

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLocation("/expenses")}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
              </button>
              <div>
                <h1 className="page-title">Add Expense</h1>
                <p className="page-subtitle">Split a new expense</p>
              </div>
            </div>
            <button
              onClick={handleCreateExpense}
              disabled={!canCreateExpense || createExpenseMutation.isPending}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                canCreateExpense && !createExpenseMutation.isPending
                  ? 'btn-animated text-white shadow-lg hover:scale-[1.05]'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ 
                background: canCreateExpense && !createExpenseMutation.isPending ? 'var(--primary)' : 'var(--surface-secondary)',
                color: canCreateExpense && !createExpenseMutation.isPending ? 'white' : 'var(--text-secondary)'
              }}
            >
              {createExpenseMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-20 px-6 space-y-6">
        
        {/* Basic Details */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Expense Details</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What did you spend money on?</p>
              </div>
            </div>

          <input
            placeholder="What did you pay for?"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            className="w-full h-14 px-4 rounded-xl text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ 
              background: 'var(--surface-secondary)', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full h-14 pl-10 pr-4 rounded-xl text-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ 
                  background: 'var(--surface-secondary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex space-x-2">
              {[10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setNewExpense({ ...newExpense, amount: amount.toString() })}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          <Select
            value={newExpense.category}
            onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
          >
            <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groceries">🛒 Groceries</SelectItem>
              <SelectItem value="utilities">⚡ Utilities</SelectItem>
              <SelectItem value="rent">🏠 Rent</SelectItem>
              <SelectItem value="internet">📶 Internet</SelectItem>
              <SelectItem value="transportation">🚗 Transportation</SelectItem>
              <SelectItem value="dining">🍽️ Dining</SelectItem>
              <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
              <SelectItem value="cleaning">🧽 Cleaning</SelectItem>
              <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
              <SelectItem value="other">📝 Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Smart Suggestions */}
          {!newExpense.title && newExpense.category && (
            <div className="space-y-3">
              <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Common {newExpense.category} expenses
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const suggestions = {
                    groceries: ["Weekly Groceries", "Costco Run", "Fresh Produce"],
                    utilities: ["Electricity Bill", "Gas Bill", "Water Bill"],
                    rent: ["Monthly Rent", "Security Deposit", "Parking Fee"],
                    internet: ["Internet Bill", "WiFi Setup", "Router"],
                    transportation: ["Gas", "Uber/Lyft", "Bus Pass"],
                    dining: ["Dinner Out", "Pizza Night", "Coffee Run"],
                    entertainment: ["Movie Tickets", "Concert", "Streaming"],
                    cleaning: ["Toilet Paper", "Detergent", "Supplies"],
                    maintenance: ["Plumber", "Handyman", "Repairs"]
                  };
                  return (suggestions[newExpense.category as keyof typeof suggestions] || []).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, title: suggestion })}
                      className="px-3 py-2 text-sm rounded-xl transition-all hover:scale-105"
                      style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {suggestion}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}

          <input
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ 
              background: 'var(--surface-secondary)', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />

          <textarea
            placeholder="Add a note (optional)"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl resize-none transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={3}
            style={{ 
              background: 'var(--surface-secondary)', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />
          </CardContent>
        </Card>

        {/* Split Configuration */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Split Details</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How should this be divided?</p>
              </div>
            </div>

          <Select
            value={newExpense.paidBy}
            onValueChange={(value) => setNewExpense({ ...newExpense, paidBy: value })}
          >
            <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Who paid for this?" />
            </SelectTrigger>
            <SelectContent>
              {household?.members?.map((member: any) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.user.firstName || member.user.email?.split('@')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newExpense.splitType}
            onValueChange={(value) => {
              setNewExpense({ ...newExpense, splitType: value });
              setShowCustomSplits(value !== "equal");
            }}
          >
            <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="How to split?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">Equal Split</SelectItem>
              <SelectItem value="custom">Custom Amounts</SelectItem>
              <SelectItem value="percentage">Percentage Split</SelectItem>
            </SelectContent>
          </Select>

          {/* Equal Split Preview */}
          {newExpense.splitType === "equal" && newExpense.amount && household?.members && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Split Preview</div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                ${(parseFloat(newExpense.amount) / household.members.length).toFixed(2)} per person
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {household.members.length} members total
              </div>
            </div>
          )}

          {/* Custom Splits */}
          {showCustomSplits && household?.members && (
            <div className="space-y-3">
              <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Custom {newExpense.splitType === "percentage" ? "Percentages" : "Amounts"}
              </div>
              {household.members.map((member: any) => (
                <div key={member.userId} className="flex items-center space-x-3">
                  <div className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {member.user.firstName || member.user.email?.split('@')[0]}
                  </div>
                  <div className="relative w-24">
                    {newExpense.splitType === "percentage" && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>%</span>
                    )}
                    {newExpense.splitType === "custom" && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
                    )}
                    <input
                      type="number"
                      step={newExpense.splitType === "percentage" ? "1" : "0.01"}
                      value={newExpense.customSplits[member.userId] || ""}
                      onChange={(e) => setNewExpense({
                        ...newExpense,
                        customSplits: { ...newExpense.customSplits, [member.userId]: e.target.value }
                      })}
                      className={`w-full h-10 rounded-lg text-center text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        newExpense.splitType === "custom" ? "pl-6 pr-2" : "pl-2 pr-6"
                      }`}
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Split Summary */}
              {newExpense.amount && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Summary</div>
                  {newExpense.splitType === "percentage" && (
                    <div className="text-sm" style={{ 
                      color: Math.abs(Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0) - 100) < 0.1 
                        ? 'var(--text-primary)' : '#ef4444' 
                    }}>
                      Total: {Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(1)}%
                    </div>
                  )}
                  {newExpense.splitType === "custom" && (
                    <div className="text-sm" style={{ 
                      color: Math.abs(Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0) - parseFloat(newExpense.amount)) < 0.01 
                        ? 'var(--text-primary)' : '#ef4444' 
                    }}>
                      Total: ${Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(2)} / ${parseFloat(newExpense.amount).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Recurring Options */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                  <Calendar size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recurring Expense</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Repeat this expense automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewExpense({ ...newExpense, isRecurring: !newExpense.isRecurring });
                  setShowRecurringOptions(!newExpense.isRecurring);
                }}
                className={`w-12 h-6 rounded-full transition-all ${
                  newExpense.isRecurring ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  newExpense.isRecurring ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {showRecurringOptions && (
              <Select
                value={newExpense.recurringInterval}
                onValueChange={(value) => setNewExpense({ ...newExpense, recurringInterval: value })}
              >
                <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}