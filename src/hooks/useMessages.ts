
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

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

  return { messages, setMessages };
};
