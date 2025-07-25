import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, UserMinus, Edit3, Check, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PersistentLoading } from "@/lib/persistentLoading";

interface HouseholdSectionProps {
  household: any;
  isAdmin: boolean;
}

export const HouseholdSection = React.memo(({ household, isAdmin }: HouseholdSectionProps) => {
  const [isHouseholdEditOpen, setIsHouseholdEditOpen] = React.useState(false);
  const [editHouseholdName, setEditHouseholdName] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/households/leave");
    },
    onSuccess: () => {
      queryClient.clear();
      PersistentLoading.show("Leaving household...");
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.reload();
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("PATCH", "/api/households/current", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setIsHouseholdEditOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to update household:", error);
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/households/current/all-data");
    },
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error("Failed to delete household data:", error);
    },
  });

  const handleCopyInviteCode = React.useCallback(async () => {
    if (!household?.inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [household?.inviteCode]);

  const handleUpdateHousehold = React.useCallback(() => {
    if (editHouseholdName.trim()) {
      updateHouseholdMutation.mutate({ name: editHouseholdName });
    }
  }, [editHouseholdName, updateHouseholdMutation]);

  const handleDeleteAllData = React.useCallback(async () => {
    const confirmDelete = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL household data including:\n\n" +
      "• All chores and history\n" +
      "• All expenses and balances\n" +
      "• All calendar events\n" +
      "• All messages\n" +
      "• All member data\n\n" +
      "This action CANNOT be undone. Are you absolutely sure?"
    );

    if (!confirmDelete) return;

    const finalConfirm = window.confirm(
      "🔴 FINAL WARNING: You are about to delete EVERYTHING. Type 'DELETE' to confirm."
    );

    if (!finalConfirm) return;

    try {
      PersistentLoading.show("Deleting all data...");
      await deleteAllDataMutation.mutateAsync();
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.replace('/');
      }, 1000);
    } catch (error) {
      console.error('Delete all data error:', error);
      PersistentLoading.hide();
      alert('Failed to delete all data. Please try again.');
    }
  }, [deleteAllDataMutation]);

  if (!household) return null;

  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Household
          </h3>
          <Dialog open={isHouseholdEditOpen} onOpenChange={setIsHouseholdEditOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditHouseholdName(household.name || "")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all p-0"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Edit3 size={14} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Household Name</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Household Name
                  </label>
                  <Input
                    placeholder="Enter household name"
                    value={editHouseholdName}
                    onChange={(e) => setEditHouseholdName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdateHousehold}
                  className="w-full"
                  disabled={updateHouseholdMutation.isPending}
                >
                  {updateHouseholdMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Household Name</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {household.name}
            </span>
          </div>
          <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Invite Code</span>
            <div className="flex items-center space-x-2">
              <code className="font-mono text-sm px-2 py-1 rounded" style={{
                background: 'var(--surface-secondary)',
                color: 'var(--primary)'
              }}>
                {household.inviteCode}
              </code>
              <Button
                onClick={handleCopyInviteCode}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all p-0"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center py-3">
            <span style={{ color: 'var(--text-secondary)' }}>Members</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {household.members?.length || 0} members
            </span>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              onClick={() => leaveHouseholdMutation.mutate()}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-orange-700"
            >
              <UserMinus size={20} />
              <span>Leave Household</span>
            </Button>

            {isAdmin && (
              <Button
                onClick={handleDeleteAllData}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700"
              >
                <Trash2 size={20} />
                <span>Delete All Household Data</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

HouseholdSection.displayName = 'HouseholdSection';