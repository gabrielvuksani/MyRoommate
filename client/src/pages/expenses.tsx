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

import ExpenseCard from "@/components/expense-card";
import { Plus } from "lucide-react";

export default function Expenses() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    splitType: "equal",
    paidBy: "",
    customSplits: {} as Record<string, string>,
  });
  const [activeTab, setActiveTab] = useState<"all" | "unsettled" | "settled">("all");
  const [showCustomSplits, setShowCustomSplits] = useState(false);

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

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
    enabled: !!household,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      let splits;
      const totalAmount = parseFloat(expenseData.amount);
      
      if (expenseData.splitType === "equal") {
        const amountPerPerson = (totalAmount / household.members.length).toFixed(2);
        splits = household.members.map((member: any) => ({
          userId: member.userId,
          amount: amountPerPerson,
        }));
      } else if (expenseData.splitType === "custom") {
        splits = household.members.map((member: any) => ({
          userId: member.userId,
          amount: expenseData.customSplits[member.userId] || "0",
        }));
      } else if (expenseData.splitType === "percentage") {
        splits = household.members.map((member: any) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      setIsCreateOpen(false);
      setNewExpense({
        title: "",
        amount: "",
        category: "",
        splitType: "equal",
        paidBy: "",
        customSplits: {},
      });
    },
    onError: (error) => {
      console.error("Failed to add expense:", error);
    },
  });

  const handleCreateExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;

    createExpenseMutation.mutate(newExpense);
  };

  const canCreateExpense =
    newExpense.title.trim().length > 0 &&
    newExpense.amount.trim().length > 0 &&
    parseFloat(newExpense.amount) > 0 &&
    newExpense.paidBy.trim().length > 0;

  // Filter expenses based on active tab
  const filteredExpenses = expenses.filter((expense: any) => {
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
                    placeholder="Expense title"
                    value={newExpense.title}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    className="input-modern w-full"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    className="input-modern w-full"
                  />
                  <input
                    placeholder="Category (optional)"
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    className="input-modern w-full"
                  />
                  <Select
                    value={newExpense.paidBy}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, paidBy: value })
                    }
                  >
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Paid by..." />
                    </SelectTrigger>
                    <SelectContent>
                      {household?.members?.map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId}>
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
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Split method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Split Equally</SelectItem>
                      <SelectItem value="custom">Custom Amounts</SelectItem>
                      <SelectItem value="percentage">By Percentage</SelectItem>
                    </SelectContent>
                  </Select>

                  {showCustomSplits && newExpense.amount && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">
                        {newExpense.splitType === "percentage" ? "Percentage Split" : "Custom Amount Split"}
                      </div>
                      {household?.members?.map((member: any) => (
                        <div key={member.userId} className="flex items-center space-x-3">
                          <span className="text-sm w-20 truncate">
                            {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
                          </span>
                          <input
                            type="number"
                            step={newExpense.splitType === "percentage" ? "1" : "0.01"}
                            placeholder={newExpense.splitType === "percentage" ? "%" : "$"}
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
                            className="input-modern flex-1 text-sm"
                          />
                        </div>
                      ))}
                      {newExpense.splitType === "percentage" && (
                        <div className="text-xs text-gray-500">
                          Total: {Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0)}%
                        </div>
                      )}
                      {newExpense.splitType === "custom" && (
                        <div className="text-xs text-gray-500">
                          Total: ${Object.values(newExpense.customSplits).reduce((sum, val) => sum + (parseFloat(val as string) || 0), 0).toFixed(2)} of ${newExpense.amount}
                        </div>
                      )}
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

      <div className="page-content space-y-6 pt-32">
        {/* Balance Overview */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold text-primary mb-4">
              Balance Overview
            </h2>
            <div className="text-center py-4">
              <p
                className={`text-title-1 font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}
              >
                {netBalance >= 0 ? "+" : ""}${netBalance.toFixed(2)}
              </p>
              <p className="text-footnote text-secondary">Overall balance</p>
            </div>
            {balance && (
              <div className="space-y-2">
                {balance.totalOwed > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body text-black">
                      Total owed to you
                    </span>
                    <span className="text-ios-body font-medium text-ios-green">
                      ${balance.totalOwed.toFixed(2)}
                    </span>
                  </div>
                )}
                {balance.totalOwing > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body text-black">
                      Total you owe
                    </span>
                    <span className="text-ios-body font-medium text-ios-red">
                      ${balance.totalOwing.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Filter Tabs */}
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-xl">
          {(["all", "unsettled", "settled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Filtered Expenses */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold text-primary mb-4">
              {activeTab === "all" ? "All Expenses" : 
               activeTab === "unsettled" ? "Unsettled Expenses" : "Settled Expenses"}
            </h2>
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <p className="text-body text-secondary">
                  {activeTab === "all" ? "No expenses yet" :
                   activeTab === "unsettled" ? "No unsettled expenses" : "No settled expenses"}
                </p>
              ) : (
                filteredExpenses.map((expense: any) => (
                  <ExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    onSettleExpense={settleSplitMutation.mutate}
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
