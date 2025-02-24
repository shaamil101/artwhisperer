
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useMessages";
import { getAIResponse } from "@/services/aiService";
import { ChatMessage } from "@/components/ChatMessage";
import { Message } from "@/types/message";
import { createClient } from '@supabase/supabase-js';
import { AuthDialog } from "@/components/AuthDialog";
import { Send, Menu, X } from "lucide-react"; 

const supabaseUrl = "https://rnzucysbinhnwyozduel.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenVjeXNiaW5obnd5b3pkdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzQxNjIsImV4cCI6MjA1NTc1MDE2Mn0.qBfilqDAdpRInNm84elhp9Z-TvBDHhJejsD1CkRxtIw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAX_ANONYMOUS_MESSAGES = 3;

const INTRO_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! This is Museo - your personal museum guide. I'm not affiliated with the Metropolitan Museum of Art but I'm familiar with all the art here and I'm happy to answer any questions! Please ask me any questions you might have :)\n\nPlease note: I'm just an AI so I might not be 100% accurate"
};

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [anonymousMessageCount, setAnonymousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { messages, setMessages, session } = useMessages();
  const [isMenuOpen, setIsMenuOpen] = useState(false); 


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([INTRO_MESSAGE]);
    }
  }, [setMessages, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!session?.user && anonymousMessageCount >= MAX_ANONYMOUS_MESSAGES) {
      setIsAuthDialogOpen(true);
      toast({
        title: "Sign up/Sign in to keep chatting with Museo",
        description: "Create an account to continue the conversation and save your chat history.",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    if (!session?.user) {
      setAnonymousMessageCount(prev => prev + 1);
      
      if (anonymousMessageCount === 1) {
        toast({
          title: "One more message left",
          description: "Sign up to keep chatting with Museo and save your conversation history!",
        });
      }
    }

    try {
      const aiMessage = await getAIResponse(userMessage);
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAnonymousMessageCount(0);
      toast({
        title: "Success",
        description: "Successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const AuthButton = () => (
    session?.user ? (
      <Button 
        onClick={handleSignOut}
        variant="outline"
        className="ml-2"
      >
        Sign Out
      </Button>
    ) : (
      <Button 
        onClick={() => setIsAuthDialogOpen(true)}
        variant="default"
      >
        Sign In
      </Button>
    )
  );

  return (
    <div className="flex flex-col min-h-screen max-w-4xl mx-auto p-4 sm:p-6">
      <div className="relative mb-8">
        <div className="hidden sm:block absolute right-0 top-0">
          <AuthButton />
        </div>
        <div className="text-center sm:pr-24">
          <span className="px-4 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium mb-2 inline-block">
            Museo
          </span>
          <h1 className="text-4xl font-bold tracking-tight mt-2">
            Your Personal Museum Guide
          </h1>
        </div>

       <div className="absolute right-4 sm:right-6">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-black hover:bg-neutral-200 rounded-full transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4">
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

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Side Menu Panel */}
          <div
            className="absolute top-0 right-0 w-64 h-full bg-white shadow-lg p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Close Button */}
            <button
              className="self-end mb-4 p-2 hover:bg-neutral-200 rounded-full"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Sign In / Sign Out Logic */}
            {session?.user ? (
              <Button onClick={handleSignOut} variant="outline" className="mb-4">
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => setIsAuthDialogOpen(true)}
                variant="default"
                className="mb-4"
              >
                Sign In
              </Button>
            )}

            {/* Contact Link */}
            <a
              href="mailto:audioguidemet@gmail.com"
              className="text-neutral-700 hover:text-neutral-900 transition-colors mb-2"
            >
              Contact
            </a>
          </div>
        </div>
      )}

      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
      />
    </div>
  );
};

export default Index;
