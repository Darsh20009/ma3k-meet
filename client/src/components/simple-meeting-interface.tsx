import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ParticipantManagement from "./participant-management";
import ChatSidebar from "./chat-sidebar";
import MeetingCodeDisplay from "./meeting-code-display";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Meeting, VirtualParticipant } from "@shared/schema";

interface SimpleMeetingInterfaceProps {
  meeting: Meeting;
  onLeave: () => void;
}

export default function SimpleMeetingInterface({ meeting, onLeave }: SimpleMeetingInterfaceProps) {
  const { toast } = useToast();
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  
  // Basic meeting controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI states
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Session users tracking
  const [sessionUsers, setSessionUsers] = useState<{id: string, name: string, joinedAt: Date}[]>([]);
  
  // Get participants data
  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: ['/api/meetings', meeting.id, 'participants'],
  });

  // Get real users
  const { data: realUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/meetings', meeting.id, 'users'],
    refetchInterval: 3000,
  });

  // Get messages
  const { data: fetchedMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/meetings', meeting.id, 'messages'],
    refetchInterval: 2000,
  });

  useEffect(() => {
    setMessages(fetchedMessages);
  }, [fetchedMessages]);

  // WebSocket connection
  const { sendMessage } = useWebSocket({
    meetingId: meeting.id,
    onMessage: (message) => {
      setMessages(prev => [...prev, message]);
    },
    onUserJoined: (user) => {
      toast({
        title: "انضم مشارك جديد",
        description: `${user.name} انضم للاجتماع`,
      });
    },
    onUserLeft: (user) => {
      toast({
        title: "غادر مشارك",
        description: `${user.name} غادر الاجتماع`,
      });
    },
  });

  // Simple auto-messaging for virtual participants  
  useEffect(() => {
    if (participants.length > 0) {
      const interval = setInterval(() => {
        const activeParticipants = participants.filter(p => p.status === 'active');
        if (activeParticipants.length > 0 && Math.random() < 0.3) {
          const randomParticipant = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
          const messages = [
            'مرحباً بالجميع',
            'أتفق مع هذا الاقتراح',
            'هل يمكننا مناقشة هذه النقطة؟',
            'شكراً للإيضاح',
            'فكرة رائعة!'
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          sendMessage(randomMessage, randomParticipant.name, randomParticipant.avatar);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [participants]);

  // Simple controls
  const toggleMicrophone = () => {
    setIsMicOn(!isMicOn);
    toast({
      title: isMicOn ? "تم كتم الصوت" : "تم تشغيل الصوت",
      description: isMicOn ? "تم إيقاف الميكروفون" : "تم تشغيل الميكروفون",
    });
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast({
      title: isVideoOn ? "تم إيقاف الكاميرا" : "تم تشغيل الكاميرا",
      description: isVideoOn ? "تم إخفاء الفيديو" : "تم تشغيل الفيديو",
    });
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? "تم إيقاف المشاركة" : "تم بدء المشاركة",
      description: isScreenSharing ? "تم إيقاف مشاركة الشاشة" : "تم بدء مشاركة الشاشة",
    });
  };

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
    const shareUrl = `${window.location.origin}/join/${meeting.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الدعوة للاجتماع",
      });
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const userName = localStorage.getItem('userName') || 'مستخدم';

  return (
    <div ref={meetingContainerRef} className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{meeting.name}</h1>
            <p className="text-gray-400 text-sm">كود الاجتماع: {meeting.meetingCode}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowParticipants(!showParticipants)}
              variant="outline"
              size="sm"
            >
              المشاركون ({realUsers.length + participants.length})
            </Button>
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
            >
              الدردشة
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Your Video */}
            <div className="bg-gray-800 rounded-lg relative aspect-video">
              <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                {userName} (أنت)
              </div>
              <div className="absolute bottom-2 right-2 flex gap-1">
                {isMicOn ? (
                  <div className="bg-green-500 text-white p-1 rounded">
                    <i className="fas fa-microphone text-xs"></i>
                  </div>
                ) : (
                  <div className="bg-red-500 text-white p-1 rounded">
                    <i className="fas fa-microphone-slash text-xs"></i>
                  </div>
                )}
                {!isVideoOn && (
                  <div className="bg-gray-600 text-white p-1 rounded">
                    <i className="fas fa-video-slash text-xs"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Real Users */}
            {realUsers.map(user => (
              <div key={user.id} className="bg-gray-800 rounded-lg relative aspect-video">
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                  {user.name}
                </div>
              </div>
            ))}
            
            {/* Virtual Participants */}
            {participants.map(participant => (
              <div key={participant.id} className="bg-gray-700 rounded-lg relative aspect-video">
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                  participant.status === 'active' ? 'bg-green-400' :
                  participant.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                }`}></div>
                
                <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-sm">
                  {participant.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <MeetingCodeDisplay 
                meetingId={meeting.id}
                meetingName={meeting.name}
              />
            </div>
            <ParticipantManagement 
              meeting={meeting}
              realUsers={realUsers}
            />
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <ChatSidebar
              meetingId={meeting.id}
              messages={messages}
              onSendMessage={sendMessage}
              setMessages={setMessages}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-center items-center gap-4">
          {/* Primary Controls */}
          <Button
            onClick={toggleMicrophone}
            className={`w-12 h-12 rounded-full ${
              isMicOn 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </Button>

          <Button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full ${
              isVideoOn
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'}`}></i>
          </Button>

          <Button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full ${
              isScreenSharing
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-desktop"></i>
          </Button>

          <Button
            onClick={shareInviteLink}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-share"></i>
          </Button>

          <Button
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700"
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </Button>

          <Button
            onClick={onLeave}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
          >
            <i className="fas fa-phone-slash"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}