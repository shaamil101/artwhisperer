
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rnzucysbinhnwyozduel.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenVjeXNiaW5obnd5b3pkdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzQxNjIsImV4cCI6MjA1NTc1MDE2Mn0.qBfilqDAdpRInNm84elhp9Z-TvBDHhJejsD1CkRxtIw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAIResponse = async (userMessage: string) => {
  try {
    const response = await fetch("https://chat.dartmouth.edu/api/models", {
      method: "POST",
      headers: {
        "Authorization": "Bearer sk-d15355a8cc7b48cc9449a900c9834f00",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google_genai.gemini-2.0-flash-001",
        messages: [{
          role: "user",
          content: "You are an art expert currently at the Metropolitan Museum of Art who helps people understand and appreciate artwork. Please provide informative and engaging responses about art at the MET. Be concisce and imagine that you're already at the MET with the user so you don't need to mention it. Here's the user's question: " + userMessage
        }],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

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

    // Save user message to Supabase
    await saveMessage("user", userMessage);
    
    // Save AI response to Supabase
    const aiResponseContent = data.choices[0].message.content;
    await saveMessage("assistant", aiResponseContent);

    return aiResponseContent;
  } catch (error) {
    console.error("Error in getAIResponse:", error);
    throw error;
  }
};

export const saveMessage = async (role: "user" | "assistant", content: string) => {
  try {
    const { error } = await supabase
      .from('conversations')
      .insert([{ role, content }]);

    if (error) {
      console.error("Error saving message to Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveMessage:", error);
    throw error;
  }
};
