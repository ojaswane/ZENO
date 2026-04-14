const QRCode = require("qrcode");

async function generateQR(sessionId : string) {
    return await QRCode.toDataURL(sessionId);
}

module.exports = generateQR;