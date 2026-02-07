const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY; 
const MAKE_CRM_WEBHOOK = process.env.MAKE_CRM_WEBHOOK;

const app = express();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } 
}); 

app.use(cors());
app.use(express.json());

// --- GÉNÉRATEUR RAPPORT HTML (Avec les sous-scores) ---
const generateFullHTMLReport = (name, score, data) => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const stepsHtml = data.steps.map(step => `<li style="margin-bottom: 8px; color: #ffffff;">${step}</li>`).join('');

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Audit Vox Mastery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #020202; font-family: Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #020202;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #0a0a0a; border: 1px solid #AF8936; border-top: 4px solid #AF8936;">
                    <tr>
                        <td align="center" style="padding: 25px 0 20px 0; border-bottom: 1px solid rgba(175, 137, 54, 0.2);">
                            <p style="margin: 0; font-size: 9px; letter-spacing: 4px; color: #AF8936; text-transform: uppercase;">Analyse Confidentielle</p>
                            <h1 style="margin: 10px 0 0 0; color: #ffffff; font-size: 26px; letter-spacing: 1px;">VOX MASTERY</h1>
                            <p style="margin: 5px 0 0 0; font-size: 11px; color: #6b7280;">Bilan du ${dateStr}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 25px 40px; color: #d1d5db; font-size: 15px; line-height: 22px;">
                            <p style="color: #ffffff; margin-top: 0;">Cher <strong>${name}</strong>,</p>
                            
                            <!-- Score Global -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #020202; border: 1px solid #AF8936;">
                                <tr>
                                    <td align="center" style="padding: 20px;">
                                        <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #d1d5db; letter-spacing: 2px;">Indice d'Autorité Vocale</p>
                                        <h2 style="font-size: 60px; font-weight: bold; color: #AF8936; margin: 5px 0;">${score}%</h2>
                                        <p style="margin: 0; font-size: 12px; color: #AF8936; font-weight: bold; text-transform: uppercase;">${score > 60 ? 'Potentiel Exécutif' : 'Niveau Insuffisant'}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Détails des Jauges dans l'Email -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td width="33%" align="center" style="color:#AF8936; font-size:10px;">AUTORITÉ<br><strong style="font-size:18px;">${data.authority}%</strong></td>
                                    <td width="33%" align="center" style="color:#AF8936; font-size:10px;">CLARTÉ<br><strong style="font-size:18px;">${data.clarity}%</strong></td>
                                    <td width="33%" align="center" style="color:#AF8936; font-size:10px;">SILENCE<br><strong style="font-size:18px;">${data.silence}%</strong></td>
                                </tr>
                            </table>

                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px;">01. Bilan & Preuves</h3>
                            <p style="color: #ffffff; margin: 0;">${data.facts}</p>

                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin-top: 25px;">02. Enjeux Stratégiques</h3>
                            <p style="color: #ffffff; margin: 0;">${data.consequences}</p>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #4A0404; border-left: 3px solid #AF8936; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 15px; color: #ffffff; font-size: 13px;">
                                        <strong>VIGILANCE :</strong> ${data.risk}
                                    </td>
                                </tr>
                            </table>

                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin-top: 25px;">03. Plan d'Action</h3>
                            <ul style="padding-left: 20px; color: #ffffff; margin: 10px 0;">
                                ${stepsHtml}
                            </ul>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 35px;">
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#AF8936" style="padding: 14px 28px;">
                                                    <a href="https://votre-site.com#application" style="color: #020202; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Accéder au Mentorat d'Élite</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0 30px 0; font-size: 9px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
                            Vox Mastery © 2026
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

// --- API AUDIT ---
app.post('/api/audit', upload.single('audio'), async (req, res) => {
    const userName = req.body.name || "Leader";
    const userWhatsapp = req.body.whatsapp ? req.body.whatsapp.replace(/\+/g, '') : '';
    
    if (!req.file) return res.status(400).json({ error: "Fichier audio manquant." });

    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        let textTranscribed = transResponse.data.text ? transResponse.data.text.trim() : "";
        
        // --- CAS D'ERREUR (AUDIO VIDE) ---
        if (textTranscribed.length < 50) {
            const failData = {
                score: 10,
                authority: 15,
                clarity: 20,
                silence: 5,
                diagnostic: "⚠️ Analyse impossible. L'enregistrement est trop court ou inaudible."
            };
            return res.status(200).json(failData);
        }

        // --- PROMPT AVEC SOUS-SCORES ---
        const prompt = `
const prompt = `
Vous êtes le Mentor Senior Vox Mastery, spécialiste de l’autorité vocale et de la prise de parole à haut niveau.
Depuis des années, vous accompagnez des dirigeants, cadres et profils à fort potentiel dont la voix constitue un levier stratégique encore sous-exploité.

Vous avez analysé et comparé des centaines de milliers de discours professionnels réels, et votre référentiel n’est jamais la moyenne.
Vous évaluez toujours une voix par rapport aux standards requis dans des environnements où l’autorité, la clarté et la maîtrise du rythme conditionnent l’influence réelle.

Analysez avec attention la transcription suivante :
"${textTranscribed}"

ADOPTEZ UNE POSTURE HUMAINE ET EXPERTE :
Vous vous adressez à un professionnel intelligent, compétent, mais perfectible.
Votre rôle n’est pas de juger, ni de flatter, mais de mettre en lumière ce que la voix révèle — et ce qu’elle limite encore.

RÈGLES DE SCORING (IMPORTANTES) :
- Les scores doivent rester globalement bas : ils mesurent un écart vers l’élite, pas un niveau scolaire.
- Un score global supérieur à 65 est rare et exceptionnel.
- Les sous-scores doivent être cohérents entre eux (autorité, clarté, silence).

INSTRUCTIONS D’ANALYSE :
1. Évaluez l’autorité vocale réelle : assurance, stabilité, capacité à imposer un cadre.
2. Analysez la clarté : structure, lisibilité, logique du propos.
3. Analysez la gestion du rythme et des silences : respiration, pauses, accélérations.
4. Identifiez une limite principale qui freine l’impact global, même si le niveau est correct.
5. Citez au moins une phrase exacte de la transcription pour appuyer votre analyse factuelle.

TON À ADOPTER :
- professionnel, posé, humain
- exigeant mais respectueux
- lucide, jamais brutal
- orienté prise de conscience et progression

FORMAT DE SORTIE STRICT (JSON uniquement, aucun texte hors JSON) :

{
  "score": nombre entre 25 et 65 représentant l’indice global d’autorité vocale selon les standards Vox Mastery,
  "authority": nombre entre 20 et 70,
  "clarity": nombre entre 20 et 70,
  "silence": nombre entre 15 et 65,
  "teaser": phrase courte et engageante destinée à éveiller la curiosité,
  "facts": analyse factuelle appuyée par au moins une citation exacte de la transcription,
  "consequences": conséquence concrète et réaliste sur l’impact professionnel ou décisionnel,
  "risk": risque principal à moyen terme si cette limite persiste,
  "steps": tableau de 3 recommandations formulées comme des axes de travail, sans entrer dans la technique.
}
`;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        let analysisData;
        try {
            const content = chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim();
            analysisData = JSON.parse(content);
        } catch (e) {
            analysisData = {
                score: 40, authority: 45, clarity: 50, silence: 25,
                teaser: "Structure instable détectée.",
                facts: "Discours manquant de colonne vertébrale.",
                consequences: "Perte d'attention immédiate.",
                risk: "Stagnation.",
                steps: ["Préparer", "Articuler", "Ralentir"]
            };
        }

        const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);

        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: userWhatsapp,
                score: analysisData.score,
                html_report: finalHTML
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        // --- ON RENVOIE TOUS LES SCORES AU FRONTEND ---
        res.status(200).json({
            score: analysisData.score,
            authority: analysisData.authority,
            clarity: analysisData.clarity,
            silence: analysisData.silence,
            diagnostic: `${analysisData.teaser} 🔒 Audit complet envoyé sur WhatsApp.`
        });

    } catch (error) {
        console.error("Erreur serveur :", error.message);
        res.status(500).json({ error: "Service momentanément indisponible." });
    }
});

app.listen(PORT, () => console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`));
