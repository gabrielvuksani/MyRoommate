import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";

import ExpenseCard from "@/components/expense-card";
import { Plus } from "lucide-react";

export default function Expenses() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0], // Today's date
    splitType: "equal",
    paidBy: "",
    customSplits: {} as Record<string, string>,
    isRecurring: false,
    recurringInterval: "monthly",
  });
  const [activeTab, setActiveTab] = useState<"all" | "unsettled" | "settled">("all");
  const [showCustomSplits, setShowCustomSplits] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!household,
  });

  const { data: balance } = useQuery<{ totalOwed: number; totalOwing: number }>({
    queryKey: ["/api/balance"],
    enabled: !!household,
  });

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
      
      setIsCreateOpen(false);
      setShowCustomSplits(false);
      setShowRecurringOptions(false);
      setNewExpense({
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
    },
    onError: (error) => {
      console.error("Failed to add expense:", error);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
    },
  });

  const handleCreateExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;

    createExpenseMutation.mutate(newExpense);
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  // Enhanced validation logic
  const validateCustomSplits = () => {
    if (newExpense.splitType === "equal") return true;
    
    const totalMembers = (household as any)?.members?.length || 0;
    const splitValues = Object.values(newExpense.customSplits);
    
    if (splitValues.length !== totalMembers) return false;
    
    if (newExpense.splitType === "percentage") {
      const totalPercentage = splitValues.reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0);
      return Math.abs(totalPercentage - 100) < 0.1; // Allow small floating point differences
    }
    
    if (newExpense.splitType === "custom") {
      const totalCustom = splitValues.reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0);
      const expenseAmount = parseFloat(newExpense.amount) || 0;
      return Math.abs(totalCustom - expenseAmount) < 0.01; // Allow small floating point differences
    }
    
    return true;
  };

  const canCreateExpense =
    newExpense.title.trim().length > 0 &&
    newExpense.amount.trim().length > 0 &&
    parseFloat(newExpense.amount) > 0 &&
    newExpense.paidBy.trim().length > 0 &&
    validateCustomSplits();

  // Filter expenses based on active tab
  const filteredExpenses = (expenses as any).filter((expense: any) => {
    if (activeTab === "all") return true;
    
    const hasUnsettledSplits = expense.splits?.some((split: any) => !split.settled);
    if (activeTab === "unsettled") return hasUnsettledSplits;
    if (activeTab === "settled") return !hasUnsettledSplits;
    
    return true;
  });

  // Settlement functionality
  const settleSplitMutation = useMutation({
    mutationFn: async ({ splitId, settled }: { splitId: string; settled: boolean }) => {
      await apiRequest("PATCH", `/api/expense-splits/${splitId}`, { settled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
  });

  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);

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
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Expenses</h1>
              <p className="page-subtitle">Split bills and track balances</p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <button className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated">
                  <Plus size={24} className="text-white" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="px-6 pt-6 pb-6">
                  <DialogTitle className="text-title-2 font-bold text-primary">
                    Add New Expense
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-5">
                  <input
                    placeholder="What did you pay for?"
                    value={newExpense.title}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    className="input-modern w-full"
                  />
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, amount: e.target.value })
                        }
                        className="input-modern w-full pl-8 text-lg font-medium"
                      />
                    </div>
                    
                    {/* Quick Amount Buttons */}
                    <div className="flex space-x-2">
                      {[10, 25, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setNewExpense({ ...newExpense, amount: amount.toString() })}
                          className="px-3 py-1 text-xs rounded-lg transition-all"
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
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, category: value })
                    }
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
                      <SelectItem value="utilities" style={{ color: 'var(--text-primary)' }}>💡 Utilities</SelectItem>
                      <SelectItem value="rent" style={{ color: 'var(--text-primary)' }}>🏠 Rent</SelectItem>
                      <SelectItem value="internet" style={{ color: 'var(--text-primary)' }}>📶 Internet</SelectItem>
                      <SelectItem value="transportation" style={{ color: 'var(--text-primary)' }}>🚗 Transportation</SelectItem>
                      <SelectItem value="dining" style={{ color: 'var(--text-primary)' }}>🍽️ Dining Out</SelectItem>
                      <SelectItem value="entertainment" style={{ color: 'var(--text-primary)' }}>🎬 Entertainment</SelectItem>
                      <SelectItem value="cleaning" style={{ color: 'var(--text-primary)' }}>🧽 Cleaning Supplies</SelectItem>
                      <SelectItem value="maintenance" style={{ color: 'var(--text-primary)' }}>🔧 Maintenance</SelectItem>
                      <SelectItem value="other" style={{ color: 'var(--text-primary)' }}>📝 Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <input
                    placeholder="Add a note (optional)"
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, description: e.target.value })
                    }
                    className="input-modern w-full"
                  />

                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className="input-modern w-full"
                  />

                  {/* Smart Expense Suggestions */}
                  {!newExpense.title && newExpense.category && (
                    <div className="space-y-2">
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
                              className="px-2 py-1 text-xs rounded-lg transition-all hover:scale-105"
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

                  {/* Recurring Expense Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                        <span className="text-white text-sm">🔄</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Recurring Expense
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Set up automatic monthly splits
                        </div>
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
                  <Select
                    value={newExpense.paidBy}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, paidBy: value })
                    }
                  >
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Paid by..." />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {(household as any)?.members?.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId} style={{ color: 'var(--text-primary)' }}>
                          {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
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
                    <SelectTrigger className="input-modern" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}>
                      <SelectValue placeholder="Split method..." />
                    </SelectTrigger>
                    <SelectContent style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <SelectItem value="equal" style={{ color: 'var(--text-primary)' }}>Split Equally</SelectItem>
                      <SelectItem value="custom" style={{ color: 'var(--text-primary)' }}>Custom Amounts</SelectItem>
                      <SelectItem value="percentage" style={{ color: 'var(--text-primary)' }}>By Percentage</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Split Preview for Equal Split */}
                  {newExpense.splitType === "equal" && newExpense.amount && (household as any)?.members?.length > 0 && (
                    <div className="p-4 rounded-xl space-y-3" style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Split Preview
                      </div>
                      <div className="space-y-2">
                        {(household as any)?.members?.map((member: any) => {
                          const amountPerPerson = (parseFloat(newExpense.amount) / (household as any).members.length).toFixed(2);
                          return (
                            <div key={member.userId} className="flex justify-between items-center">
                              <span className="text-sm">
                                {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
                              </span>
                              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                                ${amountPerPerson}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showCustomSplits && newExpense.amount && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {newExpense.splitType === "percentage" ? "Percentage Split" : "Custom Amount Split"}
                      </div>
                      
                      <div className="space-y-3">
                        {(household as any)?.members?.map((member: any) => (
                          <div key={member.userId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
                              </span>
                              {newExpense.splitType === "percentage" && newExpense.customSplits[member.userId] && (
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  ${((parseFloat(newExpense.amount) * parseFloat(newExpense.customSplits[member.userId])) / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              {newExpense.splitType === "custom" && (
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
                              )}
                              {newExpense.splitType === "percentage" && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>%</span>
                              )}
                              <input
                                type="number"
                                step={newExpense.splitType === "percentage" ? "1" : "0.01"}
                                placeholder={newExpense.splitType === "percentage" ? "0" : "0.00"}
                                value={newExpense.customSplits[member.userId] || ""}
                                onChange={(e) =>
                                  setNewExpense({
                                    ...newExpense,
                                    customSplits: {
                                      ...newExpense.customSplits,
                                      [member.userId]: e.target.value,
                                    },
                                  })
                                }
                                className={`input-modern w-full text-sm ${newExpense.splitType === "custom" ? "pl-7" : "pr-7"}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Split Summary */}
                      <div className="p-3 rounded-lg space-y-2" style={{
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {newExpense.splitType === "percentage" && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: 'var(--text-secondary)' }}>Total Percentage:</span>
                              <span style={{ 
                                color: Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0) === 100 
                                  ? 'var(--success)' : 'var(--warning)' 
                              }}>
                                {Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                              <span style={{ color: 'var(--text-primary)' }}>
                                ${Object.values(newExpense.customSplits).reduce((sum, val) => {
                                  const percentage = parseFloat(val as string) || 0;
                                  return sum + (parseFloat(newExpense.amount) * percentage / 100);
                                }, 0).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                        {newExpense.splitType === "custom" && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: 'var(--text-secondary)' }}>Total Split:</span>
                              <span style={{ 
                                color: Math.abs(Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0) - parseFloat(newExpense.amount)) < 0.01
                                  ? 'var(--success)' : 'var(--warning)' 
                              }}>
                                ${Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                              <span style={{ color: 'var(--text-primary)' }}>
                                ${(parseFloat(newExpense.amount) - Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0)).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Split Actions */}
                  {newExpense.splitType === "percentage" && newExpense.amount && (household as any)?.members?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Quick Actions
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const equalPercentage = (100 / (household as any).members.length).toFixed(1);
                            const newSplits: Record<string, string> = {};
                            (household as any).members.forEach((member: any) => {
                              newSplits[member.userId] = equalPercentage;
                            });
                            setNewExpense({ ...newExpense, customSplits: newSplits });
                          }}
                          className="px-3 py-1 text-xs rounded-lg transition-all"
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          Equal %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewExpense({ ...newExpense, customSplits: {} });
                          }}
                          className="px-3 py-1 text-xs rounded-lg transition-all"
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}

                  {newExpense.splitType === "custom" && newExpense.amount && (household as any)?.members?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Quick Actions
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const equalAmount = (parseFloat(newExpense.amount) / (household as any).members.length).toFixed(2);
                            const newSplits: Record<string, string> = {};
                            (household as any).members.forEach((member: any) => {
                              newSplits[member.userId] = equalAmount;
                            });
                            setNewExpense({ ...newExpense, customSplits: newSplits });
                          }}
                          className="px-3 py-1 text-xs rounded-lg transition-all"
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          Equal Split
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewExpense({ ...newExpense, customSplits: {} });
                          }}
                          className="px-3 py-1 text-xs rounded-lg transition-all"
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateExpense}
                    disabled={
                      !canCreateExpense || createExpenseMutation.isPending
                    }
                    className="btn-primary w-full"
                  >
                    {createExpenseMutation.isPending
                      ? "Adding..."
                      : "Add Expense"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="pt-32 px-6 space-y-6">
        {/* Balance Overview */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)'
        }}>
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Balance Overview
            </h2>
            <div className="text-center py-4">
              <p className="text-title-1 font-bold" style={{
                color: netBalance >= 0 ? '#30D158' : '#FF453A'
              }}>
                {netBalance >= 0 ? "+" : ""}${netBalance.toFixed(2)}
              </p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Overall balance</p>
            </div>
            {balance && (
              <div className="space-y-2">
                {balance.totalOwed > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body" style={{ color: 'var(--text-primary)' }}>
                      Total owed to you
                    </span>
                    <span className="text-ios-body font-medium" style={{ color: '#30D158' }}>
                      ${balance.totalOwed.toFixed(2)}
                    </span>
                  </div>
                )}
                {balance.totalOwing > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body" style={{ color: 'var(--text-primary)' }}>
                      Total you owe
                    </span>
                    <span className="text-ios-body font-medium" style={{ color: '#FF453A' }}>
                      ${balance.totalOwing.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Filter Tabs */}
        <div 
          className="flex space-x-1 p-1 rounded-xl" 
          style={{ backgroundColor: 'var(--surface-secondary)' }}
        >
          {(["all", "unsettled", "settled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "shadow-sm"
                  : ""
              }`}
              style={{
                backgroundColor: activeTab === tab ? 'var(--surface)' : 'transparent',
                border: activeTab === tab ? '1px solid var(--border)' : '1px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Filtered Expenses */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)'
        }}>
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {activeTab === "all" ? "All Expenses" : 
               activeTab === "unsettled" ? "Unsettled Expenses" : "Settled Expenses"}
            </h2>
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  {activeTab === "all" ? "No expenses yet" :
                   activeTab === "unsettled" ? "No unsettled expenses" : "No settled expenses"}
                </p>
              ) : (
                filteredExpenses.map((expense: any) => (
                  <ExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    onSettleExpense={settleSplitMutation.mutate}
                    onDeleteExpense={handleDeleteExpense}
                    showSettlement={activeTab !== "settled"}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
