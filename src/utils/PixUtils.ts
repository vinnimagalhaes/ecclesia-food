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
    const gui = 'br.gov.bcb.pix';
    const key = pixKey;
    const merchantAccountString = this.getValue('00', gui) + this.getValue('01', key);
    return this.getValue(this.ID_MERCHANT_ACCOUNT, merchantAccountString);
  }

  private static getAdditionalDataField(description: string, txid: string): string {
    const txidString = this.getValue('05', txid);
    const descriptionString = description ? this.getValue('02', description) : '';
    return this.getValue(this.ID_FIELD_ADDITIONAL_DATA, txidString + descriptionString);
  }

  /**
   * Gera um payload PIX simplificado usando apenas a chave PIX e o valor
   * Este método usa valores padrão para os campos não fornecidos
   */
  static generateSimplePayload(
    pixKey: string,
    amount: number
  ): string {
    // Usando valores padrão para os campos não fornecidos
    const description = 'Pagamento Ecclesia Food';
    const merchantName = 'Ecclesia Food';
    const merchantCity = 'SAO PAULO';  // Cidade padrão
    const txid = `ECCLESIA${Date.now()}`;

    return this.generatePayload(
      pixKey,
      description,
      merchantName,
      merchantCity,
      txid,
      amount
    );
  }

  /**
   * Gera um payload PIX completo com todos os campos
   */
  static generatePayload(
    pixKey: string,
    description: string,
    merchantName: string,
    merchantCity: string,
    txid: string,
    amount: number
  ): string {
    // Início do payload
    let payload = this.getValue(this.ID_PAYLOAD_FORMAT, this.PAYLOAD_FORMAT_INDICATOR);

    // Conta do recebedor
    payload += this.getMerchantAccountInfo(pixKey);

    // Nome do recebedor
    payload += this.getValue(this.ID_MERCHANT_NAME, merchantName);

    // Cidade do recebedor
    payload += this.getValue(this.ID_MERCHANT_CITY, merchantCity);

    // Valor da transação
    if (amount > 0) {
      payload += this.getValue(
        this.ID_TRANSACTION_AMOUNT,
        amount.toFixed(2)
      );
    }

    // País
    payload += this.getValue(this.ID_COUNTRY_CODE, this.COUNTRY_CODE);

    // Campo adicional (descrição e txid)
    payload += this.getAdditionalDataField(description, txid);

    // CRC16
    payload += this.ID_CRC16 + '04';

    const crc16 = CRC16.compute(payload);
    return payload + crc16.toString(16).toUpperCase();
  }
} 