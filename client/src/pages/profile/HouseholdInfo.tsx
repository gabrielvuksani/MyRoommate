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
import { LogOut, Edit3, Copy, UserMinus, Check, Trash2 } from "lucide-react";

interface HouseholdInfoProps {
  household: any;
  isAdmin: boolean;
  isCopied: boolean;
  isHouseholdEditOpen: boolean;
  setIsHouseholdEditOpen: (open: boolean) => void;
  editHouseholdName: string;
  setEditHouseholdName: (name: string) => void;
  handleUpdateHousehold: () => void;
  updateHouseholdMutation: any;
  copyInviteCode: () => void;
  handleLeaveHousehold: () => void;
  handleDeleteAllData: () => void;
  logout: () => void;
}

export default function HouseholdInfo({
  household,
  isAdmin,
  isCopied,
  isHouseholdEditOpen,
  setIsHouseholdEditOpen,
  editHouseholdName,
  setEditHouseholdName,
  handleUpdateHousehold,
  updateHouseholdMutation,
  copyInviteCode,
  handleLeaveHousehold,
  handleDeleteAllData,
  logout,
}: HouseholdInfoProps) {
  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {household.name}
              </h3>
              <Dialog open={isHouseholdEditOpen} onOpenChange={setIsHouseholdEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditHouseholdName(household.name || "");
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all p-0"
                    style={{
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Edit3 size={14} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="px-6 pt-6 pb-6">
                    <DialogTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Edit Household Name
                    </DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <Input
                      placeholder="Household name"
                      value={editHouseholdName}
                      onChange={(e) => setEditHouseholdName(e.target.value)}
                      className="w-full p-4 rounded-xl"
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Button
                      onClick={handleUpdateHousehold}
                      disabled={
                        !editHouseholdName.trim() ||
                        updateHouseholdMutation.isPending
                      }
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                    >
                      {updateHouseholdMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              {household.members?.length || 0} member{household.members?.length !== 1 && 's'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-xl flex items-center justify-between" style={{ 
            background: 'var(--surface-secondary)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Invite Code
              </p>
              <p className="font-mono text-lg" style={{ color: 'var(--primary)' }}>
                {household.inviteCode}
              </p>
            </div>
            <Button
              onClick={copyInviteCode}
              className="btn-animated p-3 rounded-xl"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              {isCopied ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Copy size={18} />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleLeaveHousehold}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-orange-700"
            >
              <UserMinus size={20} />
              <span>Leave</span>
            </Button>
            <Button
              onClick={logout}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </Button>
          </div>

          {isAdmin && (
            <Button
              onClick={handleDeleteAllData}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Trash2 size={20} />
              <span>Delete All Household Data</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}