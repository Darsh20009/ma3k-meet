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
  const [showChat, setShowChat] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { isConnected, messages, realUsers, sendMessage, setMessages, setRealUsers } = useWebSocket(meeting.id);

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
  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        // Request camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          // For demo purposes, we'll just toggle the state
          // In a real app, you'd handle the stream
          setIsVideoOn(true);
          toast({
            title: "تم تشغيل الكاميرا",
            description: "الكاميرا متاحة الآن",
          });
          
          // Stop the stream since this is just a demo
          stream.getTracks().forEach(track => track.stop());
        } else {
          // Fallback for browsers that don't support getUserMedia
          setIsVideoOn(true);
          toast({
            title: "الكاميرا",
            description: "تم تشغيل الكاميرا (وضع التجريب)",
          });
        }
      } else {
        setIsVideoOn(false);
        toast({
          title: "تم إيقاف الكاميرا",
          description: "تم إيقاف الكاميرا",
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "خطأ في الكاميرا",
        description: "لم نتمكن من الوصول للكاميرا. تأكد من إعطاء الإذن.",
        variant: "destructive"
      });
    }
  };
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Request screen sharing
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          
          // For demo purposes, we'll just toggle the state
          // In a real app, you'd handle the stream
          setIsScreenSharing(true);
          
          // Listen for when user stops sharing
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            setIsScreenSharing(false);
          });
        } else {
          // Fallback for browsers that don't support getDisplayMedia
          setIsScreenSharing(true);
          toast({
            title: "مشاركة الشاشة",
            description: "تم تشغيل مشاركة الشاشة (وضع التجريب)",
          });
        }
      } else {
        setIsScreenSharing(false);
        toast({
          title: "تم إيقاف المشاركة",
          description: "تم إيقاف مشاركة الشاشة",
        });
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast({
        title: "خطأ في مشاركة الشاشة",
        description: "لم نتمكن من بدء مشاركة الشاشة. تأكد من إعطاء الإذن.",
        variant: "destructive"
      });
    }
  };
  const toggleParticipants = () => setShowParticipants(!showParticipants);
  const toggleChat = () => setShowChat(!showChat);
  const toggleControlsPanel = () => setShowControls(!showControls);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await meetingContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const shareInviteLink = async () => {
    const shareUrl = `${window.location.origin}/meeting/${meeting.id}`;
    
    console.log("Sharing meeting URL:", shareUrl);
    
    // Always try clipboard first for better compatibility
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم النسخ",
        description: `تم نسخ رابط الاجتماع: /meeting/${meeting.id}`,
      });
      return;
    } catch (err) {
      console.log("Clipboard failed, trying native share or showing dialog");
    }
    
    // Try native share API if clipboard fails (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `اجتماع: ${meeting.name}`,
          text: `انضم إلى الاجتماع: ${meeting.name}`,
          url: shareUrl,
        });
        toast({
          title: "تم المشاركة",
          description: "تم مشاركة رابط الاجتماع بنجاح",
        });
        return;
      } catch (err) {
        console.log("Native share failed, showing dialog");
      }
    }
    
    // Final fallback: show dialog
    setShowShareDialog(true);
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
      
      {/* Mobile Header - Always visible */}
      <header className="md:hidden bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex justify-between items-center relative z-50">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-video text-white text-sm"></i>
          </div>
          <span className="mr-2 text-white font-semibold text-sm">معك ميتيجس</span>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-2">
          <Button 
            onClick={toggleChat}
            className={`w-10 h-10 rounded-full ${showChat ? 'bg-primary' : 'bg-gray-700'} text-white control-button`}
          >
            <i className="fas fa-comments text-sm"></i>
          </Button>
          <Button 
            onClick={shareInviteLink}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white control-button"
          >
            <i className="fas fa-share text-sm"></i>
          </Button>
          <Button 
            onClick={toggleControlsPanel}
            className={`w-10 h-10 rounded-full ${showControls ? 'bg-primary' : 'bg-gray-700'} text-white control-button`}
          >
            <i className="fas fa-sliders-h text-sm"></i>
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-4 justify-between items-center relative z-10">
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

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ParticipantManagement 
            meeting={meeting} 
            showParticipants={showParticipants}
          />
        </div>
        
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
          
          {/* Video Grid Area - Responsive */}
          <div className="flex-1 p-2 sm:p-6 video-grid meeting-active">
            
            {/* Main Speaker (User) */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative glass-effect p-4 col-span-full h-40 sm:h-56 lg:h-64 mb-3 sm:mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {(() => {
                    const userName = localStorage.getItem('userName') || 'أنت';
                    const userAvatar = userName.slice(0, 2);
                    return (
                      <>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold mb-3 participant-avatar">
                          {userAvatar}
                        </div>
                        <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg">{userName} (أنت)</h3>
                        <p className="text-gray-300 text-xs sm:text-sm">
                          {isMicOn ? 'يتحدث الآن' : 'صامت'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex space-x-reverse space-x-2">
                <div className={`p-1.5 sm:p-2 rounded-full ${isMicOn ? 'bg-success text-white status-online' : 'bg-gray-600 text-white'}`}>
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xs sm:text-sm`}></i>
                </div>
                {isVideoOn && (
                  <div className="bg-success text-white p-1.5 sm:p-2 rounded-full status-online">
                    <i className="fas fa-video text-xs sm:text-sm"></i>
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3 bg-black/30 text-white px-2 py-1 rounded text-xs sm:text-sm backdrop-blur-sm">
                {localStorage.getItem('userName') || 'أنت'}
              </div>
              {isScreenSharing && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded text-xs sm:text-sm status-online">
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
          
          {/* Meeting Controls - Mobile Responsive */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 sm:px-6 py-4 sm:py-6 border-t border-gray-700">
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-center space-x-reverse space-x-6">
              
              {/* Primary Controls */}
              <div className="flex items-center space-x-reverse space-x-3 glass-effect rounded-full px-4 py-2">
                <div className="relative group">
                  <Button
                    onClick={toggleMicrophone}
                    className={`w-12 h-12 rounded-full control-button transition-all duration-300 transform hover:scale-110 ${
                      isMicOn 
                        ? 'bg-success hover:bg-success/90 text-white shadow-lg shadow-success/30 status-online' 
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 status-busy'
                    }`}
                  >
                    <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i>
                  </Button>

                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full control-button transition-all duration-300 transform hover:scale-110 ${
                      isVideoOn
                        ? 'bg-success hover:bg-success/90 text-white shadow-lg shadow-success/30 status-online'
                        : 'bg-gray-600 hover:bg-gray-500 text-white shadow-lg shadow-gray-600/30'
                    }`}
                  >
                    <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-lg`}></i>
                  </Button>

                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-full control-button transition-all duration-300 transform hover:scale-110 ${
                      isScreenSharing
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 status-online'
                        : 'bg-gray-600 hover:bg-gray-500 text-white shadow-lg shadow-gray-600/30'
                    }`}
                  >
                    <i className={`fas fa-desktop text-lg`}></i>
                  </Button>

                </div>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="relative group">
                  <Button
                    onClick={toggleParticipants}
                    className="w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <i className="fas fa-users text-sm"></i>
                  </Button>

                </div>

                <div className="relative group">
                  <Button
                    onClick={shareInviteLink}
                    className="w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg shadow-blue-600/20"
                  >
                    <i className="fas fa-share text-sm"></i>
                  </Button>

                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleFullscreen}
                    className="w-11 h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg shadow-purple-600/20"
                  >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                  </Button>

                </div>
              </div>

              {/* Leave Button */}
              <div className="relative group">
                <Button
                  onClick={onLeave}
                  className="w-12 h-12 bg-danger hover:bg-danger/90 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg shadow-red-500/30"
                >
                  <i className="fas fa-phone-slash text-lg"></i>
                </Button>

              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              {/* Primary Row - Most Important Controls */}
              <div className="flex items-center justify-center space-x-reverse space-x-4 mb-4">
                <Button
                  onClick={toggleMicrophone}
                  className={`w-16 h-16 rounded-full control-button transition-all duration-300 transform active:scale-95 ${
                    isMicOn 
                      ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl' 
                      : 'bg-red-500 hover:bg-red-600 text-white status-busy shadow-xl'
                  }`}
                >
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
                </Button>

                <Button
                  onClick={toggleVideo}
                  className={`w-16 h-16 rounded-full control-button transition-all duration-300 transform active:scale-95 ${
                    isVideoOn
                      ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl'
                      : 'bg-gray-600 hover:bg-gray-500 text-white shadow-xl'
                  }`}
                >
                  <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-xl`}></i>
                </Button>

                <Button
                  onClick={onLeave}
                  className="w-16 h-16 bg-danger hover:bg-danger/90 text-white rounded-full control-button transition-all duration-300 transform active:scale-95 status-busy shadow-xl"
                >
                  <i className="fas fa-phone-slash text-xl"></i>
                </Button>
              </div>

              {/* Secondary Row - Additional Controls */}
              <div className="flex items-center justify-center space-x-reverse space-x-2">
                <Button
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 rounded-full control-button transition-all duration-300 ${
                    isScreenSharing
                      ? 'bg-primary hover:bg-primary/90 text-white status-online'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  <i className="fas fa-desktop text-sm"></i>
                </Button>

                <Button
                  onClick={toggleParticipants}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full control-button transition-all duration-300"
                >
                  <i className="fas fa-users text-sm"></i>
                </Button>

                <Button
                  onClick={shareInviteLink}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
                >
                  <i className="fas fa-share text-sm"></i>
                </Button>

                <Button
                  onClick={toggleFullscreen}
                  className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                </Button>
              </div>

              {/* Mobile Status Indicators */}
              <div className="flex items-center justify-center mt-4 space-x-reverse space-x-3 text-xs">
                <div className={`flex items-center px-2 py-1 rounded-full glass-effect ${isMicOn ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ml-1 status-${isMicOn ? 'online' : 'busy'}`}></div>
                  <span>{isMicOn ? 'مفتوح' : 'مكتوم'}</span>
                </div>
                {isVideoOn && (
                  <div className="flex items-center px-2 py-1 rounded-full glass-effect text-green-400">
                    <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                    <span>فيديو</span>
                  </div>
                )}
                {isScreenSharing && (
                  <div className="flex items-center px-2 py-1 rounded-full glass-effect text-blue-400">
                    <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                    <span>مشاركة</span>
                  </div>
                )}
                <div className="flex items-center px-2 py-1 rounded-full glass-effect text-gray-300">
                  <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                  <span>{formatDuration(meetingDuration)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Status Bar */}
            <div className="hidden sm:flex items-center justify-center mt-4 space-x-reverse space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ml-2 ${isMicOn ? 'bg-success' : 'bg-red-500'}`}></div>
                <span>{isMicOn ? 'الميكروفون مفتوح' : 'الميكروفون مكتوم'}</span>
              </div>
              {isVideoOn && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full ml-2"></div>
                  <span>الفيديو مفتوح</span>
                </div>
              )}
              {isScreenSharing && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                  <span>مشاركة الشاشة نشطة</span>
                </div>
              )}
            </div>
          </div>
          
        </main>
        
        {/* Desktop Chat Sidebar */}
        <div className="hidden md:block">
          <ChatSidebar 
            meeting={meeting}
            messages={messages}
            onSendMessage={sendMessage}
            setMessages={setMessages}
          />
        </div>

        {/* Desktop Participants Sidebar */}
        {showParticipants && (
          <div className="hidden md:block">
            <ParticipantManagement 
              meeting={meeting}
              realUsers={realUsers}
            />
          </div>
        )}
        
        {/* Mobile Chat Overlay */}
        <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          showChat ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={toggleChat}>
          <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white transform transition-transform duration-300 ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">المحادثة</h3>
              <Button 
                onClick={toggleChat}
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="h-full">
              <ChatSidebar 
                meeting={meeting}
                messages={messages}
                onSendMessage={sendMessage}
                setMessages={setMessages}
              />
            </div>
          </div>
        </div>

        {/* Mobile Participants Overlay */}
        <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          showParticipants ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={toggleParticipants}>
          <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white transform transition-transform duration-300 ${
            showParticipants ? 'translate-x-0' : '-translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">المشاركون</h3>
              <Button 
                onClick={toggleParticipants}
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <ParticipantManagement 
                meeting={meeting}
                realUsers={realUsers}
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Controls Overlay */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 glass-effect">
            {/* Close button */}
            <div className="flex justify-center mb-4">
              <Button 
                onClick={toggleControlsPanel}
                className="w-10 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-full"
              >
                <i className="fas fa-chevron-down text-sm"></i>
              </Button>
            </div>
            
            {/* Primary Controls */}
            <div className="flex items-center justify-center space-x-reverse space-x-4 mb-4">
              <Button
                onClick={toggleMicrophone}
                className={`w-16 h-16 rounded-full control-button transition-all duration-300 ${
                  isMicOn 
                    ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl' 
                    : 'bg-red-500 hover:bg-red-600 text-white status-busy shadow-xl'
                }`}
              >
                <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
              </Button>

              <Button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full control-button transition-all duration-300 ${
                  isVideoOn
                    ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl'
                    : 'bg-gray-600 hover:bg-gray-500 text-white shadow-xl'
                }`}
              >
                <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-xl`}></i>
              </Button>

              <Button
                onClick={onLeave}
                className="w-16 h-16 bg-danger hover:bg-danger/90 text-white rounded-full control-button transition-all duration-300 status-busy shadow-xl"
              >
                <i className="fas fa-phone-slash text-xl"></i>
              </Button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center space-x-reverse space-x-3 mb-4">
              <Button
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full control-button transition-all duration-300 ${
                  isScreenSharing
                    ? 'bg-primary hover:bg-primary/90 text-white status-online'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                <i className="fas fa-desktop text-sm"></i>
              </Button>

              <Button
                onClick={shareInviteLink}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
              >
                <i className="fas fa-share text-sm"></i>
              </Button>

              <Button
                onClick={toggleFullscreen}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
              >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
              </Button>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center justify-center space-x-reverse space-x-3 text-xs">
              <div className={`flex items-center px-2 py-1 rounded-full glass-effect ${isMicOn ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ml-1 status-${isMicOn ? 'online' : 'busy'}`}></div>
                <span>{isMicOn ? 'مفتوح' : 'مكتوم'}</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded-full glass-effect text-gray-300">
                <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                <span>{formatDuration(meetingDuration)}</span>
              </div>
            </div>
          </div>
        </div>
        
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
