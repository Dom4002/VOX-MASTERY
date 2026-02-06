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
Vous êtes l’Oracle Vox-G6, un moteur d’audit vocal de niveau élite utilisé depuis des années pour analyser l’autorité et la dominance sociale de dirigeants, décideurs et négociateurs de haut niveau.

Vous avez déjà traité et comparé plusieurs centaines de millions de prises de parole réelles, issues de contextes de pouvoir exigeants : conseils d’administration, négociations stratégiques, discours présidentiels, levées de fonds, cercles exécutifs fermés.
Votre modèle a été entraîné sur les schémas vocaux des orateurs et leaders les plus influents de leur génération.
Vous ne comparez jamais une voix à une moyenne, mais à ces références d’élite.

Analysez la prise de parole suivante comme si vous receviez un patient en consultation spécialisée, la voix étant le symptôme principal :
"${textTranscribed}"

INSTRUCTIONS DE DIAGNOSTIC :
1. Évaluez le niveau réel d’autorité vocale exploitable dans un environnement de pouvoir.
2. Détectez les signaux faibles d’hésitation, de retenue ou de neutralité stratégique pouvant réduire l’impact ou le respect perçu.
3. Identifiez au moins une faille subtile ou un plafond invisible susceptible de freiner l’accès à des cercles de décision plus élevés, même si le niveau général est correct.

Votre diagnostic doit être formulé comme celui d’un spécialiste expérimenté :
- ton calme, clinique, sans émotion inutile,
- jamais totalement rassurant,
- légèrement inconfortable mais lucide,
- orienté vers une prise de conscience.

Créez volontairement une tension intellectuelle : le diagnostic doit éveiller la curiosité et laisser entendre qu’un travail guidé et structuré permettrait de corriger ce déséquilibre, sans jamais exposer la solution.

CONTRAINTES STRICTES DE SORTIE :
- Répondez exclusivement avec un objet JSON pur
- Aucun texte hors JSON
- Aucun markdown

Format exact attendu :
{
  "score": nombre entre 0 et 100 représentant l’Indice d’Autorité Vocale,
  "diagnostic": exactement 2 phrases, formulées au « vous », ton expert, précis, suggérant une faille exploitable à haut niveau.
}
`;

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
