// Implementando CRC16 diretamente no arquivo para evitar problemas de importação
class CRC16 {
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

export class PixUtils {
  private static PAD_LEFT = 2;
  private static ID_PAYLOAD_FORMAT = '00';
  private static ID_MERCHANT_ACCOUNT = '26';
  private static ID_MERCHANT_NAME = '59';
  private static ID_MERCHANT_CITY = '60';
  private static ID_TRANSACTION_AMOUNT = '54';
  private static ID_COUNTRY_CODE = '58';
  private static ID_FIELD_ADDITIONAL_DATA = '62';
  private static ID_CRC16 = '63';
  private static PAYLOAD_FORMAT_INDICATOR = '01';
  private static COUNTRY_CODE = 'BR';

  private static getValue(id: string, value: string): string {
    const size = value.length.toString().padStart(this.PAD_LEFT, '0');
    return id + size + value;
  }

  private static getMerchantAccountInfo(pixKey: string): string {
    const gui = 'BR.GOV.BCB.PIX';
    const key = pixKey;
    const merchantAccountString = this.getValue('00', gui) + this.getValue('01', key);
    return this.getValue(this.ID_MERCHANT_ACCOUNT, merchantAccountString);
  }

  private static getAdditionalDataField(txid: string): string {
    return this.getValue(this.ID_FIELD_ADDITIONAL_DATA, this.getValue('05', txid));
  }

  /**
   * Gera um payload PIX simplificado usando apenas a chave PIX e o valor
   * Este método usa valores padrão para os campos não fornecidos
   */
  static generateSimplePayload(
    pixKey: string,
    amount: number
  ): string {
    const merchantName = 'ECCLESIA';
    const merchantCity = 'SAO PAULO';
    // Gera um ID de transação compatível com o padrão esperado pelos bancos
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const txid = `ECCLESIA${randomPart}`;

    return this.generateSimpleCompatiblePayload(
      pixKey,
      merchantName,
      merchantCity,
      txid,
      amount
    );
  }

  /**
   * Gera um payload PIX simplificado e compatível com a maioria dos bancos
   */
  static generateSimpleCompatiblePayload(
    pixKey: string,
    merchantName: string,
    merchantCity: string,
    txid: string,
    amount: number
  ): string {
    // Formato do payload conforme especificação do BACEN
    let payload = this.getValue(this.ID_PAYLOAD_FORMAT, this.PAYLOAD_FORMAT_INDICATOR);

    // Conta do recebedor (chave PIX)
    payload += this.getMerchantAccountInfo(pixKey);

    // Nome do recebedor - limitado a 25 caracteres
    payload += this.getValue(this.ID_MERCHANT_NAME, merchantName.substring(0, 25));

    // Cidade do recebedor - limitado a 15 caracteres
    payload += this.getValue(this.ID_MERCHANT_CITY, merchantCity.substring(0, 15));

    // Valor da transação
    if (amount > 0) {
      payload += this.getValue(
        this.ID_TRANSACTION_AMOUNT,
        amount.toFixed(2)
      );
    }

    // Código do país (Brasil)
    payload += this.getValue(this.ID_COUNTRY_CODE, this.COUNTRY_CODE);

    // Campo para dados adicionais (txid)
    // Limita o tamanho do txid conforme recomendação
    const txidLimitado = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
    payload += this.getAdditionalDataField(txidLimitado);

    // Adiciona o campo para o CRC16 que será calculado abaixo
    payload += this.ID_CRC16 + '04';

    // Calcula o CRC16 do payload e adiciona ao final
    const crc16 = CRC16.compute(payload);
    return payload + crc16.toString(16).toUpperCase();
  }

  /**
   * Gera um payload PIX completo com todos os campos
   * Mantido para compatibilidade com o código existente
   * @param {string} description - Parâmetro mantido para compatibilidade, mas não utilizado
   */
  static generatePayload(
    pixKey: string,
    _description: string, // Prefixado com _ para indicar que é um parâmetro não utilizado
    merchantName: string,
    merchantCity: string,
    txid: string,
    amount: number
  ): string {
    return this.generateSimpleCompatiblePayload(
      pixKey,
      merchantName.substring(0, 10),
      merchantCity.substring(0, 10),
      txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10),
      amount
    );
  }
} 