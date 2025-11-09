import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Choisis ici le modèle Hugging Face
// Pour un bon équilibre entre rapidité et qualité :
const HF_MODEL = "tiiuae/falcon-7b-instruct"; // ou "bigscience/bloomz-560m"

app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message vide" });
    }

    // 🔥 Appel à Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `L'utilisateur demande : "${message}". 
Tu es un assistant Campus France professionnel et poli, aide l'étudiant de manière claire et concise.`,
          parameters: { max_new_tokens: 150, temperature: 0.6 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data || !Array.isArray(data)) {
      console.error("Erreur Hugging Face :", JSON.stringify(data));
      return res.status(500).json({ error: "Réponse invalide de l'IA" });
    }

    // 🧩 Récupération du texte généré
    const reply = data[0]?.generated_text || "Je n’ai pas compris votre demande.";

    res.json({ response: reply });

  } catch (e) {
    console.error("Erreur serveur :", e);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur IA lancé sur le port ${PORT}`));