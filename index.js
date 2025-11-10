import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// 🔥 Initialisation Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 ROUTE IA / MESSAGERIE
app.post("/ask", async (req, res) => {
  try {
    const { message, userId, userName, role = "student" } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message vide" });
    }

    // 🧩 Sauvegarde du message de l'utilisateur
    const msgRef = db.collection("messages").doc(userId).collection("chat").doc();
    await msgRef.set({
      sender: role,
      message,
      timestamp: new Date(),
    });

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

    // 🚧 Étape 2 — Cas nécessitant un agent humain
    if (decision === "AGENT") {
      await msgRef.set(
        {
          response:
            "📩 Votre demande a été transmise à un **agent Campus France** qui vous répondra sous peu.",
          ai: false,
        },
        { merge: true }
      );

      return res.json({
        response:
          "📩 Votre demande semble spécifique à votre dossier.\nElle a été transmise à un **agent Campus France**.",
        redirect: true,
      });
    }

    // 🤖 Étape 3 — Réponse automatique IA
    const aiPrompt = `
Tu es un assistant Campus France RDC bienveillant, professionnel et précis.
Réponds de manière claire, concise et polie.
Tu peux utiliser quelques emojis légers pour rendre la réponse agréable.

Question de l'utilisateur :
"${message}"

Réponds en français.
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

    // 💾 Sauvegarde de la réponse IA
    await msgRef.set(
      {
        response: reply,
        ai: true,
      },
      { merge: true }
    );

    res.json({ response: reply, redirect: false });
  } catch (e) {
    console.error("Erreur serveur :", e);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

// 📋 ROUTE ADMIN : liste des conversations actives
app.get("/conversations", async (req, res) => {
  try {
    const snapshot = await db.collection("messages").get();
    const users = snapshot.docs.map((doc) => ({
      userId: doc.id,
    }));
    res.json(users);
  } catch (e) {
    console.error("Erreur /conversations :", e);
    res.status(500).json({ error: "Erreur lors de la récupération des conversations" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur Groq IA lancé sur le port ${PORT}`));