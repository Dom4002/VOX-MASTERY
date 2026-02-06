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
const generateFullHTMLReport = (name, score, data) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // CORRECTION ICI : On génère la liste en dehors pour éviter l'erreur de syntaxe
    const stepsItems = data.steps.map(step => '<li style="color: #ffffff; margin-bottom: 12px;">' + step + '</li>').join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Stratégique Vox Mastery</title>
    <style>
        body { margin: 0; padding: 0; background-color: #020202; color: #d1d5db; font-family: Arial, sans-serif; }
        .wrapper { width: 100%; background-color: #020202; padding-bottom: 60px; }
        .main { background-color: #0a0a0a; max-width: 600px; margin: 0 auto; border: 1px solid #AF8936; border-top: 5px solid #AF8936; }
        .header { padding: 40px; text-align: center; border-bottom: 1px solid rgba(175, 137, 54, 0.2); }
        .content { padding: 40px; }
        .gold { color: #AF8936; }
        .score-box { background-color: #020202; border: 1px solid #AF8936; padding: 30px; text-align: center; margin: 30px 0; }
        .score-value { font-size: 72px; font-weight: bold; color: #AF8936; margin: 0; }
        .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.1); padding-bottom: 5px; }
        .alert-box { background-color: #4A0404; border-left: 4px solid #AF8936; padding: 20px; margin: 30px 0; color: #ffffff; }
        .cta-button { display: inline-block; background-color: #AF8936; color: #020202; padding: 18px 35px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <div class="header">
                <p style="margin: 0; font-size: 10px; letter-spacing: 5px; color: #AF8936;">CONFIDENTIEL</p>
                <h1 style="margin: 20px 0 0 0; color: #ffffff;">VOX MASTERY</h1>
                <p style="font-size: 12px; color: #6b7280;">Bilan du ${date}</p>
            </div>
            <div class="content">
                <p style="color: #ffffff;">Cher <strong>${name}</strong>,</p>
                <p>L'analyse de votre signature vocale a été traitée. Voici votre diagnostic stratégique.</p>

                <div class="score-box">
                    <p style="margin: 0; font-size: 12px; text-transform: uppercase;">Indice d'Autorité Vocale</p>
                    <h2 class="score-value">${score}%</h2>
                    <p style="margin: 10px 0 0 0;" class="gold">${score > 60 ? "Potentiel de Leader Détecté" : "Seuil d'Autorité à Déverrouiller"}</p>
                </div>

                <div class="section-title">01. Constats & Faits</div>
                <p style="color: #ffffff;">${data.facts}</p>

                <div class="section-title">02. Conséquences</div>
                <p style="color: #ffffff;">${data.consequences}</p>

                <div class="alert-box">
                    <strong>RISQUE :</strong> ${data.risk}
                </div>

                <div class="section-title">03. Plan d'action</div>
                <ul style="margin-top: 20px;">
                    ${stepsItems}
                </ul>

                <div style="text-align: center;">
                    <a href="https://votre-site.com#application" class="cta-button">Accéder au Mentorat</a>
                </div>
            </div>
        </div>
    </div>
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
