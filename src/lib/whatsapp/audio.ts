export async function downloadAndTranscribeWhatsAppAudio(opts: {
  mediaId: string;
  token?: string;
}): Promise<string | null> {
  const token = opts.token || process.env.WHATSAPP_ACCESS_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!token || !openaiKey) {
    return null;
  }

  try {
    // 1. Get media download URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${opts.mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) {
      console.warn("[whatsapp-audio] Impossible de récupérer l'URL du média :", metaRes.status);
      return null;
    }
    const metaData = (await metaRes.json()) as { url?: string; mime_type?: string };
    if (!metaData.url) return null;

    // 2. Download the audio file
    const audioRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!audioRes.ok) {
      console.warn("[whatsapp-audio] Impossible de télécharger l'audio :", audioRes.status);
      return null;
    }
    const arrayBuffer = await audioRes.arrayBuffer();
    const mimeType = metaData.mime_type || "audio/ogg";
    const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "mp3";

    // 3. Send to OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([arrayBuffer], { type: mimeType });
    formData.append("file", blob, `audio.${extension}`);
    formData.append("model", "whisper-1");
    formData.append("language", "fr"); // Whisper handles Wolof mixed with French when prompted or default

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!whisperRes.ok) {
      console.warn("[whatsapp-audio] Echec transcription Whisper :", whisperRes.status);
      return null;
    }

    const whisperData = (await whisperRes.json()) as { text?: string };
    const text = whisperData.text?.trim();
    return text || null;
  } catch (err) {
    console.warn("[whatsapp-audio] Erreur traitement audio :", err);
    return null;
  }
}
