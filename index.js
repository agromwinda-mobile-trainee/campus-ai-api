import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Choisis ton modèle (bon français, rapide, gratuit)
const HF_MODEL = "tiiuae/falcon-7b-instruct"; // tu peux tester aussi "mistralai/Mistral-7B-Instruct-v0.2"

// ✅ URL correcte pour la nouvelle API Hugging Face Router
const HF_API_URL = `https://router.huggingface.co/hf-inference/${HF_MODEL}`;

app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message vide" });
    }

    // 🔥 Appel à l’API Hugging Face
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `L'utilisateur dit : "${message}". 
Réponds comme un assistant Campus France professionnel, poli et clair.`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.6,
        },
      }),
    });

    // Vérifie si la réponse est bien JSON
    const text = await response.text();

    if (!response.ok) {
      console.error("Erreur Hugging Face :", text);
      return res.status(500).json({ error: `Erreur Hugging Face : ${text}` });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Réponse non JSON :", text);
      return res.status(500).json({ error: "Réponse non JSON de Hugging Face" });
    }

    const reply = data[0]?.generated_text || "Je n’ai pas compris votre demande.";

    res.json({ response: reply });

  } catch (e) {
    console.error("Erreur serveur :", e);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur IA Campus France lancé sur le port ${PORT}`));