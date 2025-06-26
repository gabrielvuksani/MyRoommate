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
import { useTheme } from "@/lib/ThemeProvider";
import { LogOut, ArrowLeft, Edit3, Copy, UserMinus, RefreshCw, Moon, Sun } from "lucide-react";
import { getProfileInitials } from "@/lib/nameUtils";
import { Switch } from "@/components/ui/switch";

import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: "", lastName: "" });
  const [isHouseholdEditOpen, setIsHouseholdEditOpen] = useState(false);
  const [editHouseholdName, setEditHouseholdName] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

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
    },
    onError: (error: any) => {
      console.error("Failed to update name:", error);
    },
  });

  const updateHouseholdNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("PATCH", "/api/households/current", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setIsHouseholdEditOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to update household name:", error);
    },
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/households/leave", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setLocation("/onboarding");
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
    },
  });

  const handleUpdateName = () => {
    if (!editName.firstName.trim()) return;
    updateNameMutation.mutate(editName);
  };

  const handleUpdateHouseholdName = () => {
    if (!editHouseholdName.trim()) return;
    updateHouseholdNameMutation.mutate(editHouseholdName);
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();
      // Refresh the page after all other operations complete
      window.location.reload();
    } finally {
      setIsRefreshing(false);
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
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">
                Manage your account & app settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-36 px-6 space-y-6">
        {/* Profile Header */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {getProfileInitials(user.firstName, user.lastName, user.email)}
                  </span>
                </div>
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
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  >
                    <Edit3 size={16} style={{ color: 'var(--text-secondary)' }} />
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

        {/* Display Settings */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Display Settings
            </h3>
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <Sun className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                )}
                <span style={{ color: 'var(--text-secondary)' }}>Dark Mode</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Account details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }} className="flex-shrink-0">User ID</span>
                <span
                  className="font-mono text-sm truncate ml-4"
                  style={{ color: 'var(--text-primary)' }}
                  title={user?.id}
                >
                  {user?.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        {household && (
          <Card className="smart-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="flex-shrink-0">Name</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={household?.name}
                    >
                      {household.name}
                    </span>
                    <Dialog open={isHouseholdEditOpen} onOpenChange={setIsHouseholdEditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditHouseholdName(household?.name || "");
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all p-0 flex-shrink-0"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        >
                          <Edit3 size={16} style={{ color: 'var(--text-secondary)' }} />
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
                            className="w-full p-4 border border-gray-200 rounded-xl"
                          />
                          <Button
                            onClick={handleUpdateHouseholdName}
                            disabled={
                              !editHouseholdName.trim() ||
                              updateHouseholdNameMutation.isPending
                            }
                            className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                          >
                            {updateHouseholdNameMutation.isPending
                              ? "Saving..."
                              : "Save Changes"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invite Code</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm px-2 py-1 rounded" style={{ 
                      color: 'var(--text-primary)', 
                      backgroundColor: 'var(--bg-secondary)' 
                    }}>
                      {household.inviteCode}
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="p-2 rounded-lg btn-animated"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    >
                      <Copy size={14} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Members</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {household.members?.length || 0}
                  </span>
                </div>
                {household.rentAmount && (
                  <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Rent</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      ${household.rentAmount}
                    </span>
                  </div>
                )}
                {household.rentDueDay && (
                  <div className="flex justify-between items-center py-3">
                    <span style={{ color: 'var(--text-secondary)' }}>Rent Due Day</span>
                    <span style={{ color: 'var(--text-primary)' }}>
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
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Members
              </h3>
              <div className="space-y-3">
                {household.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
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
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {member.user.firstName && member.user.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.firstName ||
                              member.user.email?.split("@")[0] ||
                              "Unknown"}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {member.role === "admin" ? "Administrator" : "Member"}
                        </p>
                      </div>
                    </div>
                    {member.role && (
                      <span className="text-sm capitalize px-2 py-1 rounded flex-shrink-0" style={{ 
                        color: 'var(--text-secondary)', 
                        backgroundColor: 'var(--bg-secondary)' 
                      }}>
                        {member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
                <span>
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </span>
              </Button>
              {household && (
                <Button
                  onClick={() => leaveHouseholdMutation.mutate()}
                  disabled={leaveHouseholdMutation.isPending}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-orange-700 disabled:opacity-50"
                >
                  <UserMinus size={20} />
                  <span>
                    {leaveHouseholdMutation.isPending
                      ? "Leaving..."
                      : "Leave Household"}
                  </span>
                </Button>
              )}
              <Button
                onClick={logout}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
