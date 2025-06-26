import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Copy, LogOut, Users, Home } from "lucide-react";
import BackButton from "../components/back-button";
import { getProfileInitials } from "@/lib/nameUtils";

import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Settings() {
  const { user } = useAuth();

  const [, setLocation] = useLocation();
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyInviteCode = () => {
    if ((household as any)?.inviteCode) {
      navigator.clipboard.writeText((household as any).inviteCode);
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
    <div className="page-container page-enter">
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">App & household settings</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-32 px-6 space-y-6">
        {/* Household Info */}
        <div className="smart-card p-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{(household as any)?.name}</h2>
                <p className="text-sm text-gray-600">
                  {(household as any)?.members?.length || 0} member{(household as any)?.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Invite Code</p>
                  <p className="text-xs text-gray-600">Share with new roommates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900">{(household as any)?.inviteCode}</span>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors btn-animated"
                  >
                    <Copy size={16} className="text-primary" />
                  </button>
                </div>
              </div>
            </div>
        </div>

        {/* Members */}
        <div className="smart-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            </div>
            
            <div className="space-y-3">
              {(household as any)?.members?.map((member: any) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getProfileInitials(member.user.firstName, member.user.lastName, member.user.email)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {member.user.firstName || member.user.email?.split('@')[0] || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {member.role === 'admin' ? 'Admin' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {member.userId === (user as any)?.id && (
                    <span className="text-xs text-primary font-medium">You</span>
                  )}
                </div>
              ))}
            </div>
        </div>

        {/* Account Actions */}
        <div className="smart-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-semibold btn-animated flex items-center justify-center space-x-2"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
        </div>
      </div>
    </div>
  );
}