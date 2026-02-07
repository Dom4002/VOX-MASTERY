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

// Configuration Multer : Limite augmentée à 25MB pour supporter 2 minutes d'audio
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } 
}); 

app.use(cors());
app.use(express.json());

// --- GÉNÉRATEUR DE RAPPORT HTML (DESIGN ELITE COMPACT) ---
const generateFullHTMLReport = (name, score, data) => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Génération propre de la liste HTML
    const stepsHtml = data.steps.map(step => {
        return `<li style="margin-bottom: 8px; color: #ffffff;">${step}</li>`;
    }).join('');

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
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 25px 0 20px 0; border-bottom: 1px solid rgba(175, 137, 54, 0.2);">
                            <p style="margin: 0; font-size: 9px; letter-spacing: 4px; color: #AF8936; text-transform: uppercase;">Analyse Confidentielle</p>
                            <h1 style="margin: 10px 0 0 0; color: #ffffff; font-size: 26px; letter-spacing: 1px;">VOX MASTERY</h1>
                            <p style="margin: 5px 0 0 0; font-size: 11px; color: #6b7280;">Bilan du ${dateStr}</p>
                        </td>
                    </tr>

                    <!-- Corps -->
                    <tr>
                        <td style="padding: 25px 40px; color: #d1d5db; font-size: 15px; line-height: 22px;">
                            <p style="color: #ffffff; margin-top: 0;">Cher <strong>${name}</strong>,</p>
                            <p style="margin-bottom: 0;">L'analyse de votre prise de parole (2 min) est terminée. Voici les leviers de puissance détectés dans votre signature vocale.</p>

                            <!-- Score -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #020202; border: 1px solid #AF8936;">
                                <tr>
                                    <td align="center" style="padding: 20px;">
                                        <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #d1d5db; letter-spacing: 2px;">Indice d'Autorité Vocale</p>
                                        <h2 style="font-size: 60px; font-weight: bold; color: #AF8936; margin: 5px 0;">${score}%</h2>
                                        <p style="margin: 0; font-size: 12px; color: #AF8936; font-weight: bold; text-transform: uppercase;">${score > 60 ? 'Potentiel Exécutif' : 'Seuil d\'Autorité à Déverrouiller'}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Section 01 -->
                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin: 25px 0 10px 0;">01. Bilan & Observations</h3>
                            <p style="color: #ffffff; margin: 0;">${data.facts}</p>

                            <!-- Section 02 -->
                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin: 25px 0 10px 0;">02. Enjeux Stratégiques</h3>
                            <p style="color: #ffffff; margin: 0;">${data.consequences}</p>

                            <!-- Alert Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #4A0404; border-left: 3px solid #AF8936; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 15px; color: #ffffff; font-size: 13px;">
                                        <strong>VIGILANCE :</strong> ${data.risk}
                                    </td>
                                </tr>
                            </table>

                            <!-- Section 03 -->
                            <h3 style="color: #AF8936; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin: 25px 0 10px 0;">03. Plan d'Action</h3>
                            <ul style="padding-left: 20px; color: #ffffff; margin: 10px 0;">
                                ${stepsHtml}
                            </ul>

                            <!-- CTA -->
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
                            Vox Mastery © 2026 — Systèmes de Rhétorique
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
    // Nettoyage WhatsApp (enlève le +)
    const userWhatsapp = req.body.whatsapp ? req.body.whatsapp.replace(/\+/g, '') : '';
    
    if (!req.file) return res.status(400).json({ error: "Fichier audio manquant." });

    try {
        // --- 1. TRANSCRIPTION (Whisper Large) ---
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const textTranscribed = transResponse.data.text.trim();

        // --- ANTI-HALLUCINATION : Si l'enregistrement est vide ou bruit de fond ---
        if (textTranscribed.length < 20) {
            return res.status(200).json({
                score: 10,
                diagnostic: "⚠️ Analyse impossible. L'enregistrement est silencieux ou trop court. Veuillez parler distinctement pendant au moins 15 secondes."
            });
        }

        // --- 2. ANALYSE ORACLE (Prompt Anti-Hallucination) ---
        const prompt = `
        Tu es le Mentor Senior Vox Mastery. Analyse cette transcription d'un dirigeant (Contexte : Prise de parole stratégique) : "${textTranscribed}"

        RÈGLES STRICTES ANTI-HALLUCINATION :
        1. Ne jamais inventer de détails. Base-toi uniquement sur le texte fourni.
        2. Cite OBLIGATOIREMENT une expression ou un mot exact utilisé par le locuteur pour prouver l'écoute.
        3. Si le discours est vide de sens, dis-le.

        Génère un JSON strict avec ces clés :
        - "score": note sur 100 (Sévère. >60 est rare).
        - "teaser": Phrase courte (max 15 mots) pour le site web, piquant la curiosité.
        - "facts": Analyse factuelle. Cite le texte : "Vous avez dit '[Citation]', cela montre..."
        - "consequences": Impact concret (perte de confiance, ennui de l'auditoire).
        - "risk": Le danger pour sa carrière à haut niveau.
        - "steps": 3 actions correctives précises.
        `;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3 // Température basse = Analyse froide et factuelle
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        // Nettoyage et Parsing JSON sécurisé
        let analysisData;
        try {
            const content = chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim();
            analysisData = JSON.parse(content);
        } catch (e) {
            // Fallback si l'IA échoue le formatage
            analysisData = {
                score: 45,
                teaser: "Votre discours manque de structure percutante pour convaincre.",
                facts: "Le débit est instable et certains mots sont avalés.",
                consequences: "Votre auditoire risque de décrocher rapidement.",
                risk: "Plafonnement de carrière dû à un manque de charisme perçu.",
                steps: ["Articuler davantage", "Ralentir le rythme", "Utiliser des silences"]
            };
        }

        // --- GÉNÉRATION DU RAPPORT HTML ---
        const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);

        // --- ENVOI VERS MAKE.COM (CRM) ---
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: userWhatsapp,
                score: analysisData.score,
                teaser: analysisData.teaser,
                full_html_report: finalHTML 
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        // --- RÉPONSE AU SITE WEB ---
        res.status(200).json({
            score: analysisData.score,
            diagnostic: `${analysisData.teaser} 🔒 Votre audit stratégique complet a été généré et vous attend sur WhatsApp.`
        });

    } catch (error) {
        console.error("Erreur serveur :", error.message);
        res.status(500).json({ error: "Service momentanément indisponible." });
    }
});

app.listen(PORT, () => console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`));
