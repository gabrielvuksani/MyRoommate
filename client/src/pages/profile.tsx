import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, LogOut } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-ios-gray pb-20">
        <div className="h-6 bg-white"></div>
        <div className="px-4 pt-4 pb-6 bg-white">
          <h1 className="text-ios-large-title font-bold text-black">Profile</h1>
          <p className="text-ios-subhead text-ios-gray-5 mt-1">Not logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="h-6 bg-surface-elevated"></div>
      
      <div className="page-header">
        <h1 className="text-large-title font-bold text-primary">Profile</h1>
        <p className="text-subhead text-secondary mt-2">Your account information</p>
      </div>
      
      <div className="page-content space-y-6">
        {/* Profile Info */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-ios-blue rounded-full flex items-center justify-center">
                <span className="text-white text-ios-title-2 font-medium">
                  {user.firstName?.[0] || user.email?.[0] || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-ios-title-2 font-bold text-black">
                  {user.firstName || user.email?.split('@')[0] || 'Unknown User'}
                </h2>
                <p className="text-ios-subhead text-ios-gray-5">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-ios-gray rounded-lg">
                <div className="w-8 h-8 bg-ios-green rounded-lg flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-ios-footnote text-ios-gray-5">Full Name</p>
                  <p className="text-ios-body text-black">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.firstName || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-ios-gray rounded-lg">
                <div className="w-8 h-8 bg-ios-orange rounded-lg flex items-center justify-center">
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-ios-footnote text-ios-gray-5">Email</p>
                  <p className="text-ios-body text-black">{user.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-ios-gray rounded-lg">
                <div className="w-8 h-8 bg-ios-blue rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-ios-footnote text-ios-gray-5">Joined</p>
                  <p className="text-ios-body text-black">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
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