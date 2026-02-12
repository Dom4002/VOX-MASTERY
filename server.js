// --- API AUDIT ---
app.post('/api/audit', upload.single('audio'), async (req, res) => {
    const userName = req.body.name || "Leader";
    const userWhatsapp = req.body.whatsapp ? req.body.whatsapp.replace(/\+/g, '') : '';
    
    if (!req.file) {
        return res.status(400).json({ error: "Fichier audio manquant." });
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
        console.log("TEXTE BRUT :", textTranscribed);

        // --- NETTOYAGE TECHNIQUE (Code) ---
        // On retire les parasites connus de Whisper
        const hallucinations = ["Sous-titres", "Amara.org", "Thank you", "MBC", "L'invité", "Copyright"];
        let cleanText = textTranscribed;
        hallucinations.forEach(h => {
            cleanText = cleanText.replace(new RegExp(h, "gi"), "");
        });
        cleanText = cleanText.trim();

        // Gatekeeper : Si moins de 3 mots réels, on rejette AVANT d'appeler l'IA (économie + sécurité)
        const wordCount = cleanText.split(/\s+/).length;
        if (cleanText.length < 10 || wordCount < 3) {
            console.log("Rejeté : Audio vide ou inexploitable");
            return res.status(200).json({
                score: 0, authority: 0, clarity: 0, silence: 0,
                diagnostic: "⚠️ Enregistrement inaudible ou trop court. Veuillez parler clairement pendant au moins 10 secondes."
            });
        }

        // 3. LE PROMPT (INTEGRAL + SÉCURITÉ)
        const prompt = `
        ANALYSE DE TRANSCRIPTION : "${cleanText}"

        ---------------------------------------------------
        CONDITION PRÉALABLE (SÉCURITÉ) :
        Si le texte ci-dessus est incohérent, ne veut rien dire, ou ressemble à du bruit de fond (ex: juste des "euh", des bruits, ou des mots sans lien), RENVOYEZ IMMÉDIATEMENT :
        { "score": 0, "authority": 0, "clarity": 0, "silence": 0, "teaser": "Enregistrement non valide.", "facts": "Propos non intelligible.", "consequences": "N/A", "risk": "N/A", "steps": ["Recommencer", "Parler plus fort", "Éviter le bruit"] }
        ---------------------------------------------------

        SINON, APPLIQUEZ L'EXPERTISE VOX MASTERY SUIVANTE (LE VRAI PROMPT) :

        Vous êtes le Mentor Senior Vox Mastery, spécialiste de l’autorité vocale et de la prise de parole à haut niveau.
        Depuis des années, vous accompagnez des dirigeants, cadres et profils à fort potentiel dont la voix constitue un levier stratégique encore sous-exploité.

        Vous avez analysé et comparé des centaines de milliers de discours professionnels réels, et votre référentiel n’est jamais la moyenne.
        Vous évaluez toujours une voix par rapport aux standards requis dans des environnements où l’autorité, la clarté et la maîtrise du rythme conditionnent l’influence réelle.

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

        FORMAT DE SORTIE STRICT (JSON uniquement) :
        {
          "score": nombre entre 25 et 65 (ou 0 si invalide),
          "authority": nombre entre 20 et 70 (ou 0),
          "clarity": nombre entre 20 et 70 (ou 0),
          "silence": nombre entre 15 et 65 (ou 0),
          "teaser": phrase courte et engageante,
          "facts": analyse factuelle avec citation,
          "consequences": conséquence concrète sur l'impact pro,
          "risk": risque moyen terme,
          "steps": tableau de 3 recommandations (axes de travail).
        }
        `;

        const chatResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2 // Température basse pour la rigueur
        }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        let analysisData;
        try {
            const content = chatResponse.data.choices[0].message.content.replace(/```json|```/g, "").trim();
            analysisData = JSON.parse(content);
        } catch (e) {
            console.error("Erreur parsing JSON:", e.message);
            // Fallback neutre en cas de crash IA
            analysisData = {
                score: 0, authority: 0, clarity: 0, silence: 0,
                teaser: "Erreur d'analyse.", facts: "Données non traitées.", consequences: "N/A", risk: "N/A", steps: ["Réessayer"]
            };
        }

        // Envoi au CRM uniquement si le score est valide (> 0)
        if (analysisData.score > 0 && MAKE_CRM_WEBHOOK) {
            const finalHTML = generateFullHTMLReport(userName, analysisData.score, analysisData);
            axios.post(MAKE_CRM_WEBHOOK, {
                name: userName,
                email: req.body.email,
                whatsapp: userWhatsapp,
                score: analysisData.score,
                html_report: finalHTML
            }).catch(err => console.error("Erreur CRM :", err.message));
        }

        res.status(200).json({
            score: analysisData.score,
            authority: analysisData.authority,
            clarity: analysisData.clarity,
            silence: analysisData.silence,
            diagnostic: analysisData.score === 0 
                ? analysisData.teaser 
                : `${analysisData.teaser} 🔒 Audit complet envoyé sur WhatsApp.`
        });

    } catch (error) {
        console.error("Erreur serveur :", error.message);
        res.status(500).json({ error: "Service momentanément indisponible." });
    }
});
