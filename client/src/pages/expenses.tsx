import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExpenseCard from "@/components/expense-card";

export default function Expenses() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: '',
    splitType: 'equal',
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      const splits = household.members.map((member: any) => ({
        userId: member.userId,
        amount: (parseFloat(expenseData.amount) / household.members.length).toFixed(2),
      }));
      
      await apiRequest("POST", "/api/expenses", {
        expense: {
          ...expenseData,
          amount: parseFloat(expenseData.amount).toString(),
        },
        splits,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      setIsCreateOpen(false);
      setNewExpense({
        title: '',
        amount: '',
        category: '',
        splitType: 'equal',
      });
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const handleCreateExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;
    
    createExpenseMutation.mutate(newExpense);
  };

  const canCreateExpense = newExpense.title.trim().length > 0 && newExpense.amount.trim().length > 0 && parseFloat(newExpense.amount) > 0;

  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);

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
              <h1 className="page-title">Expenses</h1>
              <p className="page-subtitle">Split bills and track balances</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <button className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Plus size={20} className="text-white" />
                  </button>
                </DialogTrigger>
            <DialogContent className="modal-content">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-title-2 font-bold text-primary">Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-5">
                <input
                  placeholder="Expense title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="input-modern w-full"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="input-modern w-full"
                />
                <input
                  placeholder="Category (optional)"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="input-modern w-full"
                />
                <Select value={newExpense.splitType} onValueChange={(value) => setNewExpense({ ...newExpense, splitType: value })}>
                  <SelectTrigger className="input-modern">
                    <SelectValue placeholder="Split method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Split Equally</SelectItem>
                    <SelectItem value="custom">Custom Amounts</SelectItem>
                    <SelectItem value="percentage">By Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={handleCreateExpense}
                  disabled={!canCreateExpense || createExpenseMutation.isPending}
                  className="btn-primary w-full"
                >
                  {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </button>
              </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Expenses Layout */}
      <div className="flex-1 page-content-with-header">
        {/* Balance Overview */}
        <div className="px-6 mb-6">
          <div className="smart-card bg-gradient-to-br from-accent to-accent-hover text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Money</h2>
              <DollarSign size={24} />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <div className="text-3xl font-bold mb-1">
                  ${balance?.totalOwed.toFixed(2) || '0.00'}
                </div>
                <div className="text-white/80">You're owed</div>
              </div>
              
              <div>
                <div className="text-3xl font-bold mb-1">
                  ${balance?.totalOwing.toFixed(2) || '0.00'}
                </div>
                <div className="text-white/80">You owe</div>
              </div>
            </div>
            
            <div className="bg-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/90 font-medium">Net Balance</span>
                <span className="text-2xl font-bold text-white">
                  {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
                <p className="text-gray-600 mb-6">Start tracking shared costs</p>
                <button className="bg-accent text-white px-6 py-3 rounded-full font-semibold">
                  Add First Expense
                </button>
              </div>
            ) : (
              expenses.map((expense: any) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
