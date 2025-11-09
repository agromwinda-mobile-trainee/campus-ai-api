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

    // 🧠 Étape 1 — Déterminer si l'IA peut répondre ou non
    const moderationPrompt = `
Tu es un assistant Campus France.
Analyse uniquement le contenu du message suivant : "${message}"

Si c’est une question générale (ex: procédure, visa, documents, frais, délais, rendez-vous),
réponds exactement par : IA_OK

Sinon, si c’est une question personnelle (ex: dossier individuel, compte bloqué, paiement, problème technique, retard...),
réponds exactement par : AGENT

Ne donne aucune autre réponse.
`;

    const modResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: moderationPrompt }],
        temperature: 0.1,
      }),
    });

    const modData = await modResponse.json();
    const decision = modData.choices?.[0]?.message?.content?.trim() || "IA_OK";

    // 🚧 Étape 2 — Si c’est un cas agent
    if (decision === "AGENT") {
      return res.json({
        response:
          "📩 Votre demande semble spécifique à votre dossier.\nElle a été transmise à un **agent Campus France** qui vous répondra sous peu.",
        redirect: true,
      });
    }

    // 🤖 Étape 3 — Réponse IA naturelle et professionnelle
    const aiPrompt = `
Tu es un assistant Campus France RDC bienveillant, professionnel et précis.
Réponds de manière claire, concise et polie.
Tu peux utiliser des emojis légers pour rendre la réponse agréable (mais pas exagérés) et essauye 
d'ecourter du mieux que tu peux tes reponses.

Question de l'utilisateur :
"${message}"

Réponds en français, dans un ton humain et informatif.
`;

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: aiPrompt }],
        temperature: 0.7,
      }),
    });

    const data = await aiResponse.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Je n’ai pas bien compris votre demande. Pouvez-vous reformuler ? 😊";

    res.json({ response: reply, redirect: false });

  } catch (e) {
    console.error("Erreur serveur :", e);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur Groq IA lancé sur le port ${PORT}`));