const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cors = require('cors');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = 'TA_CLE_API_GEMINI_ICI';
const MAKE_CRM_WEBHOOK = 'TON_LIEN_WEBHOOK_MAKE_POUR_LE_CRM';

// Initialisation
const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Stocke l'audio en mémoire
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

        const prompt = "Tu es l'Oracle Vox-G6. Analyse l'autorité vocale de cet audio. Évalue la dominance et les hésitations. Réponds UNIQUEMENT un objet JSON pur avec les clés 'score' (nombre) et 'diagnostic' (2 phrases).";

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
