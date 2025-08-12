import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ParticipantManagement from "./participant-management";
import ChatSidebar from "./chat-sidebar";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Meeting, VirtualParticipant } from "@shared/schema";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await meetingContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const shareInviteLink = () => {
    const inviteUrl = `${window.location.origin}/meeting/${meeting.id}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الاجتماع بنجاح",
      });
    }).catch(() => {
      setShowShareDialog(true);
    });
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={meetingContainerRef}
      className={`h-screen flex flex-col bg-gray-900 ${isFullscreen ? 'p-0' : ''}`} 
      dir="rtl"
    >
      
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
            onClick={shareInviteLink}
            className="text-primary hover:text-primary/80 hover:bg-primary/5"
          >
            <i className="fas fa-share ml-2"></i>
            مشاركة
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} ml-2`}></i>
            {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          </Button>
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
                  {(() => {
                    const userName = localStorage.getItem('userName') || 'أنت';
                    const userAvatar = userName.slice(0, 2);
                    return (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
                          {userAvatar}
                        </div>
                        <h3 className="text-white font-semibold text-lg">{userName} (أنت)</h3>
                        <p className="text-gray-300 text-sm">
                          {isMicOn ? 'يتحدث الآن' : 'صامت'}
                        </p>
                      </>
                    );
                  })()}
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
                {localStorage.getItem('userName') || 'أنت'}
              </div>
              {isScreenSharing && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                  <i className="fas fa-desktop ml-1"></i>
                  مشاركة الشاشة
                </div>
              )}
            </div>
            
            {/* Virtual Participants - Dynamic rendering */}
            {(() => {
              const { data: participants = [] } = useQuery<VirtualParticipant[]>({
                queryKey: ['/api/meetings', meeting.id, 'participants'],
              });

              return participants.slice(0, 4).map((participant, index) => {
                const colors = [
                  'from-green-500 to-teal-500',
                  'from-blue-500 to-purple-500',
                  'from-orange-500 to-red-500',
                  'from-purple-500 to-pink-500'
                ];
                
                return (
                  <div 
                    key={participant.id} 
                    className="bg-gray-700 rounded-xl relative p-4 participant-card"
                    onClick={() => {
                      // Future: Implement participant focus/zoom
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${colors[index % colors.length]} rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2`}>
                          {participant.avatar}
                        </div>
                        <h4 className="text-white font-medium">{participant.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          participant.status === 'active' ? 'bg-success/20 text-success' :
                          participant.status === 'away' ? 'bg-warning/20 text-warning' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {participant.status === 'active' ? 'نشط' :
                           participant.status === 'away' ? 'بعيد' : 'غير متصل'}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-white/20 text-white px-2 py-1 rounded text-xs">
                      {participant.name}
                    </div>
                    <div className={`absolute bottom-3 left-3 p-1 rounded-full ${
                      participant.status === 'active' ? 'bg-success text-white' : 'bg-gray-600 text-white'
                    }`}>
                      <i className={`fas ${participant.status === 'active' ? 'fa-microphone' : 'fa-microphone-slash'} text-xs`}></i>
                    </div>
                  </div>
                );
              });
            })()}
            
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
                onClick={shareInviteLink}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-colors"
                title="مشاركة رابط الاجتماع"
              >
                <i className="fas fa-share"></i>
              </Button>
              <Button
                onClick={toggleFullscreen}
                className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full transition-colors"
                title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
              >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
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
      
      {/* Share Dialog Modal */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">مشاركة رابط الاجتماع</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الاجتماع:
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/meeting/${meeting.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => {
                      const url = `${window.location.origin}/meeting/${meeting.id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        toast({
                          title: "تم النسخ",
                          description: "تم نسخ رابط الاجتماع بنجاح",
                        });
                        setShowShareDialog(false);
                      });
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-l-md hover:bg-primary/90"
                  >
                    نسخ
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                شارك هذا الرابط مع الأشخاص الذين تريد دعوتهم للاجتماع
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowShareDialog(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
