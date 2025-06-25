import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft, Edit3, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: "", lastName: "" });
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateNameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditOpen(false);
      toast({
        title: "Name updated!",
        description: "Your name has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    },
  });

  const handleUpdateName = () => {
    if (!editName.firstName.trim()) return;
    updateNameMutation.mutate(editName);
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  if (!user) {
    return (
      <div className="page-container page-transition">
        <div className="floating-header">
          <div className="page-header">
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-subtitle">Not logged in</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-enter">
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation("/")}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">Profile & Settings</h1>
              <p className="page-subtitle">
                Manage your account & app settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Profile Header */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.firstName?.[0] || user.email?.[0] || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName ||
                        user.email?.split("@")[0] ||
                        "Unknown User"}
                  </h2>
                  <p className="text-gray-600 truncate" title={user.email}>{user.email}</p>
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
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all p-0 flex-shrink-0"
                  >
                    <Edit3 size={16} className="text-gray-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="px-6 pt-6 pb-6">
                    <DialogTitle className="text-xl font-bold text-gray-900">
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
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Input
                      placeholder="Last name"
                      value={editName.lastName}
                      onChange={(e) =>
                        setEditName({ ...editName, lastName: e.target.value })
                      }
                      className="w-full p-4 border border-gray-200 rounded-xl"
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
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Account details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 flex-shrink-0">User ID</span>
                <span className="text-gray-900 font-mono text-sm truncate ml-4" title={user.id}>
                  {user.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Member since</span>
                <span className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        {household && (
          <Card className="smart-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Household Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600 flex-shrink-0">Name</span>
                  <span className="text-gray-900 font-semibold truncate ml-4" title={household.name}>
                    {household.name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Invite Code</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {household.inviteCode}
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg btn-animated"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Members</span>
                  <span className="text-gray-900">
                    {household.members?.length || 0}
                  </span>
                </div>
                {household.rentAmount && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="text-gray-900">
                      ${household.rentAmount}
                    </span>
                  </div>
                )}
                {household.rentDueDay && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">Rent Due Day</span>
                    <span className="text-gray-900">
                      {household.rentDueDay}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Household Members */}
        {household?.members && (
          <Card className="smart-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Household Members
              </h3>
              <div className="space-y-3">
                {household.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {member.user.firstName?.[0] ||
                            member.user.email?.[0] ||
                            "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">
                          {member.user.firstName && member.user.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.firstName ||
                              member.user.email?.split("@")[0] ||
                              "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.role === "admin" ? "Administrator" : "Member"}
                        </p>
                      </div>
                    </div>
                    {member.role && (
                      <span className="text-sm text-gray-600 capitalize px-2 py-1 bg-gray-100 rounded flex-shrink-0">
                        {member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <Button
              onClick={logout}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
