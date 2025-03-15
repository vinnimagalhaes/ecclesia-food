import { CRC16 } from './CRC16';

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
    const merchantName = 'N';
    const merchantCity = 'C';
    const txid = `ECL${Date.now().toString().substring(0, 8)}`;

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
    let payload = this.getValue(this.ID_PAYLOAD_FORMAT, this.PAYLOAD_FORMAT_INDICATOR);

    payload += this.getMerchantAccountInfo(pixKey);

    payload += this.getValue(this.ID_MERCHANT_NAME, merchantName);

    payload += this.getValue(this.ID_MERCHANT_CITY, merchantCity);

    if (amount > 0) {
      payload += this.getValue(
        this.ID_TRANSACTION_AMOUNT,
        amount.toFixed(2)
      );
    }

    payload += this.getValue(this.ID_COUNTRY_CODE, this.COUNTRY_CODE);

    payload += this.getAdditionalDataField(txid);

    payload += this.ID_CRC16 + '04';

    const crc16 = CRC16.compute(payload);
    return payload + crc16.toString(16).toUpperCase();
  }

  /**
   * Gera um payload PIX completo com todos os campos
   * Mantido para compatibilidade com o código existente
   */
  static generatePayload(
    pixKey: string,
    description: string,
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