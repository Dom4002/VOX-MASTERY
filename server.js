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

// --- FONCTION DE GÉNÉRATION DU RAPPORT HTML ---
const generateHTMLReport = (name, score, data) => {
    return `
    <div style="background-color: #020202; color: #d1d5db; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #AF8936;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: #AF8936; text-transform: uppercase; letter-spacing: 4px; font-size: 14px; margin-bottom: 10px;">Audit Confidentiel</h2>
            <h1 style="color: #ffffff; font-size: 28px; margin-top: 0;">VOX MASTERY</h1>
            <div style="height: 1px; background: linear-gradient(to right, transparent, #AF8936, transparent); width: 100%; margin: 20px 0;"></div>
        </div>

        <p style="font-size: 16px;">Cher <strong>${name}</strong>,</p>
        <p style="font-style: italic; color: #9ca3af;">L'analyse de votre signature vocale par l'Oracle Vox-G6 est terminée. Voici votre diagnostic stratégique.</p>

        <div style="background-color: #0A0A0A; border: 1px solid rgba(175, 137, 54, 0.3); padding: 30px; text-align: center; margin: 30px 0;">
            <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Indice d'Autorité Vocale</span>
            <div style="color: #AF8936; font-size: 64px; font-weight: bold; margin: 10px 0;">${score}%</div>
            <p style="color: #ffffff; font-size: 14px; margin: 0;">Statut : ${score > 60 ? 'Potentiel Exécutif Élevé' : 'Axe de Domination à Corriger'}</p>
        </div>

        <h3 style="color: #AF8936; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 10px; font-size: 18px;">1. Constats & Faits</h3>
        <p style="color: #ffffff;">${data.facts}</p>

        <h3 style="color: #AF8936; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 10px; font-size: 18px;">2. Conséquences Réelles</h3>
        <p style="color: #ffffff;">${data.consequences}</p>

        <div style="background-color: #4A0404; color: #ffffff; padding: 20px; margin: 30px 0; font-size: 14px; border-left: 4px solid #AF8936;">
            <strong>Risque Détecté :</strong> ${data.risk}
        </div>

        <h3 style="color: #AF8936; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 10px; font-size: 18px;">3. Plan de Correction Prioritaire</h3>
        <ul style="color: #ffffff; padding-left: 20px;">
            ${data.steps.map(step => `<li style="margin-bottom: 10px;">${step}</li>`).join('')}
        </ul>

        <div style="text-align: center; margin-top: 50px; padding: 30px; border-top: 1px solid rgba(175, 137, 54, 0.2);">
            <p style="font-size: 16px; color: #ffffff; margin-bottom: 25px;"><strong>Ce diagnostic n'est qu'un aperçu.</strong> Votre véritable transformation commence par une maîtrise totale des fréquences de pouvoir.</p>
            <a href="https://votre-site.com#application" style="background-color: #AF8936; color: #020202; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Postuler pour la Cohorte 2026</a>
        </div>

        <footer style="margin-top: 40px; text-align: center; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
            Vox Mastery &copy; 2026 - Systèmes de Rhétorique de Haut Niveau
        </footer>
    </div>
    `;
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

        // --- PROMPT IA GÉNÉRANT LE RAPPORT COMPLET ---
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

        Génère un objet JSON avec :{ 
         "score": entre 25 et 65.
         "teaser": Une phrase mystérieuse pour le site web.
         "facts": Analyse des faits (ton, rythme, autorité).
         "consequences": Les impacts réels (perte de contrats, manque de respect, plafond de verre).
         "risk": Le plus grand danger pour sa carrière s'il ne change rien.
         "steps": Une liste de 3 points techniques à améliorer. 
        }

        JSON UNIQUEMENT.
        `;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const analysisData = JSON.parse(chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim());

        // --- GÉNÉRATION DU RAPPORT HTML DYNAMIQUE ---
        const htmlReport = generateHTMLReport(userName, analysisData.score, analysisData);

        // --- ENVOI AU WEBHOOK MAKE ---
        if (MAKE_CRM_WEBHOOK) {
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: req.body.whatsapp,
                score: analysisData.score,
                teaser: analysisData.teaser,
                html_report: htmlReport // Le bloc HTML prêt à l'emploi
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        // On renvoie juste le teaser et le score au site web
        res.status(200).json({
            score: analysisData.score,
            diagnostic: `${analysisData.teaser} 🔒 Votre audit stratégique complet (Faits & Conséquences) vous attend sur WhatsApp et par Email.`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur technique." });
    }
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
