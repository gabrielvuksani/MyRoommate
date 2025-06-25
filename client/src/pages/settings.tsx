import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Copy, LogOut, Users, Home, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const handleCopyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!household) {
    return (
      <div className="min-h-screen bg-ios-gray pb-20">
        <div className="h-6 bg-white"></div>
        <div className="px-4 pt-4 pb-6 bg-white">
          <h1 className="text-ios-large-title font-bold text-black">Settings</h1>
          <p className="text-ios-subhead text-ios-gray-5 mt-1">No household found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="floating-header">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation('/')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
              <p className="text-lg text-gray-600 mt-1">App & household settings</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-content space-y-6">
        {/* Household Info */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-ios-blue rounded-lg flex items-center justify-center">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-ios-headline font-semibold text-black">{household.name}</h2>
                <p className="text-ios-footnote text-ios-gray-5">
                  {household.members?.length || 0} member{household.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-ios-gray rounded-lg">
                <div>
                  <p className="text-ios-body font-medium text-black">Invite Code</p>
                  <p className="text-ios-footnote text-ios-gray-5">Share with new roommates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-ios-body font-mono text-black">{household.inviteCode}</span>
                  <Button
                    onClick={handleCopyInviteCode}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <Copy size={16} className="text-ios-blue" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-ios-green rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <h2 className="text-ios-headline font-semibold text-black">Members</h2>
            </div>
            
            <div className="space-y-3">
              {household.members?.map((member: any) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-ios-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-ios-footnote font-medium">
                      {member.user.firstName?.[0] || member.user.email?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-ios-body text-black">
                      {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
                    </p>
                    <p className="text-ios-footnote text-ios-gray-5">
                      {member.role === 'admin' ? 'Admin' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {member.userId === user?.id && (
                    <span className="text-ios-caption text-ios-blue font-medium">You</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full bg-ios-red hover:bg-ios-red/90 text-white"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}