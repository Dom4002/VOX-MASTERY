const express = require('express');
const multer = require('multer');
const axios = require('axios'); // On utilise axios directement
const cors = require('cors');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const MAKE_CRM_WEBHOOK = process.env.MAKE_CRM_WEBHOOK;

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); 

app.use(cors());

// --- L'API D'AUDIT (VERSION "DIRECT REST API") ---
app.post('/api/audit', upload.single('audio'), async (req, res) => {
    console.log("Requête d'audit reçue (Mode Direct)...");

    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
    }

    try {
        // 1. Préparation du fichier audio en Base64
        const audioBase64 = req.file.buffer.toString('base64');
        
        // 2. Le Prompt
        const promptText = `Tu es l’Oracle Vox-G6. Analyse cet audio (contexte : réunion stratégique, leadership).
        Évalue la dominance vocale, les hésitations et les micro-failles.
        Réponds UNIQUEMENT avec ce JSON (rien d'autre) :
        {
          "score": nombre 0-100,
          "diagnostic": "2 phrases percutantes sur une faille détectée."
        }`;

        // 3. Construction de la requête MANUELLE pour Gemini 1.5 Flash
        // On tape directement sur l'URL de Google, sans passer par leur librairie buggée
// NOUVELLE LIGNE (Solution 1)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { 
                        inlineData: { 
                            mimeType: req.file.mimetype, 
                            data: audioBase64 
                        } 
                    }
                ]
            }]
        };

        // 4. Envoi de la requête
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        // 5. Extraction du résultat
        const rawText = response.data.candidates[0].content.parts[0].text;
        
        // Nettoyage du JSON
        const cleanJsonString = rawText.replace(/```json|```/g, "").trim();
        let analysis;
        
        try {
            analysis = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("Erreur JSON:", cleanJsonString);
            analysis = { score: 55, diagnostic: "Analyse audio effectuée, mais formatage complexe. Une réécoute est conseillée." };
        }

        console.log("Résultat Gemini :", analysis);

        // Envoi CRM
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysis.score,
                diagnostic: analysis.diagnostic,
            }).catch(err => console.error("Erreur Make:", err.message));
        }

        res.status(200).json(analysis);

    } catch (error) {
        // Gestion détaillée des erreurs Google
        if (error.response) {
            console.error("Erreur Google API:", error.response.data);
            console.error("Détail:", JSON.stringify(error.response.data.error, null, 2));
            return res.status(500).json({ error: "Erreur IA : " + (error.response.data.error.message || "Refus de traitement") });
        } else {
            console.error("Erreur Serveur:", error.message);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`);
});
