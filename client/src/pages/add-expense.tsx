import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, DollarSign, Users, Calendar, Tag, FileText, RotateCcw } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import BackButton from "../components/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Get notification service instance
import { notificationService } from '../lib/notifications';

export default function AddExpense() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
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

  // Initialize custom splits when switching to custom/percentage
  useEffect(() => {
    if (newExpense.splitType !== "equal" && household?.members) {
      const initialSplits: Record<string, string> = {};
      household.members.forEach((member: any) => {
        if (newExpense.splitType === "percentage") {
          initialSplits[member.user.id] = "0";
        } else {
          initialSplits[member.user.id] = "0.00";
        }
      });
      setNewExpense({ ...newExpense, customSplits: initialSplits });
      setShowCustomSplits(true);
    } else {
      setShowCustomSplits(false);
    }
  }, [newExpense.splitType, household?.members]);

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

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: any) => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      
      // Send notification if enabled
      try {
        const paidByName = household?.members?.find((m: any) => m.user.id === newExpense.paidBy)?.user.firstName || 'Someone';
        const amount = parseFloat(data.expense?.amount || newExpense.amount);
        notificationService.showExpenseNotification(data.expense?.title || newExpense.title, amount, paidByName);
      } catch (error) {
        console.log("Notification not available");
      }
      
      setLocation("/expenses");
    },
    onError: (error) => {
      console.error("Failed to add expense:", error);
    },
  });

  const handleCreateExpense = () => {
    if (!canCreateExpense) return;

    let splits: Array<{ userId: string; amount: number }> = [];

    if (newExpense.splitType === "equal") {
      const perPersonAmount = parseFloat(newExpense.amount) / (household?.members?.length || 1);
      splits = (household?.members || []).map((member: any) => ({
        userId: member.user.id,
        amount: perPersonAmount,
      }));
    } else {
      splits = Object.entries(newExpense.customSplits).map(([userId, value]) => ({
        userId,
        amount: newExpense.splitType === "percentage" 
          ? (parseFloat(value) / 100) * parseFloat(newExpense.amount)
          : parseFloat(value),
      }));
    }

    createExpenseMutation.mutate({
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category || null,
      paidBy: newExpense.paidBy,
      splits,
    });
  };

  const handleQuickAmount = (amount: string) => {
    setNewExpense({ ...newExpense, amount });
  };

  const handleEqualSplit = () => {
    if (!household?.members) return;
    const equalAmount = (parseFloat(newExpense.amount) / household.members.length).toFixed(2);
    const splits: Record<string, string> = {};
    household.members.forEach((member: any) => {
      splits[member.user.id] = equalAmount;
    });
    setNewExpense({ ...newExpense, customSplits: splits });
  };

  const handleClearSplits = () => {
    const clearedSplits: Record<string, string> = {};
    Object.keys(newExpense.customSplits).forEach(userId => {
      clearedSplits[userId] = newExpense.splitType === "percentage" ? "0" : "0.00";
    });
    setNewExpense({ ...newExpense, customSplits: clearedSplits });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4" style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <BackButton to="/expenses" />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Add Expense
          </h1>
          <button
            onClick={handleCreateExpense}
            disabled={!canCreateExpense || createExpenseMutation.isPending}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              canCreateExpense && !createExpenseMutation.isPending
                ? 'btn-animated text-white shadow-lg hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              background: canCreateExpense ? 'var(--primary)' : 'var(--surface-secondary)',
              color: canCreateExpense ? 'white' : 'var(--text-secondary)'
            }}
          >
            {createExpenseMutation.isPending ? 'Adding...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-4 pb-8 max-w-lg mx-auto space-y-6">
        
        {/* Basic Info Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Expense Details</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What did you spend money on?</p>
            </div>
          </div>

          <input
            placeholder="Expense title..."
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
            className="input-modern w-full text-lg font-medium"
            style={{ background: 'var(--surface-secondary)' }}
          />

          <Select
            value={newExpense.category}
            onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
          >
            <SelectTrigger className="input-modern" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)'
            }}>
              <SelectItem value="groceries" style={{ color: 'var(--text-primary)' }}>🛒 Groceries</SelectItem>
              <SelectItem value="utilities" style={{ color: 'var(--text-primary)' }}>⚡ Utilities</SelectItem>
              <SelectItem value="rent" style={{ color: 'var(--text-primary)' }}>🏠 Rent</SelectItem>
              <SelectItem value="internet" style={{ color: 'var(--text-primary)' }}>📶 Internet</SelectItem>
              <SelectItem value="transportation" style={{ color: 'var(--text-primary)' }}>🚗 Transportation</SelectItem>
              <SelectItem value="dining" style={{ color: 'var(--text-primary)' }}>🍽️ Dining</SelectItem>
              <SelectItem value="entertainment" style={{ color: 'var(--text-primary)' }}>🎬 Entertainment</SelectItem>
              <SelectItem value="cleaning" style={{ color: 'var(--text-primary)' }}>🧽 Cleaning</SelectItem>
              <SelectItem value="maintenance" style={{ color: 'var(--text-primary)' }}>🔧 Maintenance</SelectItem>
              <SelectItem value="other" style={{ color: 'var(--text-primary)' }}>📝 Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Smart Expense Suggestions */}
          {!newExpense.title && newExpense.category && (
            <div className="space-y-3">
              <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Common {newExpense.category} expenses
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const suggestions = {
                    groceries: ["Weekly Groceries", "Costco Run", "Fresh Produce", "Snacks & Drinks"],
                    utilities: ["Electricity Bill", "Gas Bill", "Water Bill", "Trash/Recycling"],
                    rent: ["Monthly Rent", "Security Deposit", "Parking Fee"],
                    internet: ["Internet Bill", "WiFi Setup", "Router/Modem"],
                    transportation: ["Gas", "Uber/Lyft", "Bus Pass", "Car Maintenance"],
                    dining: ["Dinner Out", "Pizza Night", "Coffee Run", "Takeout"],
                    entertainment: ["Movie Tickets", "Concert", "Gaming", "Streaming Service"],
                    cleaning: ["Toilet Paper", "Laundry Detergent", "Cleaning Supplies"],
                    maintenance: ["Plumber", "Handyman", "Repairs", "Tools"]
                  };
                  return (suggestions[newExpense.category as keyof typeof suggestions] || []).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, title: suggestion })}
                      className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105"
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

          <textarea
            placeholder="Add a note (optional)"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="input-modern w-full resize-none"
            rows={3}
            style={{ background: 'var(--surface-secondary)' }}
          />
        </div>

        {/* Amount Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <DollarSign size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Amount</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How much was spent?</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>$</span>
            <input
              type="number"
              placeholder="0.00"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="input-modern w-full pl-10 text-2xl font-bold"
              style={{ background: 'var(--surface-secondary)' }}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {["10", "25", "50", "100"].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                className="py-3 px-4 rounded-xl font-medium transition-all hover:scale-105"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Payment & Date Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Payment Details</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Who paid and when?</p>
            </div>
          </div>

          <Select
            value={newExpense.paidBy}
            onValueChange={(value) => setNewExpense({ ...newExpense, paidBy: value })}
          >
            <SelectTrigger className="input-modern" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Who paid for this?" />
            </SelectTrigger>
            <SelectContent style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)'
            }}>
              {household?.members?.map((member: any) => (
                <SelectItem key={member.user.id} value={member.user.id} style={{ color: 'var(--text-primary)' }}>
                  {member.user.firstName} {member.user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            className="input-modern w-full"
            style={{ background: 'var(--surface-secondary)' }}
          />
        </div>

        {/* Split Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Split Method</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How should this be divided?</p>
            </div>
          </div>

          <Select
            value={newExpense.splitType}
            onValueChange={(value) => setNewExpense({ ...newExpense, splitType: value })}
          >
            <SelectTrigger className="input-modern" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)'
            }}>
              <SelectItem value="equal" style={{ color: 'var(--text-primary)' }}>👥 Split Equally</SelectItem>
              <SelectItem value="percentage" style={{ color: 'var(--text-primary)' }}>% By Percentage</SelectItem>
              <SelectItem value="custom" style={{ color: 'var(--text-primary)' }}>💰 Custom Amounts</SelectItem>
            </SelectContent>
          </Select>

          {/* Equal Split Preview */}
          {newExpense.splitType === "equal" && newExpense.amount && household?.members && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Split Preview
              </div>
              <div className="space-y-2">
                {household.members.map((member: any) => (
                  <div key={member.user.id} className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>{member.user.firstName}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${(parseFloat(newExpense.amount) / household.members.length).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Splits */}
          {showCustomSplits && household?.members && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleEqualSplit}
                  className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={handleClearSplits}
                  className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  Clear All
                </button>
              </div>

              {household.members.map((member: any) => (
                <div key={member.user.id} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {member.user.firstName}
                    </div>
                  </div>
                  <div className="relative w-32">
                    {newExpense.splitType === "percentage" && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>%</span>
                    )}
                    {newExpense.splitType === "custom" && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
                    )}
                    <input
                      type="number"
                      placeholder="0"
                      value={newExpense.customSplits[member.user.id] || ""}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          customSplits: {
                            ...newExpense.customSplits,
                            [member.user.id]: e.target.value,
                          },
                        })
                      }
                      className={`input-modern w-full text-center ${
                        newExpense.splitType === "custom" ? "pl-6" : "pr-6"
                      }`}
                      style={{ background: 'var(--surface-secondary)' }}
                    />
                  </div>
                </div>
              ))}

              {/* Split Summary */}
              <div className="p-3 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {newExpense.splitType === "percentage" ? "Total Percentage:" : "Total Amount:"}
                  </span>
                  <span className={`font-medium ${
                    validateCustomSplits() ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {newExpense.splitType === "percentage" 
                      ? `${Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(1)}%`
                      : `$${Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(2)}`
                    }
                  </span>
                </div>
                {!validateCustomSplits() && (
                  <div className="text-xs text-red-500 mt-1">
                    {newExpense.splitType === "percentage" 
                      ? "Must equal 100%" 
                      : `Must equal $${newExpense.amount}`
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recurring Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <RotateCcw size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recurring</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set up automatic monthly splits</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Recurring Expense
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Creates automatic future expenses
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
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                newExpense.isRecurring ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {showRecurringOptions && (
            <Select
              value={newExpense.recurringInterval}
              onValueChange={(value) =>
                setNewExpense({ ...newExpense, recurringInterval: value })
              }
            >
              <SelectTrigger className="input-modern" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue placeholder="Recurring frequency..." />
              </SelectTrigger>
              <SelectContent style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)'
              }}>
                <SelectItem value="weekly" style={{ color: 'var(--text-primary)' }}>📅 Weekly</SelectItem>
                <SelectItem value="monthly" style={{ color: 'var(--text-primary)' }}>🗓️ Monthly</SelectItem>
                <SelectItem value="quarterly" style={{ color: 'var(--text-primary)' }}>📊 Quarterly</SelectItem>
                <SelectItem value="yearly" style={{ color: 'var(--text-primary)' }}>🗓️ Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

      </div>
    </div>
  );
}