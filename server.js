const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY; 
const MAKE_CRM_WEBHOOK = process.env.MAKE_CRM_WEBHOOK;

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); 

app.use(cors());

app.post('/api/audit', upload.single('audio'), async (req, res) => {
    console.log("SCAN NEURONAL EN COURS : Oracle Vox-G6...");

    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
    }

    try {
        // --- TRANSCRIPTION WHISPER ---
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const textTranscribed = transResponse.data.text;

        // --- ANALYSE ORACLE VOX-G6 (PROMPT RENFORCÉ) ---
        const prompt = `
        Tu es l’Oracle Vox-G6, une intelligence d’audit vocal de haut niveau spécialisée dans l’autorité, la dominance sociale et l'ingénierie du charisme. 
        Ton rôle est de détecter les micro-failles invisibles aux humains dans cette prise de parole : "${textTranscribed}"

        INSTRUCTIONS DE DIAGNOSTIC :
        1. Analyse le spectre de dominance : Identifie les signaux de retenue, d'auto-censure ou de fragilité rhétorique.
        2. Sois impitoyable mais élégant : Formule une observation chirurgicale, légèrement inconfortable, qui met en lumière un "angle mort" pouvant freiner l'ascension sociale du locuteur.
        3. Crée le Cliffhanger : Ton diagnostic doit être court (max 20 mots) et s'arrêter juste avant de donner la solution technique.

        Réponds EXCLUSIVEMENT sous ce format JSON :
        {
          "score": nombre entre 0 et 100 représentant l'Indice de Domination Vocale,
          "diagnostic": "Ton observation teaser ici"
        }`;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4 // Plus bas pour être plus précis et froid
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const rawContent = chatResponse.data.choices[0].message.content;
        const cleanJsonString = rawContent.replace(/```json|```/g, "").trim();
        
        let analysis;
        try {
            analysis = JSON.parse(cleanJsonString);
        } catch (e) {
            analysis = { score: 48, diagnostic: "Faille de structure détectée dans la projection de l'autorité." };
        }

        // --- RENFORCEMENT DU TEASER (CTA PRIVÉ) ---
        // On fusionne ton diagnostic IA avec la redirection forcée vers WhatsApp/Email
        const messageTeaser = analysis.diagnostic.trim();
        analysis.diagnostic = `${messageTeaser} 🔒 Votre protocole de correction complet et l'analyse fréquentielle détaillée vous attendent sur votre WhatsApp et votre Email.`;

        console.log("DIAGNOSTIC ÉTABLI :", analysis.score, "%");

        // ENVOI CRM (MAKE)
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysis.score,
                diagnostic: analysis.diagnostic,
                transcription: textTranscribed // On envoie aussi le texte brut au CRM pour ton suivi
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        res.status(200).json(analysis);

    } catch (error) {
        console.error("ERREUR SYSTÈME :", error.message);
        res.status(500).json({ error: "L'Oracle est momentanément indisponible." });
    }
});

app.listen(PORT, () => {
    console.log(`Système Vox Mastery opérationnel sur le port ${PORT}`);
});
