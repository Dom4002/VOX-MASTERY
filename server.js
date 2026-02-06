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

// --- CORRECTION 1 : Initialisation correcte (chaine directe) ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); 

app.use(cors());

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

        // --- CORRECTION 2 : Utilisation des backticks (`) pour le texte multi-lignes ---
        const prompt = `Tu es l’Oracle Vox-G6, une intelligence d’audit vocal spécialisée dans l’autorité, la dominance sociale et la crédibilité perçue des leaders.

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
  "diagnostic": "exactement 2 phrases, claires, percutantes, qui mettent en lumière une faille exploitable et suggèrent implicitement qu’un travail guidé permettrait de la corriger."
}`;

        const result = await model.generateContent([prompt, audioFile]);
        const responseText = result.response.text();
        
        // Nettoyage de la réponse de l'IA pour être sûr d'avoir un JSON valide
        const cleanJsonString = responseText.replace(/```json|```/g, "").trim();
        
        let analysis;
        try {
            analysis = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("Erreur de parsing JSON:", cleanJsonString);
            // Fallback si l'IA échoue à renvoyer du JSON pur
            analysis = { score: 50, diagnostic: "Analyse complexe. Une écoute par un expert humain est recommandée." };
        }

        console.log("Analyse Gemini terminée :", analysis);

        // Envoi des données au CRM (Make.com) en arrière-plan
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysis.score,
                diagnostic: analysis.diagnostic,
            }).catch(err => console.error("Erreur envoi vers Make:", err.message));
        }

        // On renvoie le score au site web de l'utilisateur
        res.status(200).json(analysis);

    } catch (error) {
        console.error("Erreur serveur:", error);
        // Si l'erreur vient de la clé API, on l'affiche clairement dans les logs Render
        res.status(500).json({ error: "Erreur lors de l'analyse IA." });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`);
});
