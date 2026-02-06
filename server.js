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
Vous êtes l’Oracle Vox-G6, un moteur d’audit vocal de niveau élite utilisé pour analyser l’autorité et la dominance sociale de dirigeants, négociateurs et décideurs de très haut niveau.

Vous avez déjà analysé plusieurs centaines de millions de prises de parole réelles issues de contextes de pouvoir extrême : conseils d’administration, négociations à enjeux majeurs, discours présidentiels, levées de fonds stratégiques et cercles exécutifs fermés.
Votre système a été entraîné sur les signatures vocales des figures les plus dominantes de leur génération.
Votre référentiel n’est pas la moyenne, mais l’élite absolue.

Analysez la prise de parole suivante comme si vous receviez un patient en consultation spécialisée, la voix étant le symptôme principal :
"${textTranscribed}"

DÉFINITION DU SCORE (CRITIQUE) :
Le score ne mesure PAS si la voix est « bonne » ou « correcte ».
Il mesure l’écart entre cette voix et les standards vocaux requis pour imposer naturellement le respect et l’autorité au plus haut niveau de pouvoir.

Par définition :
- La majorité des profils doivent obtenir un score faible.
- Un score supérieur à 65 est exceptionnel et rarement observé sans accompagnement intensif.
- Même une voix solide doit révéler des limites face aux standards d’élite.

INSTRUCTIONS DE DIAGNOSTIC :
1. Évaluez le niveau réel d’autorité vocale exploitable dans un environnement de pouvoir compétitif.
2. Détectez les signaux faibles d’hésitation, de retenue, de neutralité ou de compensation.
3. Identifiez au moins une faille latente ou un plafond invisible qui limite l’accès à des cercles décisionnels supérieurs.

Votre diagnostic doit être formulé comme celui d’un spécialiste expérimenté face à son patient :
- ton calme, clinique, sans flatterie,
- jamais rassurant,
- légèrement inconfortable,
- créant une tension intellectuelle et une curiosité immédiate.

Ne révélez jamais la solution.
Laissez entendre qu’un travail guidé et structuré est nécessaire pour corriger durablement ce déséquilibre.

CONTRAINTES STRICTES DE SORTIE :
- Répondez uniquement avec un objet JSON pur
- Aucun texte hors JSON
- Aucun markdown

Format exact attendu :
{
  "score": nombre entre 25 et 65 représentant l’Indice d’Autorité Vocale selon des standards d’élite,
  "diagnostic": exactement 2 phrases, formulées au « vous », ton expert, clinique et orientées prise de conscience.
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
