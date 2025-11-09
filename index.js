import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Modèle Hugging Face conseillé (bon équilibre français/rapidité)
const HF_MODEL = "tiiuae/falcon-7b-instruct"; // ou "bigscience/bloomz-560m"

// ⚠️ Nouvelle URL API Hugging Face (mise à jour 2025)
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message vide" });
    }

    // 🔥 Appel à Hugging Face Inference API (nouvelle version)
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `L'utilisateur dit : "${message}". 
Réponds comme un assistant Campus France poli, professionnel et clair.`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.6,
          top_p: 0.9,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      console.error("Erreur Hugging Face :", JSON.stringify(data));
      return res.status(500).json({ error: "Réponse invalide de l'IA" });
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