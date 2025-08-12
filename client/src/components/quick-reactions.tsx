import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
}

interface QuickReactionsProps {
  onReaction?: (emoji: string) => void;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "✨"];

export default function QuickReactions({ onReaction }: QuickReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  const addReaction = (emoji: string) => {
    const reaction: Reaction = {
      id: Date.now().toString(),
      emoji,
      x: Math.random() * 80 + 10, // 10-90% من العرض
      y: Math.random() * 60 + 20, // 20-80% من الارتفاع
      timestamp: Date.now()
    };

    setReactions(prev => [...prev, reaction]);
    onReaction?.(emoji);

    // Remove reaction after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  return (
    <div className="relative">
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-30">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${reaction.x}%`,
              top: `${reaction.y}%`,
              animation: "float-up 3s ease-out forwards"
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Reactions Panel */}
      <div className="relative">
        <Button
          onClick={() => setShowPanel(!showPanel)}
          className="w-11 h-11 bg-yellow-500 hover:bg-yellow-400 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg shadow-yellow-500/20"
        >
          <i className="fas fa-laugh text-sm"></i>
        </Button>

        {showPanel && (
          <div className="absolute bottom-14 left-0 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-40">
            <div className="grid grid-cols-4 gap-2">
              {REACTION_EMOJIS.map((emoji, index) => (
                <Button
                  key={emoji}
                  onClick={() => {
                    addReaction(emoji);
                    setShowPanel(false);
                  }}
                  className="w-10 h-10 text-2xl bg-gray-50 hover:bg-gray-100 border-0 p-0"
                  variant="ghost"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}