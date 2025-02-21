
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

// Initialize Supabase client with error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly set.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
