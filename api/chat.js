import axios from "axios";
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// OpenAI client for embeddings
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Optional FAQ responses
const faqResponses = {
  "what services do you offer?": "We offer Telecom Infrastructure, Geospatial & GIS Solutions, Skill Development, and Consultancy & Business Incubation.",
  "what are your business hours?": "Our business hours are Monday - Sunday, from 9:00 AM to 8:00 PM.",
  "how do i contact support?": "You can contact our support team via email at info@digitalindian.co.in or by calling +917908735132.",
  "how can i book a meeting?": "You can book a meeting by using the 'Send Us a Message' option on our contact page.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, conversation } = req.body;
  if (!message) return res.status(400).json({ reply: "Message is required" });

  const userMessage = message.toLowerCase().trim();

  // Handle FAQs first
  if (faqResponses[userMessage]) {
    return res.status(200).json({ reply: faqResponses[userMessage] });
  }

  try {
    // 1️⃣ Generate embedding for user message
    const userEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message
    });
    const embeddingVector = userEmbedding.data[0].embedding;

    // 2️⃣ Search Supabase vector DB
    const { data: docs } = await supabase.rpc('match_documents', {
      query_embedding: embeddingVector,
      match_threshold: 0.75,
      match_count: 3
    });

    let contextText = docs?.length ? docs.map(d => d.content).join('\n') : '';

    // 3️⃣ Gemini AI call
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `You are an AI assistant for 'Digital Indian'. Use this context: "${contextText}". Conversation so far: "${JSON.stringify(conversation)}". User asks: "${message}". Answer concisely and format any code properly using triple backticks.` }
          ]
        }
      ]
    };

    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiReply) return res.status(200).json({ reply: aiReply });

    res.status(500).json({ reply: "Invalid AI response" });
  } catch (error) {
    console.error("Chatbot API error:", error.message);
    res.status(500).json({ reply: "Error processing request" });
  }
}
