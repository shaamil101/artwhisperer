import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rnzucysbinhnwyozduel.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenVjeXNiaW5obnd5b3pkdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzQxNjIsImV4cCI6MjA1NTc1MDE2Mn0.qBfilqDAdpRInNm84elhp9Z-TvBDHhJejsD1CkRxtIw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getRecentMessages(userId: string) {
  try {
    console.log("Fetching recent messages for user:", userId);
    
    const { data, error } = await supabase
      .from('conversations')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(4);

    if (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }

    console.log("Fetched recent messages:", data);
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching recent messages:', error);
    return [];
  }
}

export const getAIResponse = async (userMessage: string) => {
  try {
    console.log("Fetching user session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session fetch error:", sessionError);
    } else if (!session?.user) {
      console.warn("No active user session found.");
    } else {
      console.log("User session found:", session.user.id);
    }

    let messageHistory = [];
    
    if (session?.user) {
      console.log("Fetching message history for user...");
      const recentMessages = await getRecentMessages(session.user.id);
      messageHistory = recentMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      console.log("Constructed message history:", messageHistory);
    }

    // Add current user message
    messageHistory.push({ role: "user", content: userMessage });
    console.log("Updated message history after adding user input:", messageHistory);

    const { data: insertData, error } = await supabase
  .from("user_messages")
  .insert({ messages: userMessage });

if (error) {
  console.error("Error inserting message into Supabase:", error);
} else {
  console.log("Inserted message data:", insertData);
}
    // Send request to API
    console.log("Sending request to AI API with message history...");
    const response = await fetch("https://chat.dartmouth.edu/api/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "bearer sk-d15355a8cc7b48cc9449a900c9834f00",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google_genai.gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "You are an art expert currently at the Metropolitan Museum of Art who helps people understand and appreciate artwork. Please provide informative and engaging responses about art at the MET. Be concise and imagine that you're already at the MET with the user so you don't need to mention it."
          },
          ...messageHistory
        ],
        stream: false
      }),
    });
    console.log("TEST LOG: Backend is running");


    console.log("API request sent. Awaiting response...");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid API response format:", data);
      throw new Error("Invalid response format from API");
    }

    const aiResponseContent = data.choices[0].message.content;
    console.log("AI Response Content:", aiResponseContent);

    if (session?.user) {
      console.log("Saving user message to Supabase...");
      await saveMessage("user", userMessage, session.user.id);

      console.log("Saving AI response to Supabase...");
      await saveMessage("assistant", aiResponseContent, session.user.id);
    }

    return aiResponseContent;
  } catch (error) {
    console.error("Error in getAIResponse:", error);
    throw error;
  }
};

export const saveMessage = async (role: "user" | "assistant", content: string, userId: string) => {
  try {
    console.log(`Saving message to Supabase - Role: ${role}, User ID: ${userId}, Content: ${content}`);
    
    const { error } = await supabase
      .from('conversations')
      .insert([{ role, content, user_id: userId }]);

    if (error) {
      console.error("Error saving message to Supabase:", error);
      throw error;
    }

    console.log("Message saved successfully.");
  } catch (error) {
    console.error("Error in saveMessage:", error);
    throw error;
  }
};
