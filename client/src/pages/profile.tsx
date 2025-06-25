import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft, Edit3, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: '', lastName: '' });
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    accentColor: 'blue'
  });

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const updateNameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await apiRequest(`/api/auth/user`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response;
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

  const toggleNotifications = () => {
    setSettings(prev => ({ ...prev, notifications: !prev.notifications }));
    toast({
      title: settings.notifications ? "Notifications disabled" : "Notifications enabled",
      description: settings.notifications ? "You won't receive push notifications" : "You'll receive push notifications for updates",
    });
  };

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    toast({
      title: settings.darkMode ? "Light mode enabled" : "Dark mode enabled",
      description: "Theme preference saved",
    });
  };

  const changeAccentColor = (color: string) => {
    setSettings(prev => ({ ...prev, accentColor: color }));
    toast({
      title: "Accent color updated",
      description: `Changed to ${color}`,
    });
  };

  if (!user) {
    return (
      <div className="page-container">
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
    <div className="page-container">
      <div className="floating-header">
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation('/')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">Profile & Settings</h1>
              <p className="page-subtitle">Manage your account & app settings</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-content space-y-6">
        {/* Profile Header */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                  <span className="text-primary text-2xl font-bold">
                    {user.firstName?.[0] || user.email?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName && user.lastName ? 
                      `${user.firstName} ${user.lastName}` : 
                      user.firstName || 
                      user.email?.split('@')[0] || 
                      'Unknown User'
                    }
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditName({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                      });
                    }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all p-0"
                  >
                    <Edit3 size={16} className="text-gray-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="modal-content">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Edit Name</DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <Input
                      placeholder="First name"
                      value={editName.firstName}
                      onChange={(e) => setEditName({ ...editName, firstName: e.target.value })}
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Input
                      placeholder="Last name"
                      value={editName.lastName}
                      onChange={(e) => setEditName({ ...editName, lastName: e.target.value })}
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Button 
                      onClick={handleUpdateName}
                      disabled={!editName.firstName.trim() || updateNameMutation.isPending}
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                    >
                      {updateNameMutation.isPending ? "Saving..." : "Save Changes"}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">User ID</span>
                <span className="text-gray-900 font-mono text-sm">{user.id}</span>
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

        {/* App Settings */}
        <Card className="smart-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">App Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <span className="text-gray-900 font-medium">Notifications</span>
                  <p className="text-sm text-gray-600">Get notified about chores, bills, and messages</p>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.notifications ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <span className="text-gray-900 font-medium">Dark Mode</span>
                  <p className="text-sm text-gray-600">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.darkMode ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <span className="text-gray-900 font-medium">Accent Color</span>
                  <p className="text-sm text-gray-600">Customize your app theme</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => changeAccentColor('blue')}
                    className={`w-6 h-6 bg-blue-500 rounded-full transition-all ${
                      settings.accentColor === 'blue' ? 'ring-2 ring-blue-200 scale-110' : 'hover:scale-105'
                    }`}
                  />
                  <button
                    onClick={() => changeAccentColor('green')}
                    className={`w-6 h-6 bg-green-500 rounded-full transition-all ${
                      settings.accentColor === 'green' ? 'ring-2 ring-green-200 scale-110' : 'hover:scale-105'
                    }`}
                  />
                  <button
                    onClick={() => changeAccentColor('purple')}
                    className={`w-6 h-6 bg-purple-500 rounded-full transition-all ${
                      settings.accentColor === 'purple' ? 'ring-2 ring-purple-200 scale-110' : 'hover:scale-105'
                    }`}
                  />
                  <button
                    onClick={() => changeAccentColor('orange')}
                    className={`w-6 h-6 bg-orange-500 rounded-full transition-all ${
                      settings.accentColor === 'orange' ? 'ring-2 ring-orange-200 scale-110' : 'hover:scale-105'
                    }`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        {household && (
          <Card className="smart-card">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Household Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Name</span>
                  <span className="text-gray-900 font-semibold">{household.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Invite Code</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{household.inviteCode}</span>
                    <Button
                      onClick={copyInviteCode}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Members</span>
                  <span className="text-gray-900">{household.members?.length || 0}</span>
                </div>
                {household.rentAmount && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="text-gray-900">${household.rentAmount}</span>
                  </div>
                )}
                {household.rentDueDay && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">Rent Due Day</span>
                    <span className="text-gray-900">{household.rentDueDay}</span>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Household Members</h3>
              <div className="space-y-3">
                {household.members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {member.user.firstName?.[0] || member.user.email?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          {member.user.firstName && member.user.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'
                          }
                        </p>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                    {member.role && (
                      <span className="text-sm text-gray-600 capitalize px-2 py-1 bg-gray-100 rounded">
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