const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID
const TOKEN = process.env.ZAPI_TOKEN

function sanitizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  // Garante código do país 55 (Brasil)
  return digits.startsWith('55') ? digits : `55${digits}`
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!INSTANCE_ID || !TOKEN) {
    console.log('[Z-API] credenciais não configuradas — mensagem não enviada.')
    return
  }

  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: sanitizePhone(phone),
      message,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[Z-API] erro ao enviar para ${phone}: ${res.status} — ${body}`)
  }
}
