
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js';

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversations from Supabase when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedMessages = data.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      }
    };

    loadMessages();
  }, []);

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
    
    // Add user message to UI immediately
    const newUserMessage = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Save user message to Supabase
      const { error: insertError } = await supabase
        .from('conversations')
        .insert([{ role: "user", content: userMessage }]);

      if (insertError) throw insertError;

      // Get AI response
      const response = await fetch("https://chat.dartmouth.edu/api/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer sk-d86202fc45e54cb598656e972542e21e",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai.gpt-4o-2024-08-06",
          messages: [{
            role: "user",
            content: "You are an art expert currently at the Metropolitan Museum of Art who helps people understand and appreciate artwork. Please provide informative and engaging responses about art at the MET. Be concisce and imagine that you're already at the MET with the user so you don't need to mention it. Here's the user's question: " + userMessage
          }],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from API");
      }

      const aiMessage = data.choices[0].message.content;
      
      // Save AI message to Supabase
      const { error: aiInsertError } = await supabase
        .from('conversations')
        .insert([{ role: "assistant", content: aiMessage }]);

      if (aiInsertError) throw aiInsertError;

      // Update UI with AI message
      setMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);
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
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-black text-white ml-auto"
                    : "bg-neutral-100"
                )}
              >
                <p className="text-sm sm:text-base">{message.content}</p>
              </div>
            </div>
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
