
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const getAIResponse = async (userMessage: string) => {
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

  return data.choices[0].message.content;
};

export const saveMessage = async (role: "user" | "assistant", content: string) => {
  const { error } = await supabase
    .from('conversations')
    .insert([{ role, content }]);

  if (error) throw error;
};
