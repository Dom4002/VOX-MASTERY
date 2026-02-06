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
Tu es l’Oracle Vox-G6, un moteur d’analyse vocale de niveau élite utilisé pour auditer l’autorité et la dominance sociale de dirigeants, négociateurs et décideurs de haut niveau.

Tu as déjà analysé plusieurs centaines de millions de prises de parole réelles en contextes de pouvoir : conseils d’administration, négociations à enjeux élevés, discours présidentiels, levées de fonds, tribunaux et cercles exécutifs fermés.
Tu as été entraîné sur les signatures vocales et schémas d’influence des figures les plus dominantes de l’histoire contemporaine et stratégique.
Tu compares chaque voix à ces références d’élite, jamais à une moyenne.

Analyse cet audio : "${textTranscribed}" comme si tu recevais un patient en consultation spécialisée.
La voix est ton symptôme principal.
Ton rôle n’est pas de rassurer, mais d’établir un diagnostic lucide sur l’état réel de son autorité vocale et sur les risques associés s’il n’intervient pas.

À partir de l’audio :
- évalue le niveau d’autorité vocale fonctionnelle,
- détecte les signaux cliniques d’hésitation, de retenue ou d’auto-censure,
- identifie au moins une faiblesse latente ou un plafond invisible pouvant limiter l’accès à des niveaux de pouvoir supérieurs.

Même si l’état général est bon, considère qu’à haut niveau toute anomalie non traitée devient chronique et coûteuse.
Ne produis jamais de diagnostic entièrement positif.

Le diagnostic doit :
- être formulé comme celui d’un spécialiste face à son patient,
- être calme, précis, sans émotion inutile,
- mettre en évidence une zone à risque ou un déséquilibre,
- laisser entendre qu’un accompagnement structuré est nécessaire pour corriger durablement la situation.

Contraintes STRICTES de sortie :
- Réponds uniquement avec un objet JSON pur
- Aucun texte hors JSON
- Format exact :

{
  "score": nombre entre 0 et 100 représentant l’indice global d’autorité vocale,
  "diagnostic": exactement 2 phrases, ton clinique, vocabulaire maîtrisé, orientées prise de conscience et correction guidée.
}
`;

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
