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
        expense: expenseData,
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
    
    createExpenseMutation.mutate({
      ...newExpense,
      amount: parseFloat(newExpense.amount),
    });
  };

  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-gray pb-20">
      <div className="h-6 bg-white"></div>
      
      <div className="px-4 pt-4 pb-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-ios-large-title font-bold text-black">Expenses</h1>
            <p className="text-ios-subhead text-ios-gray-5 mt-1">Track and split costs easily</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-lg px-4 py-2 text-ios-footnote font-medium">
                + Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Expense title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
                <Input
                  placeholder="Category (optional)"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                />
                <Select value={newExpense.splitType} onValueChange={(value) => setNewExpense({ ...newExpense, splitType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Split method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Split Equally</SelectItem>
                    <SelectItem value="custom">Custom Amounts</SelectItem>
                    <SelectItem value="percentage">By Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCreateExpense}
                  disabled={!newExpense.title.trim() || !newExpense.amount || createExpenseMutation.isPending}
                  className="w-full bg-ios-blue hover:bg-ios-blue/90"
                >
                  {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Balance Overview */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="text-ios-headline font-semibold text-black mb-4">Balance Overview</h2>
            <div className="text-center py-4">
              <p className={`text-ios-title-1 font-bold ${netBalance >= 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
              <p className="text-ios-footnote text-ios-gray-5">Overall balance</p>
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
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="text-ios-headline font-semibold text-black mb-4">Recent Expenses</h2>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-ios-body text-ios-gray-5">No expenses yet</p>
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
