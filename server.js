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

// --- TEMPLATE HTML COMPLET (DESIGN ÉLITE) ---
const generateFullHTMLReport = (name, score, data) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Stratégique Vox Mastery</title>
    <style>
        body { margin: 0; padding: 0; background-color: #020202; color: #d1d5db; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #020202; padding-bottom: 60px; }
        .main { background-color: #0a0a0a; width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #AF8936; border-top: 5px solid #AF8936; }
        .header { padding: 40px; text-align: center; border-bottom: 1px solid rgba(175, 137, 54, 0.2); }
        .content { padding: 40px; }
        .gold { color: #AF8936; }
        .white { color: #ffffff; }
        .score-box { background-color: #020202; border: 1px solid #AF8936; padding: 30px; text-align: center; margin: 30px 0; }
        .score-value { font-size: 72px; font-weight: bold; color: #AF8936; margin: 0; line-height: 1; }
        .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.1); padding-bottom: 5px; }
        .alert-box { background-color: #4A0404; border-left: 4px solid #AF8936; padding: 20px; margin: 30px 0; color: #ffffff; font-size: 14px; }
        .cta-button { display: inline-block; background-color: #AF8936; color: #020202; padding: 18px 35px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; margin-top: 30px; }
        .footer { padding: 30px; text-align: center; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; }
        li { margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <div class="header">
                <p style="margin: 0; font-size: 10px; letter-spacing: 5px; text-transform: uppercase; color: #AF8936;">Confidentiel • Dossier ${Math.floor(Math.random()*90000) + 10000}</p>
                <h1 style="margin: 20px 0 0 0; font-size: 32px; letter-spacing: -1px;" class="white">VOX MASTERY</h1>
                <p style="font-size: 12px; color: #6b7280;">Audit du ${date}</p>
            </div>

            <div class="content">
                <p class="white">Cher <strong>${name}</strong>,</p>
                <p>L'analyse fréquentielle de votre prise de parole a été soumise au protocole de l'Oracle Vox-G6. Ce rapport identifie les écarts entre votre signature vocale actuelle et les standards d'autorité de l'élite exécutive.</p>

                <div class="score-box">
                    <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Indice d'Autorité Vocale</p>
                    <h2 class="score-value">${score}%</h2>
                    <p style="margin: 10px 0 0 0; font-size: 13px;" class="gold">${score > 60 ? 'Potentiel de Leader Détecté' : 'Seuil Critique d\\'Autorité Non Atteint'}</p>
                </div>

                <div class="section-title">01. Constats & Analyse des faits</div>
                <p class="white">${data.facts}</p>

                <div class="section-title">02. Conséquences sur votre Leadership</div>
                <p class="white">${data.consequences}</p>

                <div class="alert-box">
                    <strong>RISQUE MAJEUR :</strong> ${data.risk}
                </div>

                <div class="section-title">03. Protocole de correction prioritaire</div>
                <ul style="margin-top: 20px;">
                    ${data.steps.map(step => `<li class="white">${step}</li>`).join('')}
                </ul>

                <div style="text-align: center; margin-top: 50px;">
                    <p class="white" style="font-size: 16px;"><strong>Ce diagnostic n'est que la surface.</strong></p>
                    <p style="font-size: 14px;">Pour franchir le plafond de verre de votre carrière, votre voix doit cesser d'être un bruit de fond pour devenir une arme de négociation.</p>
                    <a href="https://votre-site.com#application" class="cta-button">Accéder au Mentorat d'Élite</a>
                </div>
            </div>

            <div class="footer">
                Vox Mastery © 2026 — Systèmes de Rhétorique de Haut Niveau<br>
                Service de sélection confidentiel.
            </div>
        </div>
    </div>
</body>
</html>`;
};

app.post('/api/audit', upload.single('audio'), async (req, res) => {
    const userName = req.body.name || "Leader";
    
    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const textTranscribed = transResponse.data.text;

        const prompt = `
        Vous êtes le Mentor Senior de Vox Mastery, expert en ingénierie rhétorique et signatures vocales de haut niveau. 
        Votre référentiel n’est pas la moyenne, mais l’élite absolue des cercles de pouvoir (négociations stratégiques, cercles exécutifs).

        Analysez cette transcription comme un diagnostic clinique pour un décideur : "${textTranscribed}"

        CRITÈRES DE SCORE (STRICTS) :
        Le score mesure l’écart entre cette voix et les standards requis pour imposer naturellement le respect au plus haut niveau.
        - La majorité des profils doivent obtenir un score entre 25 et 55.
        - Un score supérieur à 60 est exceptionnel.
        - Restez sévère : l'excellence ne se distribue pas.

        TON ET POSTURE :
        - Ton calme, clinique, sans flatterie.
        - Soyez direct sur la faille détectée (plafond de verre, neutralité excessive ou manque de relief).
        - Créez une prise de conscience immédiate.
        
        Génère un objet JSON avec EXACTEMENT ces clés :
        1. "score": entre 25 et 65.
        2. "teaser": Une phrase mystérieuse pour le site web.
        3. "facts": Analyse des faits (ton, rythme, autorité).
        4. "consequences": Les impacts réeels (perte de contrats, manque de respect).
        5. "risk": Le plus grand danger professionnel.
        6. "steps": Une liste de 3 points techniques à améliorer.
        `;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const analysisData = JSON.parse(chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim());

        // --- GÉNÉRATION DU DOCUMENT HTML COMPLET ---
        const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);

        // --- ENVOI AU WEBHOOK MAKE ---
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysisData.score,
                teaser: analysisData.teaser,
                full_html_report: finalHTML // Le document complet
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        res.status(200).json({
            score: analysisData.score,
            diagnostic: `${analysisData.teaser} 🔒 Votre audit stratégique complet (Faits & Conséquences) a été généré et vous attend sur votre WhatsApp et votre Email.`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur technique." });
    }
});

app.listen(PORT, () => console.log(`Système Vox Mastery opérationnel sur le port ${PORT}`));
