import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "../lib/queryClient";
import ExpenseCard from "../components/expense-card";
import { Card, CardContent } from "@/components/ui/card";

export default function Expenses() {
  const [, setLocation] = useLocation();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unsettled" | "settled">("all");
  const queryClient = useQueryClient();

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

  // Fetch data
  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  }) as { data: any[] };

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
  }) as { data: any };

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  }) as { data: any };

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error) => {

    },
  });

  const settleMutation = useMutation({
    mutationFn: async ({ splitId, settled }: { splitId: string; settled: boolean }) => {
      await apiRequest("PATCH", `/api/expenses/splits/${splitId}`, { settled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error) => {

    },
  });

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleSettleExpense = (params: { splitId: string; settled: boolean }) => {
    settleMutation.mutate(params);
  };

  // Filter expenses based on active tab
  const filteredExpenses = expenses.filter((expense: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "settled") {
      return expense.splits?.every((split: any) => split.settled);
    }
    if (activeTab === "unsettled") {
      return expense.splits?.some((split: any) => !split.settled);
    }
    return true;
  });

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Expenses</h1>
              <p className="page-subtitle">Track shared costs</p>
            </div>
            
            <button
              onClick={() => setLocation("/add-expense")}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated"
            >
              <Plus size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content px-6 space-y-6">
        {/* Balance Overview */}
        <Card className="glass-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Your Balance</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Overall expense overview</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                <div className="text-2xl font-bold text-green-600">${balance?.totalOwed?.toFixed(2) || "0.00"}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>You're Owed</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                <div className="text-2xl font-bold text-red-500">${balance?.totalOwing?.toFixed(2) || "0.00"}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>You Owe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { key: "all", label: "All", count: expenses.length },
            { key: "unsettled", label: "Unsettled", count: expenses.filter((e: any) => e.splits?.some((s: any) => !s.settled)).length },
            { key: "settled", label: "Settled", count: expenses.filter((e: any) => e.splits?.every((s: any) => s.settled)).length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? 'btn-animated text-white shadow-lg'
                  : 'text-secondary hover:scale-[1.02]'
              }`}
              style={{
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface-secondary)',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                border: activeTab === tab.key ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}>
                  <DollarSign size={32} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {activeTab === "all" ? "No Expenses Yet" : `No ${activeTab} Expenses`}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {activeTab === "all" 
                    ? "Start tracking shared expenses with your household"
                    : `You have no ${activeTab} expenses at the moment`
                  }
                </p>
                {activeTab === "all" && (
                  <button
                    onClick={() => setLocation("/add-expense")}
                    className="px-6 py-3 rounded-xl font-medium btn-animated text-white hover:scale-[1.05] transition-all"
                    style={{ background: 'var(--primary)' }}
                  >
                    Add First Expense
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense: any) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onSettleExpense={handleSettleExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}