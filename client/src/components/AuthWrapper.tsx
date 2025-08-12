import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme: string;
  chatBackground: string;
  createdAt: Date;
}

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('userProfile');
    
    if (savedUser) {
      try {
        const userProfile = JSON.parse(savedUser);
        setUser(userProfile);
        localStorage.setItem('meetUserName', userProfile.name);
      } catch (error) {
        console.error('Error parsing user profile:', error);
        localStorage.removeItem('userProfile');
      }
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="text-white text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-user text-2xl"></i>
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  return <>{children}</>;
}