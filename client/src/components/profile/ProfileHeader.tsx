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
import { Edit3 } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProfileHeaderProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export const ProfileHeader = React.memo(({ user }: ProfileHeaderProps) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState({ firstName: "", lastName: "" });

  const updateNameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to update name:", error);
    },
  });

  const handleUpdateName = React.useCallback(() => {
    if (editName.firstName.trim() && editName.lastName.trim()) {
      updateNameMutation.mutate(editName);
    }
  }, [editName, updateNameMutation]);

  if (!user) return null;

  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <ProfileAvatar 
              user={user as any} 
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
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    First Name
                  </label>
                  <Input
                    placeholder="Enter your first name"
                    value={editName.firstName}
                    onChange={(e) =>
                      setEditName({ ...editName, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Last Name
                  </label>
                  <Input
                    placeholder="Enter your last name"
                    value={editName.lastName}
                    onChange={(e) =>
                      setEditName({ ...editName, lastName: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={handleUpdateName}
                  className="w-full"
                  disabled={updateNameMutation.isPending}
                >
                  {updateNameMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
});

ProfileHeader.displayName = 'ProfileHeader';