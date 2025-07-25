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
import { Edit3 } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import ThemePicker from "./ThemePicker";

interface ProfileHeaderProps {
  user: any;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  editName: { firstName: string; lastName: string };
  setEditName: (name: { firstName: string; lastName: string }) => void;
  handleUpdateName: () => void;
  updateNameMutation: any;
  theme: string;
  effectiveTheme: string;
  setTheme: (theme: "auto" | "light" | "dark") => void;
}

export default function ProfileHeader({
  user,
  isEditOpen,
  setIsEditOpen,
  editName,
  setEditName,
  handleUpdateName,
  updateNameMutation,
  theme,
  effectiveTheme,
  setTheme,
}: ProfileHeaderProps) {
  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <ProfileAvatar 
              user={user} 
              size="xl" 
              editable={true} 
              gradientType="emerald"
              className="rounded-3xl"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName ||
                    user.email?.split("@")[0] ||
                    "Unknown User"}
              </h2>
              <p className="truncate" style={{ color: 'var(--text-secondary)' }} title={user.email}>
                {user.email}
              </p>
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditName({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                  });
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all p-0 flex-shrink-0"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Edit3 size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="px-6 pt-6 pb-6">
                <DialogTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Edit Name
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <Input
                  placeholder="First name"
                  value={editName.firstName}
                  onChange={(e) =>
                    setEditName({ ...editName, firstName: e.target.value })
                  }
                  className="w-full p-4 rounded-xl"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Input
                  placeholder="Last name"
                  value={editName.lastName}
                  onChange={(e) =>
                    setEditName({ ...editName, lastName: e.target.value })
                  }
                  className="w-full p-4 rounded-xl"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Button
                  onClick={handleUpdateName}
                  disabled={
                    !editName.firstName.trim() ||
                    updateNameMutation.isPending
                  }
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                >
                  {updateNameMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Theme Picker */}
        <ThemePicker
          theme={theme}
          effectiveTheme={effectiveTheme}
          setTheme={setTheme}
        />
      </CardContent>
    </Card>
  );
}