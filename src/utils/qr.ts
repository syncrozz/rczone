import QRCode from 'qrcode';
import { Session, Machine } from '../types';
import { formatClockTime } from './format';
import { getFallbackPublicToken } from './token';

/**
 * Generate a high-resolution QR code data URL (PNG)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a', // Deep slate for crisp scanning
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Build the customer-facing Short Live Tracker URL (e.g. https://rczone.syncrozz.com/live/74tw4i)
 * Does NOT expose internal session IDs, customer name, price, or timestamps in the URL.
 */
export function getLiveSessionUrl(
  session: Session,
  _machine?: Machine,
  _businessName = 'Fun Ride RC Zone'
): string {
  if (typeof window === 'undefined') return '';
  const token = session.publicSessionToken || getFallbackPublicToken(session.id);
  const origin = window.location.origin;
  return `${origin}/live/${token}`;
}

/**
 * Clean phone number to Malaysian or international format (e.g., 0123456789 -> 60123456789)
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Generate WhatsApp direct share URL with professional formatted message
 */
export function getWhatsAppShareUrl(
  phone: string,
  session: Session,
  machine?: Machine,
  businessName = 'FUN RIDE RC ZONE',
  currencySymbol = 'RM'
): string {
  const cleanPhone = formatPhoneNumberForWhatsApp(phone);
  const liveUrl = getLiveSessionUrl(session, machine, businessName);
  const endTimeStr = formatClockTime(session.endTime);
  const customerName = session.customerName?.trim() || 'Pelanggan';
  const machineName = session.machineName || machine?.name || 'RC Fun Ride Unit';

  const message = [
    `🏁 *${businessName.toUpperCase()} - LIVE TRACKER SESI* 🏁`,
    ``,
    `Hai *${customerName}*! Terima kasih bermain di ${businessName}.`,
    ``,
    `🚜 *Mesin:* ${machineName}`,
    `⏱️ *Pakej:* ${session.packageName} (${session.durationMinutes} Minit)`,
    `💰 *Bayaran:* ${currencySymbol}${session.price.toFixed(2)}`,
    `⏰ *Masa Dijangka Tamat:* ${endTimeStr}`,
    ``,
    `📱 *Pantau Masa Sesi Anda Secara Langsung (Live Timer):*`,
    liveUrl,
    ``,
    `🔔 _Tip: Buka pautan di atas dan aktifkan penggera untuk menerima amaran automatik apabila masa tamat!_`,
    ``,
    `_Selamat bermain & nikmati pengalaman anda!_ 🏎️✨`,
  ].join('\n');

  const encodedMessage = encodeURIComponent(message);
  
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  return `https://wa.me/?text=${encodedMessage}`;
}
