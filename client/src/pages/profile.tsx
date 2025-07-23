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
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Edit3, Copy, UserMinus, RefreshCw, Moon, Sun, Check, Bell, CheckCircle, Info } from "lucide-react";
import { getProfileInitials } from "@/lib/nameUtils";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useTheme } from "@/lib/ThemeProvider";
import BackButton from "../components/back-button";
import { PersistentLoading } from "@/lib/persistentLoading";
import { notificationService } from "@/lib/notifications";

import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const { theme, effectiveTheme, setTheme } = useTheme();

  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: "", lastName: "" });
  const [isHouseholdEditOpen, setIsHouseholdEditOpen] = useState(false);
  const [editHouseholdName, setEditHouseholdName] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);


  const [isCopied, setIsCopied] = useState(false);

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
      const result = await apiRequest("POST", "/api/households/leave", {});
      return result;
    },
    onSuccess: () => {
      // Don't modify loading state here - button handler controls entire sequence
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
      // Don't modify loading state here - button handler will handle it
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("DELETE", "/api/dev/delete-all-data", {});
      return result;
    },
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error("Failed to delete all data:", error);
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
    // Show persistent loading overlay
    PersistentLoading.show("Signing out...");
    window.location.href = "/api/logout";
  };

  const copyInviteCode = async () => {
    if ((household as any)?.inviteCode) {
      try {
        await navigator.clipboard.writeText((household as any).inviteCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy invite code:', err);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      // Show loading state
      PersistentLoading.show("Refreshing app data...");
      
      // Clear all caches step by step for PWA compatibility
      await queryClient.clear();
      
      // Clear browser storage
      try {
        localStorage.clear();
      } catch (e) {
        console.log('localStorage clear failed:', e);
      }
      
      try {
        sessionStorage.clear();
      } catch (e) {
        console.log('sessionStorage clear failed:', e);
      }
      
      // Clear service worker caches if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.log('Cache clearing failed:', e);
        }
      }
      
      // Use a more PWA-friendly navigation approach
      setTimeout(() => {
        // Hide the loading first
        PersistentLoading.hide();
        
        // For PWA, use location.replace instead of href to avoid navigation issues
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        } else {
          // If already on home, force a reload
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Refresh error:', error);
      // Fallback: hide loading and try simple reload
      PersistentLoading.hide();
      setTimeout(() => {
        window.location.reload();
      }, 500);
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
    <div className="page-container page-transition">
      
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
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
                    {(user as any).firstName && (user as any).lastName
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : (user as any).firstName ||
                        (user as any).email?.split("@")[0] ||
                        "Unknown User"}
                  </h2>
                  <p className="truncate" style={{ color: 'var(--text-secondary)' }} title={(user as any).email}>
                    {(user as any).email}
                  </p>
                </div>
              </div>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditName({
                        firstName: (user as any).firstName || "",
                        lastName: (user as any).lastName || "",
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
            <div className="pt-6 mt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                Appearance
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => setTheme("auto")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'auto' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'auto' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'auto' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-400 to-blue-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-800 rounded-full" style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' 
                    }}></div>
                  </div>
                  <span className="text-xs font-semibold">Auto</span>
                </Button>
                <Button
                  onClick={() => setTheme("light")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'light' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'light' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'light' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Sun size={16} className="text-white drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold">Light</span>
                </Button>
                <Button
                  onClick={() => setTheme("dark")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'dark' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'dark' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'dark' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
                    <Moon size={16} className="text-slate-300 drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold">Dark</span>
                </Button>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                {theme === 'auto' 
                  ? `Following system (currently ${effectiveTheme})`
                  : `Using ${theme} mode`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Account details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>User ID</span>
                <span
                  className="font-mono text-sm truncate ml-4"
                  style={{ color: 'var(--text-primary)' }}
                  title={(user as any).id}
                >
                  {(user as any).id}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date((user as any).createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        {household && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>Name</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={(household as any).name}
                    >
                      {(household as any).name}
                    </span>
                    <Dialog open={isHouseholdEditOpen} onOpenChange={setIsHouseholdEditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditHouseholdName((household as any)?.name || "");
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
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invite Code</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm px-2 py-1 rounded" style={{
                      color: 'var(--text-primary)',
                      background: 'var(--surface-secondary)'
                    }}>
                      {(household as any).inviteCode}
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="p-2 rounded-lg btn-animated transition-all duration-300 relative"
                      style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div className={`transition-all duration-300 ease-in-out ${isCopied ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`}>
                        <Copy size={14} />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${isCopied ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`}>
                        <Check size={14} style={{ color: '#10b981' }} />
                      </div>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Members</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {(household as any).members?.length || 0}
                  </span>
                </div>
                {(household as any).rentAmount && (
                  <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Rent</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      ${(household as any).rentAmount}
                    </span>
                  </div>
                )}
                {(household as any).rentDueDay && (
                  <div className="flex justify-between items-center py-3">
                    <span style={{ color: 'var(--text-secondary)' }}>Rent Due Day</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {(household as any).rentDueDay}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Household Members */}
        {(household as any)?.members && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Members
              </h3>
              <div className="space-y-3">
                {(household as any).members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center space-x-3">
                      <ProfileAvatar 
                        user={member.user} 
                        size="md" 
                        gradientType="blue"
                      />
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
                        background: 'var(--surface-secondary)'
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

        {/* Background Notifications Section */}
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Background Notifications</h3>
                  <p className="text-sm text-secondary">Real-time alerts when app is closed</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-surface-secondary/30 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>New messages from roommates</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Chore assignments and completions</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>New shared expenses</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Calendar events and reminders</span>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 dark:text-green-200 font-medium mb-1">Background notifications active</p>
                  <p className="text-green-600 dark:text-green-300">You'll receive real-time notifications even when the app is closed. This keeps you connected with your household activities.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Developer Tools */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Developer Tools
            </h3>
            <Button
              onClick={handleRefresh}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700"
            >
              <RefreshCw size={20} />
              <span>Refresh App & Data</span>
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <div className="space-y-3">
              {(household as any) && (
                <Button
                  onClick={async () => {
                    // Show persistent loading overlay
                    PersistentLoading.show("Leaving household...");
                    
                    try {
                      await leaveHouseholdMutation.mutateAsync();
                      
                      // Navigate immediately - loading will persist through refresh
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 500);
                    } catch (error) {
                      console.error("Failed to leave household:", error);
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 500);
                    }
                  }}
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
