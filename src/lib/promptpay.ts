// Simple EMVCo PromptPay QR Payload Generator for Thailand
// Ref: PromptPay Spec (00020101021129370016A000000677010111...)

export function generatePromptPayPayload(target: string, amount?: number): string {
  const sanitizeTarget = target.replace(/[^0-9]/g, '');
  let targetType = '01'; // 01 for Mobile, 02 for National ID / Tax ID

  let formattedTarget = sanitizeTarget;
  if (sanitizeTarget.length === 10 && sanitizeTarget.startsWith('0')) {
    // Mobile number: prefix 66 replacing leading 0
    formattedTarget = '0066' + sanitizeTarget.substring(1);
    targetType = '01';
  } else if (sanitizeTarget.length === 13) {
    targetType = '02';
  }

  const tag29Target = `0016A000000677010111${targetType}${String(formattedTarget.length).padStart(2, '0')}${formattedTarget}`;
  const tag29 = `29${String(tag29Target.length).padStart(2, '0')}${tag29Target}`;

  const payloadParts = [
    '000201', // Payload Format Indicator
    '010211', // Point of Initiation Method (11: Static, 12: Dynamic)
    tag29,
    '5303764', // Currency Code THB (764)
  ];

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payloadParts.push(`54${String(formattedAmount.length).padStart(2, '0')}${formattedAmount}`);
  }

  payloadParts.push('5802TH'); // Country Code TH

  // Append CRC placeholder
  const rawPayload = payloadParts.join('') + '6304';
  const crc = calculateCRC16(rawPayload);

  return rawPayload + crc;
}

function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
