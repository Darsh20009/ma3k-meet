import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ParticipantManagement from "./participant-management";
import ChatSidebar from "./chat-sidebar";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Meeting } from "@shared/schema";

interface MeetingInterfaceProps {
  meeting: Meeting;
  onLeave: () => void;
}

export default function MeetingInterface({ meeting, onLeave }: MeetingInterfaceProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const { isConnected, messages, sendMessage, setMessages } = useWebSocket(meeting.id);

  // Meeting timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMicrophone = () => setIsMicOn(!isMicOn);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const toggleParticipants = () => setShowParticipants(!showParticipants);

  return (
    <div className="h-screen flex flex-col bg-gray-900" dir="rtl">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              مع
            </div>
            <span className="mr-3 text-xl font-bold text-gray-800">معك ميتيجس</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="flex items-center bg-success/10 text-success px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-success rounded-full ml-2 animate-pulse"></div>
            <span>{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLeave}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <i className="fas fa-sign-out-alt ml-2"></i>
            مغادرة
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <ParticipantManagement 
          meeting={meeting} 
          showParticipants={showParticipants}
        />
        
        {/* Main Meeting Area */}
        <main className="flex-1 flex flex-col bg-gray-900 relative">
          
          {/* Meeting Header */}
          <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></div>
                <span className="text-white font-medium">جاري التسجيل</span>
              </div>
              <span className="text-gray-300 text-sm">{meeting.name}</span>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-2">
              <span className="text-white text-sm bg-white/20 px-3 py-1 rounded">
                <i className="fas fa-users ml-1"></i>
                4 مشاركين
              </span>
              <span className="text-white text-sm">{formatDuration(meetingDuration)}</span>
            </div>
          </div>
          
          {/* Video Grid Area */}
          <div className="flex-1 p-6 grid grid-cols-2 gap-4">
            
            {/* Main Speaker (User) */}
            <div className="bg-gray-800 rounded-xl relative meeting-active p-4 col-span-2 h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
                    أنت
                  </div>
                  <h3 className="text-white font-semibold text-lg">أنت (المضيف)</h3>
                  <p className="text-gray-300 text-sm">
                    {isMicOn ? 'يتحدث الآن' : 'صامت'}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 flex space-x-reverse space-x-2">
                <div className={`p-2 rounded-full ${isMicOn ? 'bg-success text-white' : 'bg-gray-600 text-white'}`}>
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-sm`}></i>
                </div>
                {isVideoOn && (
                  <div className="bg-success text-white p-2 rounded-full">
                    <i className="fas fa-video text-sm"></i>
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 bg-white/20 text-white px-2 py-1 rounded text-sm">
                أنت
              </div>
              {isScreenSharing && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                  <i className="fas fa-desktop ml-1"></i>
                  مشاركة الشاشة
                </div>
              )}
            </div>
            
            {/* Virtual Participants */}
            <div className="bg-gray-700 rounded-xl relative p-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">
                    فا
                  </div>
                  <h4 className="text-white font-medium">فاطمة أحمد</h4>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-white/20 text-white px-2 py-1 rounded text-xs">
                فاطمة أحمد
              </div>
              <div className="absolute bottom-3 left-3 bg-gray-600 text-white p-1 rounded-full">
                <i className="fas fa-microphone-slash text-xs"></i>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-xl relative p-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">
                    أح
                  </div>
                  <h4 className="text-white font-medium">أحمد محمد</h4>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-white/20 text-white px-2 py-1 rounded text-xs">
                أحمد محمد
              </div>
              <div className="absolute bottom-3 left-3 bg-success text-white p-1 rounded-full">
                <i className="fas fa-microphone text-xs"></i>
              </div>
            </div>
            
          </div>
          
          {/* Meeting Controls */}
          <div className="bg-gray-800 px-6 py-4 flex justify-center">
            <div className="flex items-center space-x-reverse space-x-4">
              <Button
                onClick={toggleMicrophone}
                className={`p-3 rounded-full transition-colors ${
                  isMicOn 
                    ? 'bg-success hover:bg-success/90 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </Button>
              <Button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoOn
                    ? 'bg-success hover:bg-success/90 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'}`}></i>
              </Button>
              <Button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                <i className="fas fa-desktop"></i>
              </Button>
              <Button
                onClick={toggleParticipants}
                className="bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-full transition-colors"
              >
                <i className="fas fa-users"></i>
              </Button>
              <Button
                onClick={onLeave}
                className="bg-danger hover:bg-danger/90 text-white p-3 rounded-full transition-colors"
              >
                <i className="fas fa-phone-slash"></i>
              </Button>
            </div>
          </div>
          
        </main>
        
        {/* Chat Sidebar */}
        <ChatSidebar 
          meeting={meeting}
          messages={messages}
          onSendMessage={sendMessage}
          setMessages={setMessages}
        />
        
      </div>
      
    </div>
  );
}
