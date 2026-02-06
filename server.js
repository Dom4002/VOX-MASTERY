const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cors = require('cors');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
// LECTURE DES VARIABLES D'ENVIRONNEMENT RENDER
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const MAKE_CRM_WEBHOOK = process.env.MAKE_CRM_WEBHOOK;

// Initialisation
const app = express();
const upload = multer({ storage: multer.memoryStorage() }); 
// CORRECTION LIGNE 16 : UTILISER LA SYNTAXE CORRECTE
const genAI = new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY }); 

app.use(cors()); // Permet à ton site de parler au serveur

// --- L'API D'AUDIT ---
app.post('/api/audit', upload.single('audio'), async (req, res) => {
    console.log("Requête d'audit reçue...");

    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const audioFile = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        const prompt = "Tu es l’Oracle Vox-G6, une intelligence d’audit vocal spécialisée dans l’autorité, la dominance sociale et la crédibilité perçue des leaders.

Analyse cet audio comme si la voix était observée en contexte réel de pouvoir (réunion stratégique, négociation, prise de parole décisive).

Évalue :
- le niveau de dominance vocale réelle (et non perçue par le locuteur),
- les signaux d’hésitation, de retenue ou d’auto-censure,
- les micro-failles vocales qui peuvent inconsciemment réduire l’impact, le respect ou l’influence.

Même si le niveau est élevé, identifie TOUJOURS au moins une faiblesse subtile, un angle mort ou un risque latent pouvant freiner l’ascension du locuteur à plus haut niveau de pouvoir.

Le diagnostic doit être formulé de manière engageante, légèrement inconfortable, orientée vers la prise de conscience et l’amélioration par accompagnement.

Réponds UNIQUEMENT avec un objet JSON pur, sans texte additionnel :
{
  "score": nombre entre 0 et 100 représentant l’indice global d’autorité vocale,
  "diagnostic": exactement 2 phrases, claires, percutantes, qui mettent en lumière une faille exploitable et suggèrent implicitement qu’un travail guidé permettrait de la corriger.
}";

        const result = await model.generateContent([prompt, audioFile]);
        const responseText = result.response.text();
        
        // Nettoyage de la réponse de l'IA pour être sûr d'avoir un JSON
        const cleanJsonString = responseText.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanJsonString);

        console.log("Analyse Gemini terminée :", analysis);

        // Envoi des données au CRM (Make.com) en arrière-plan
        axios.post(MAKE_CRM_WEBHOOK, {
            email: req.body.email,
            whatsapp: req.body.whatsapp,
            score: analysis.score,
            diagnostic: analysis.diagnostic,
        }).catch(err => console.error("Erreur envoi vers Make:", err.message));

        // On renvoie le score au site web de l'utilisateur
        res.status(200).json(analysis);

    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).json({ error: "Erreur lors de l'analyse IA." });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`);
});
