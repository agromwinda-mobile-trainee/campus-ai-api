import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message vide" });
    }

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b",
        messages: [
          { role: "system", content: "Tu es un assistant Campus France professionnel, poli et informatif." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await r.json();

    if (!r.ok || !data.choices || data.choices.length === 0) {
      console.error("Erreur Groq :", JSON.stringify(data));
      return res.status(500).json({ error: "Réponse invalide de l'IA", details: data });
    }

    const reply = data.choices[0].message?.content || "Je n’ai pas compris votre demande.";
    res.json({ response: reply });

  } catch (e) {
    console.error("Erreur serveur :", e);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));