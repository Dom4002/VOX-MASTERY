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
    <title>Bilan Stratégique Vox Mastery</title>
    <!-- Stylesheets externes sont généralement bloqués. L'utilisation de la balise <style> est un standard de l'email, mais les styles critiques doivent être INLINÉS. -->
    <style type="text/css">
        /* Client-specific resets/fixes */
        body, table, td, p, a, li { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; }
        a { text-decoration: none; }
        /* Common classes for easy maintenance */
        .gold { color: #AF8936 !important; }
        .white { color: #ffffff !important; }
        .wrapper { background-color: #020202; }
        /* Moins de bordure agressive pour adoucir l'aspect */
        .main { border: 1px solid rgba(175, 137, 54, 0.5); border-top: 5px solid #AF8936; } 
        .score-value { font-size: 72px; font-weight: bold; color: #AF8936; margin: 0; line-height: 1; }
        /* Ton plus élégant */
        .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px; } 
        .cta-button-td { background-color: #AF8936; } 
        
        /* Mobile adaptation */
        @media only screen and (max-width: 620px) {
            .main, .wrapper { width: 100% !important; min-width: 100% !important; }
            .content, .header, .footer { padding-left: 20px !important; padding-right: 20px !important; }
            .score-value { font-size: 50px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #020202; color: #d1d5db; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

    <!-- Wrapper Table (Main container) -->
    <table role="presentation" class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout: fixed; background-color: #020202;">
        <tr>
            <td align="center" style="padding-top: 60px; padding-bottom: 60px;">
                <!-- Main Content Table -->
                <table role="presentation" class="main" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0a; max-width: 600px; border: 1px solid rgba(175, 137, 54, 0.5); border-top: 5px solid #AF8936;">
                    
                    <!-- Header -->
                    <tr>
                        <td class="header" style="padding: 40px; text-align: center; border-bottom: 1px solid rgba(175, 137, 54, 0.2);">
                            <!-- Texte plus valorisant -->
                            <p style="margin: 0; font-size: 10px; letter-spacing: 5px; text-transform: uppercase; color: #AF8936;">Analyse Personnelle • Dossier ${Math.floor(Math.random()*90000) + 10000}</p>
                            <h1 style="margin: 20px 0 0 0; font-size: 32px; letter-spacing: -1px; color: #ffffff;">VOX MASTERY</h1>
                            <p style="font-size: 12px; color: #6b7280;">Bilan du ${date}</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px; color: #d1d5db;">
                            <p style="color: #ffffff; margin-top: 0;">Cher <strong>${name}</strong>,</p>
                            <!-- Ton plus humain -->
                            <p style="margin-bottom: 30px;">L'analyse personnalisée de votre <em style="color:#AF8936;">empreinte vocale</em> a été menée par notre équipe d'experts. Ce bilan a pour but de révéler les opportunités d'alignement entre votre prise de parole actuelle et les codes d'impact de l'élite exécutive.</p>

                            <!-- Score Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td class="score-box" align="center" style="background-color: #020202; border: 1px solid #AF8936; padding: 30px; margin: 30px 0;">
                                        <!-- Terme plus positif -->
                                        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Votre Potentiel d'Impact Vocal</p>
                                        <h2 class="score-value" style="font-size: 72px; font-weight: bold; color: #AF8936; margin: 10px 0;">${score}%</h2>
                                        <!-- Phrase plus inspirante -->
                                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #AF8936;">${score > 60 ? 'Un Leadership Naturel Déjà Exprimé' : 'Un Fort Potentiel à Déverrouiller Rapidement'}</p>
                                    </td>
                                </tr>
                            </table>
                            <!-- End Score Box -->

                            <!-- Section 01 -->
                            <div class="section-title" style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px;">01. Bilan & Observations Clés</div>
                            <p style="color: #ffffff;">${data.facts}</p>

                            <!-- Section 02 -->
                            <div class="section-title" style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px;">02. L'enjeu pour votre Parcours de Leader</div>
                            <p style="color: #ffffff;">${data.consequences}</p>

                            <!-- Alert Box - Moins alarmiste -->
                            <div class="alert-box" style="background-color: #4A0404; border-left: 4px solid #AF8936; padding: 20px; margin: 30px 0; color: #ffffff; font-size: 14px;">
                                <strong>POINT DE VIGILANCE ESSENTIEL :</strong> ${data.risk}
                            </div>
                            
                            <!-- Section 03 -->
                            <div class="section-title" style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #AF8936; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid rgba(175, 137, 54, 0.2); padding-bottom: 5px;">03. Axes de Développement Prioritaires</div>
                            <ul style="margin-top: 20px; padding-left: 20px; color: #d1d5db;">
                                ${data.steps.map(step => `<li style="margin-bottom: 12px; color: #ffffff;">${step}</li>`).join('')}
                            </ul>

                            <!-- CTA Section -->
                            <div style="text-align: center; margin-top: 50px;">
                                <p style="color: #ffffff; font-size: 16px; margin-bottom: 10px;"><strong>Ce bilan révèle une partie de votre potentiel.</strong></p>
                                <p style="font-size: 14px; margin-bottom: 25px;">Pour franchir le plafond de verre de votre carrière, votre voix doit devenir un **levier stratégique** de négociation et d'influence.</p>
                                
                                <!-- Bulletproof CTA Button using Table -->
                                <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                                    <tr>
                                        <td align="center" class="cta-button-td" style="border-radius: 0; background-color: #AF8936; padding: 0;">
                                            <a href="https://votre-site.com#application" target="_blank" style="display: block; padding: 18px 35px; color: #020202; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
                                                Découvrir le Programme sur Mesure
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <!-- End CTA Button -->
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer" style="padding: 30px; text-align: center; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
                            Vox Mastery © 2026 — L'art de l'impact Exécutif<br>
                            Consultation d'Élite et Accompagnement Personnalisé.
                        </td>
                    </tr>

                </table>
                <!-- End Main Content Table -->
            </td>
        </tr>
    </table>
    <!-- End Wrapper Table -->
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
