/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { AxiosError } from "axios";

type Data = { reply: string };

const faqResponses: Record<string, string> = {
  "what services do you offer?":
    "We offer Telecom Infrastructure, Geospatial & GIS Solutions, Skill Development, and Consultancy & Business Incubation.",
  "what are your business hours?":
    "Our business hours are Monday - Sunday, from 9:00 AM to 8:00 PM.",
  "how do i contact support?":
    "You can contact our support team via email at info@digitalindian.co.in or by calling +917908735132.",
  "how can i book a meeting?":
    "You can book a meeting by using the 'Send Us a Message' option on our contact page.",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  const userMessage = (req.body.message as string)?.toLowerCase().trim();
  if (!userMessage) return res.status(400).json({ reply: "No message provided" });

  // Date query
  if (userMessage.includes("date") || userMessage.includes("today")) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return res.status(200).json({ reply: `Hello! Today is ${formattedDate}.` });
  }

  // FAQ match
  if (faqResponses[userMessage]) return res.status(200).json({ reply: faqResponses[userMessage] });

  // Gemini API call
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ reply: "API key not configured" });

    const payload = {
      prompt: `You are a friendly AI assistant for the company 'Digital Indian'. Respond concisely and professionally. User asked: "${userMessage}"`,
      temperature: 0.2,
      candidate_count: 1,
      max_output_tokens: 500,
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateContent?key=${apiKey}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const aiReply: string | null = response.data?.candidates?.[0]?.content || null;
    if (aiReply) return res.status(200).json({ reply: aiReply });

    return res.status(500).json({ reply: "Invalid AI response" });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Gemini API error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return res.status(500).json({ reply: "Error processing request" });
  }
}
