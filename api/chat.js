import axios from "axios";

// Combined FAQ data into a single string for the AI model's context.
const faqKnowledgeBase = `
  You are an AI assistant for the company 'Digital Indian'. Your goal is to be friendly, helpful, and concise.

  Here is some information about Digital Indian:
  - We offer services such as Telecom Infrastructure, Geospatial & GIS Solutions, Skill Development, and Consultancy & Business Incubation.
  - Our business hours are Monday - Sunday, from 9:00 AM to 8:00 PM.
  - You can contact our support team via email at info@digitalindian.co.in or by calling +91 7908735132.
  - To book a meeting, a user can use the 'View Calendar' option on our contact page.
  - The company's name is Digital Indian, and its mission is to transform New India through technology solutions.
  
  If a user asks a question about the company, prioritize using the information provided above. If the question is outside of this knowledge base, you may use your own general knowledge to answer it.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userMessage = req.body.message?.trim();
  if (!userMessage) {
    return res.status(400).json({ reply: "Please provide a message." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ reply: "API key not configured" });
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${faqKnowledgeBase}\n\nUser asked: "${userMessage}"` },
          ],
        },
      ],
    };

    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      res.status(500).json({ reply: "Invalid AI response" });
    }
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(500).json({ reply: "Error processing request" });
  }
}