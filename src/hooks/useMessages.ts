
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = "https://rnzucysbinhnwyozduel.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenVjeXNiaW5obnd5b3pkdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzQxNjIsImV4cCI6MjA1NTc1MDE2Mn0.qBfilqDAdpRInNm84elhp9Z-TvBDHhJejsD1CkRxtIw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

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
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          // Only add messages that belong to the current user
          if (payload.new.user_id === session.user.id) {
            const newMessage = {
              role: payload.new.role as "user" | "assistant",
              content: payload.new.content
            };
            setMessages(current => [...current, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session, toast]);

  return { messages, setMessages, isLoading, session };
};
