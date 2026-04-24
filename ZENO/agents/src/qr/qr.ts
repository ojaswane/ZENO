import QRCode from "qrcode";

export type QrPayload = {
  sessionId: string;
  serverUrl: string;
};

export async function generateQrDataUrl(payload: QrPayload): Promise<string> {
  const text = JSON.stringify(payload);
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });
}

