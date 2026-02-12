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

// Configuration Multer : 25MB
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } 
}); 

app.use(cors());
app.use(express.json());

// --- ANALYSE BIOMÉTRIQUE TECHNIQUE ---
const calculateBiometrics = (text, duration) => {
    // Nettoyer le texte pour compter les mots réels
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const wordCount = words.length;
    
    // Calcul du WPM (Mots par minute)
    const durationMin = duration / 60;
    const wpm = Math.round(wordCount / durationMin) || 0;
    
    // Détermination de l'impact physique
    let impactStatus = "Équilibré";
    if (wpm > 160) impactStatus = "Nerveux / Instable";
    if (wpm < 100) impactStatus = "Lent / Manque d'énergie";
    if (wpm >= 110 && wpm <= 150) impactStatus = "Leadership / Autorité";

    return { wpm, impactStatus, wordCount };
};






// --- GÉNÉRATEUR RAPPORT HTML ---
const generateFullHTMLReport = (name, score, data) => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Protection si data.steps est vide
    const stepsList = Array.isArray(data.steps) ? data.steps : ["Travailler le débit", "Poser la voix", "Améliorer l'articulation"];
    const stepsHtml = stepsList.map(step => `<li style="margin-bottom: 8px; color: #ffffff;">${step}</li>`).join('');

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
                                    </td>
                                </tr>
                            </table>

                            <!-- Détails des Jauges -->
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
    
    // 1. RÉCUPÉRATION DE LA DURÉE (Ajout pour la précision biométrique)
    const duration = parseInt(req.body.duration) || 20;

    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
    }

    if (!req.file.mimetype.startsWith("audio/")) {
        return res.status(400).json({ error: "Format audio invalide." });
    }

    try {
        console.log("Fichier reçu, taille:", req.file.size);

        // 1. Transcription Whisper
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.webm', contentType: req.file.mimetype });
        formData.append('model', 'whisper-large-v3'); 
        formData.append('response_format', 'json');

        const transResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        let textTranscribed = transResponse.data.text ? transResponse.data.text.trim() : "";
        
        // --- NETTOYAGE TECHNIQUE ---
        const hallucinations = ["Sous-titres", "Amara.org", "Thank you", "MBC", "L'invité", "Copyright"];
        let cleanText = textTranscribed;
        hallucinations.forEach(h => {
            cleanText = cleanText.replace(new RegExp(h, "gi"), "");
        });
        cleanText = cleanText.trim();

        // 2. CALCULS BIOMÉTRIQUES RÉELS (La "Vérité" mathématique)
        const wordsArr = cleanText.split(/\s+/).filter(w => w.length > 2);
        const wordCount = wordsArr.length;
        const wpm = Math.round(wordCount / (duration / 60)) || 0;
        
        let impactStatus = "Équilibré";
        if (wpm > 160) impactStatus = "Urgence / Nervosité (Trop rapide)";
        else if (wpm < 100) impactStatus = "Manque d'impact (Trop lent)";
        else impactStatus = "Zone d'Autorité (Idéal)";

        // Gatekeeper : Sécurité sur le contenu
        const uniqueWords = new Set(wordsArr.map(w => w.toLowerCase()));
        
        if (cleanText.length < 40 || wordCount < 15 || uniqueWords.size < 8) {
            console.log("Rejeté : Audio trop court ou pauvre");
            return res.status(200).json({
                score: 0, authority: 0, clarity: 0, silence: 0,
                diagnostic: "⚠️ Enregistrement trop court ou peu exploitable. Parlez au moins 20 secondes."
            });
        }

        // 3. LE PROMPT (MAINTENU + INJECTION BIOMÉTRIQUE)
        const prompt = `
        ANALYSE DE TRANSCRIPTION : "${cleanText}"
        
        ---------------------------------------------------
        MESURES BIOMÉTRIQUES RÉELLES (DONNÉES SOURCES) :
        - Débit mesuré : ${wpm} mots par minute.
        - Statut du rythme : ${impactStatus}.
        - Durée de l'échantillon : ${duration} secondes.
        ---------------------------------------------------

        CONDITION PRÉALABLE (SÉCURITÉ) :
        Si le texte est incohérent, renvoyez score 0.

        SINON, APPLIQUEZ L'EXPERTISE VOX MASTERY SUIVANTE :


       Vous êtes le Mentor Senior Vox Mastery, spécialiste de l’autorité vocale et de la prise de parole à haut niveau.
        Depuis des années, vous accompagnez des dirigeants, cadres et profils à fort potentiel dont la voix constitue un levier stratégique encore sous-exploité.

        Vous avez analysé et comparé des centaines de milliers de discours professionnels réels, et votre référentiel n’est jamais la moyenne.
        Vous évaluez toujours une voix par rapport aux standards requis dans des environnements où l’autorité, la clarté et la maîtrise du rythme conditionnent l’influence réelle.

        ADOPTEZ UNE POSTURE HUMAINE ET EXPERTE :
        Vous vous adressez à un professionnel intelligent, compétent, mais perfectible.
        Votre rôle n’est pas de juger, ni de flatter, mais de mettre en lumière ce que la voix révèle — et ce qu’elle limite encore.
        
        CONSIGNE SPÉCIFIQUE : Intégrez l'analyse de ce débit de ${wpm} WPM dans votre diagnostic. 
        Expliquez comment ce rythme physique influence la perception de l'autorité du leader.

        RÈGLES DE SCORING (IMPORTANTES) :
        - Les scores doivent rester globalement bas (< 65).
        - Les sous-scores doivent être cohérents avec le débit de ${wpm} WPM.

        FORMAT DE SORTIE STRICT (JSON uniquement) :
        {
          "score": nombre entre 25 et 65,
          "authority": nombre,
          "clarity": nombre,
          "silence": nombre,
          "teaser": "Le constat sur votre débit de ${wpm} WPM...",
          "facts": "Analyse factuelle incluant le rythme et une citation...",
          "consequences": "Conséquence sur l'impact pro...",
          "risk": "Risque moyen terme...",
          "steps": ["Action 1", "Action 2", "Action 3"]
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
            // --- CORRECTION DU PARSING ICI ---
            const rawContent = chatResponse.data.choices[0].message.content;
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/); // Trouve le JSON réel entre les accolades
            if (!jsonMatch) throw new Error("JSON non trouvé dans la réponse");
            
            analysisData = JSON.parse(jsonMatch[0]);
            
            const clamp = (val, min, max) => Math.max(min, Math.min(max, Number(val) || 0));
            
            analysisData.score = clamp(analysisData.score, 0, 65);
            analysisData.authority = clamp(analysisData.authority, 0, 70);
            analysisData.clarity = clamp(analysisData.clarity, 0, 70);
            analysisData.silence = clamp(analysisData.silence, 0, 65);

            if (analysisData.score > 0) {
                analysisData.score = Math.round((analysisData.authority + analysisData.clarity + analysisData.silence) / 3);
            }
        } catch (e) {
            console.error("Erreur parsing JSON:", e.message);
            analysisData = { score: 0, authority: 0, clarity: 0, silence: 0, teaser: "Erreur d'analyse.", facts: "", consequences: "", risk: "", steps: [] };
        }

        // Envoi au CRM
        if (analysisData.score > 0 && MAKE_CRM_WEBHOOK) {
            const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName, email: req.body.email, whatsapp: userWhatsapp,
                score: analysisData.score, html_report: finalHTML, wpm: wpm // On ajoute le WPM au CRM
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        // RÉPONSE FINALE (Avec ajout du WPM pour le frontend)
        res.status(200).json({
            score: analysisData.score,
            authority: analysisData.authority,
            clarity: analysisData.clarity,
            silence: analysisData.silence,
            wpm: wpm, // Crucial pour le badge frontend
            diagnostic: analysisData.score === 0 
                ? analysisData.teaser 
                : `${analysisData.teaser} 🔒 Audit complet envoyé sur WhatsApp.`
        });

    } catch (error) {
        console.error("Erreur serveur :", error.message);
        res.status(500).json({ error: "Service momentanément indisponible." });
    }
});

app.listen(PORT, () => console.log(`Serveur Vox Mastery démarré sur le port ${PORT}`));
