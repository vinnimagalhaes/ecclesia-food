export class CRC16 {
  private static readonly POLYNOMIAL = 0x1021;
  private static readonly INITIAL = 0xFFFF;

  static compute(str: string): number {
    let crc = this.INITIAL;
    const bytes = new TextEncoder().encode(str);

    for (const byte of bytes) {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ this.POLYNOMIAL;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }

    return crc;
  }
} 