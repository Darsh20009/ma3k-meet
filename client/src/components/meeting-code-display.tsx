import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MeetingCodeDisplayProps {
  meetingId: string;
  meetingName: string;
}

export default function MeetingCodeDisplay({ meetingId, meetingName }: MeetingCodeDisplayProps) {
  const [showCode, setShowCode] = useState(false);
  const { toast } = useToast();

  // Generate a simple 6-digit code from meeting ID
  const generateMeetingCode = (id: string) => {
    const hash = id.split('-')[0];
    const numbers = hash.match(/\d/g) || [];
    let code = numbers.join('').slice(0, 6);
    
    // Ensure we have 6 digits by padding or using hash chars
    if (code.length < 6) {
      const chars = hash.replace(/[^a-f0-9]/g, '');
      for (let i = 0; i < chars.length && code.length < 6; i++) {
        const char = chars[i];
        if (/[0-9]/.test(char)) {
          code += char;
        } else {
          // Convert hex chars to numbers
          code += (parseInt(char, 16) % 10).toString();
        }
      }
    }
    
    return code.slice(0, 6);
  };

  const meetingCode = generateMeetingCode(meetingId);

  const copyCode = () => {
    navigator.clipboard.writeText(meetingCode).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ رمز الاجتماع بنجاح",
      });
    });
  };

  const copyInviteText = () => {
    const inviteText = `🎪 دعوة لحضور اجتماع

📋 اسم الاجتماع: ${meetingName}
🔢 رمز الانضمام: ${meetingCode}
🌐 الرابط المباشر: ${window.location.origin}/meeting/${meetingId}

💡 يمكنك الانضمام بطريقتين:
1️⃣ ادخل الرمز ${meetingCode} على الموقع
2️⃣ أو اضغط على الرابط مباشرة

🚀 معك ميتيجس - تجربة اجتماعات أفضل من زوم`;

    navigator.clipboard.writeText(inviteText).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ نص الدعوة كاملاً",
      });
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">معلومات الانضمام</h3>
        <Button
          onClick={() => setShowCode(!showCode)}
          variant="ghost"
          size="sm"
          className="text-blue-600 h-6"
        >
          <i className={`fas ${showCode ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
        </Button>
      </div>

      {showCode && (
        <div className="space-y-3">
          {/* Meeting Code */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500">رمز الاجتماع:</span>
                <div className="font-mono text-xl font-bold text-blue-600 tracking-wider">
                  {meetingCode}
                </div>
              </div>
              <Button
                onClick={copyCode}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <i className="fas fa-copy ml-1"></i>
                نسخ
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-reverse space-x-2">
            <Button
              onClick={copyInviteText}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs"
            >
              <i className="fas fa-share ml-1"></i>
              نسخ دعوة كاملة
            </Button>
            <Button
              onClick={() => {
                const url = `${window.location.origin}/meeting/${meetingId}`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "تم النسخ",
                  description: "تم نسخ رابط الاجتماع",
                });
              }}
              variant="outline"
              className="flex-1 text-xs"
            >
              <i className="fas fa-link ml-1"></i>
              نسخ رابط
            </Button>
          </div>

          <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
            <i className="fas fa-info-circle ml-1 text-blue-500"></i>
            يمكن للمدعوين الانضمام بإدخال الرمز أو استخدام الرابط المباشر
          </div>
        </div>
      )}
    </div>
  );
}