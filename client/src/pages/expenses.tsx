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
      <div className="floating-header">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-large-title font-bold text-primary">Expenses</h1>
              <p className="text-subhead text-secondary mt-1">Track and split costs easily</p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <button className="btn-floating">
                  <span className="text-xl">+</span>
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
      
      <div className="page-content space-y-6">
        {/* Balance Overview */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold text-primary mb-4">Balance Overview</h2>
            <div className="text-center py-4">
              <p className={`text-title-1 font-bold ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
              <p className="text-footnote text-secondary">Overall balance</p>
            </div>
            {balance && (
              <div className="space-y-2">
                {balance.totalOwed > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body text-black">Total owed to you</span>
                    <span className="text-ios-body font-medium text-ios-green">
                      ${balance.totalOwed.toFixed(2)}
                    </span>
                  </div>
                )}
                {balance.totalOwing > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-ios-body text-black">Total you owe</span>
                    <span className="text-ios-body font-medium text-ios-red">
                      ${balance.totalOwing.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-headline font-semibold text-primary mb-4">Recent Expenses</h2>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-body text-secondary">No expenses yet</p>
              ) : (
                expenses.map((expense: any) => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
