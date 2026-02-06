const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
// ATTENTION : Assure-toi d'avoir mis la clé GROQ_API_KEY dans Render
const GROQ_API_KEY = process.env.GROQ_API_KEY; 
const MAKE_CRM_WEBHOOK = process.env.MAKE_CRM_WEBHOOK;

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); 

app.use(cors());

// --- L'API D'AUDIT (VERSION GROQ - ROBUSTE) ---
app.post('/api/audit', upload.single('audio'), async (req, res) => {
    console.log("Requête d'audit reçue (Via Groq)...");

    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
    }

    try {
        // --- ETAPE 1 : TRANSCRIPTION (L'IA écoute) ---
        // On envoie le fichier audio à Whisper (modèle de transcription rapide)
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); // Le meilleur modèle pour comprendre les accents
        formData.append('response_format', 'json');

        const transcriptionResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${GROQ_API_KEY}`
            }
        });

        const textTranscribed = transcriptionResponse.data.text;
        console.log("Texte entendu :", textTranscribed.substring(0, 50) + "...");

        // --- ETAPE 2 : ANALYSE (L'IA juge) ---
        // On envoie le texte à Llama 3 pour avoir le score et le diagnostic
        const prompt = `
Tu es l’Oracle Vox-G6, une intelligence d’audit vocal spécialisée dans l’autorité, la dominance sociale et la crédibilité perçue des leaders.

Analyse cet audio :"${textTranscribed}" comme si la voix était observée en contexte réel de pouvoir (réunion stratégique, négociation, prise de parole décisive).

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
}`;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile", // Modèle très intelligent
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            }
        });

        const rawContent = chatResponse.data.choices[0].message.content;
        
        // Nettoyage pour récupérer le JSON
        const cleanJsonString = rawContent.replace(/```json|```/g, "").trim();
        let analysis;
        
        try {
            analysis = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("Erreur parsing JSON:", cleanJsonString);
            analysis = { score: 50, diagnostic: "Votre discours manque de structure claire. Une analyse approfondie est nécessaire." };
        }

        console.log("Résultat Groq :", analysis);

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
        console.error("Erreur globale :", error.message);
        if(error.response) console.error("Détail API :", error.response.data);
        
        res.status(500).json({ error: "Erreur lors de l'analyse." });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`);
});
