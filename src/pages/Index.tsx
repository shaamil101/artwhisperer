
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useMessages";
import { getAIResponse, saveMessage } from "@/services/aiService";
import { ChatMessage } from "@/components/ChatMessage";
import { Message } from "@/types/message";

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { messages, setMessages } = useMessages();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      await saveMessage("user", userMessage);
      const aiMessage = await getAIResponse(userMessage);
      await saveMessage("assistant", aiMessage);

      const newAiMessage: Message = { role: "assistant", content: aiMessage };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Detailed error:", error);
      toast({
        title: "Error",
        description: `Failed to get response: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex-1 space-y-4 mb-4">
        <div className="text-center mb-8">
          <span className="px-4 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium mb-2 inline-block">
            Art Whisperer
          </span>
          <h1 className="text-4xl font-bold tracking-tight mt-2">
            Your Personal Art Guide
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any artwork..."
            className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-black hover:bg-neutral-800 transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Index;
