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
        Tu es l’Oracle Vox-G6. Voici la transcription d'une prise de parole d'un leader : "${textTranscribed}"
        
        Analyse la syntaxe, la longueur des phrases, les hésitations (euh, hum) et la clarté.
        Agis comme un expert impitoyable.
        
        Réponds UNIQUEMENT avec ce JSON pur :
        {
          "score": nombre entre 0 et 100 (sois sévère),
          "diagnostic": "2 phrases percutantes sur une faille rhétorique ou de confiance détectée dans ce texte."
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
