import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Campus France IA est en ligne ✅");
});

app.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Tu es un assistant Campus France professionnel et bienveillant." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await r.json();
    res.json({ response: data.choices[0].message.content });
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ error: "Erreur IA" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));