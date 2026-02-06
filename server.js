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

// --- TEMPLATE HTML COMPLET ---
// Remplace ta fonction generateFullHTMLReport par celle-ci :

const generateFullHTMLReport = (name, score, data) => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const stepsHtml = data.steps.map(step => {
        return `<li style="margin-bottom: 12px; color: #ffffff;">${step}</li>`;
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
    <!-- Conteneur Principal pour forcer le fond noir -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #020202;">
        <tr>
            <td align="center" style="padding: 40px 0 40px 0;">
                
                <!-- Table de contenu (Bordure Or) -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #0a0a0a; border: 1px solid #AF8936; border-top: 5px solid #AF8936;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 0 30px 0; border-bottom: 1px solid rgba(175, 137, 54, 0.2);">
                            <p style="margin: 0; font-size: 10px; letter-spacing: 5px; color: #AF8936; text-transform: uppercase;">Analyse Confidentielle</p>
                            <h1 style="margin: 20px 0 0 0; color: #ffffff; font-size: 32px; letter-spacing: 2px;">VOX MASTERY</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Bilan du ${dateStr}</p>
                        </td>
                    </tr>

                    <!-- Corps du message -->
                    <tr>
                        <td style="padding: 40px; color: #d1d5db; font-size: 16px; line-height: 24px;">
                            <p style="color: #ffffff;">Cher <strong>${name}</strong>,</p>
                            <p>Votre analyse est terminée. Voici les failles et leviers de puissance détectés dans votre signature vocale.</p>

                            <!-- Score Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #020202; border: 1px solid #AF8936;">
                                <tr>
                                    <td align="center" style="padding: 30px;">
                                        <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #d1d5db; letter-spacing: 2px;">Indice d'Autorité Vocale</p>
                                        <h2 style="font-size: 72px; font-weight: bold; color: #AF8936; margin: 10px 0;">${score}%</h2>
                                        <p style="margin: 0; font-size: 14px; color: #AF8936; font-weight: bold;">${score > 60 ? 'POTENTIEL EXÉCUTIF DÉTECTÉ' : 'SEUIL D\'AUTORITÉ À DÉVERROUILLER'}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Section 01 -->
                            <h3 style="color: #AF8936; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin-top: 40px;">01. Bilan & Observations</h3>
                            <p style="color: #ffffff;">${data.facts}</p>

                            <!-- Section 02 -->
                            <h3 style="color: #AF8936; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin-top: 40px;">02. Enjeux Stratégiques</h3>
                            <p style="color: #ffffff;">${data.consequences}</p>

                            <!-- Alert Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #4A0404; border-left: 4px solid #AF8936; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px; color: #ffffff; font-size: 14px;">
                                        <strong>VIGILANCE :</strong> ${data.risk}
                                    </td>
                                </tr>
                            </table>

                            <!-- Section 03 -->
                            <h3 style="color: #AF8936; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; margin-top: 40px;">03. Plan d'Action</h3>
                            <ul style="padding-left: 20px; color: #ffffff;">
                                ${stepsHtml}
                            </ul>

                            <!-- Bouton CTA -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 50px;">
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#AF8936" style="padding: 15px 30px;">
                                                    <a href="https://votre-site.com#application" style="color: #020202; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 13px; letter-spacing: 1px;">Accéder au Mentorat d'Élite</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
                            Vox Mastery © 2026 — Systèmes de Rhétorique de Haut Niveau
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;
};

app.post('/api/audit', upload.single('audio'), async (req, res) => {
    const userName = req.body.name || "Leader";
    if (!req.file) return res.status(400).json({ error: "Audio manquant" });

    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const textTranscribed = transResponse.data.text;

        const prompt = `Vous êtes le Mentor Vox Mastery. Analyse cette voix : "${textTranscribed}"
        Réponds UNIQUEMENT en JSON avec :
        "score" (25-65), "teaser", "facts", "consequences", "risk", "steps" (liste de 3).`;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        // Nettoyage JSON
        let analysisData;
        try {
            const cleanJson = chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim();
            analysisData = JSON.parse(cleanJson);
        } catch (e) {
            throw new Error("Erreur de formatage IA");
        }

        const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);

        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysisData.score,
                teaser: analysisData.teaser,
                full_html_report: finalHTML
            }).catch(err => console.error("Erreur Webhook"));
        }

        res.status(200).json({
            score: analysisData.score,
            diagnostic: `${analysisData.teaser} 🔒 Votre audit complet vous attend sur WhatsApp.`
        });

    } catch (error) {
        console.error("Erreur:", error.message);
        res.status(500).json({ error: "Erreur technique" });
    }
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
