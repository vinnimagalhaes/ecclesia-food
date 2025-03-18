'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, CheckCircle, AlertCircle } from 'lucide-react';

// Configuração para indicar que esta página lida com conteúdo dinâmico
export const dynamic = 'force-dynamic';

// Código PIX estático para uso enquanto a geração dinâmica não funciona
const CODIGO_PIX_ESTATICO = "00020126580014BR.GOV.BCB.PIX0136d90c0d10-c973-4449-a888-4efb01455f4452040000530398654041.005802BR5918MARCOS VINICIUS S6009SAO PAULO62290525mpagamento*ecclesia123456789630480A8";

// QR Code em base64
const QR_CODE_PIX_ESTATICO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAe1BMVEX///8AAAD7+/vw8PD19fXp6enDw8Pg4OC1tbXk5OTb29vs7Ozz8/PMzMzGxsaXl5d4eHioqKhcXFyPj4+fn5+vr69TU1M2NjZZWVlLS0t+fn5lZWVvb29EREQqKio+Pj4YGBgNDQ0gICA6OjoXFxcwMDCCgoIfHx+Li4u20l+SAAAMQklEQVR4nO2d55aqOhSAoQiiYgUbdmf0vP/7XWzYSSAFCWDm+3POXWctIPuSbCopvb6KioqKioqKioqKioqKioqKioqKioqKioor+rYzVzDJHfX5m49AV8zRePbO3PNmMEwRBEtGf8fhTsKyt9ier0Ga8NZbhGXu9sWTn9Q9x8FcgR8E7KSKc9cCzN9NJq5iTZYdWXBZvhTgYdWvDW2Qqjx8RHw/EdFjZkK9OXMkxXJXZi58WYyJx5PfQiPdNNWZaC70sTsYO+sfYPWl9auhqsezIiI9DFb4QcVTl2dtwMdDMRqMOjDgJy3wxX/LoIGPG29bduHlpvpgxY+SRRTpK5a3zsKkk2aEIYOl3Coy3hdZqKGXzWYbMOKN6T/rczDPiYV73OVuxCLYtOvCDSbH7DCsPBhtq1q1yD9qVYXw6l+fDhDhuiPh4eMpj1q0T/0yKPKYfpd77jPv++HnYxe929/wz86Zuk9SbB1yFxsQz5B9Cj+lMF9j4yTTgZG2Y6Qcx4bqBpRXR0z7zIhyTkfuEZ7Mn1W8XKHdifzeHB+SFj94kfMD8gFsXIXRcA27Ix+SN3n2UebErInE/LBFV7b04bsQm0PXiDnvMY1oVMSeaYu/FNwnvTMK2yjzGRtyIN6Ix5R7TEGPfx56iVZno9+JJ5Fg+o1vM9nzCKfJcDcRMbMQHYqoVioi84HswRN4rsRc/SBv2RW1I6iUcJVvktVKM8XfIa7e06Uubo0PktVukLb2+hby2SdqS00Y/YkCB+PwG8lrBRkPaeY5AE0a5gJXw/BPaeI6AE6YSBDT7jMDT8oQJhWj87qvwWQOcMDwXAKfI6yeB9zwBTjgsFCYO8voZYMIR8p6rQmGCvOsCNuEw8z9v6OsDsAnTsS3Sz2CWvgCbcJzZZY8U5Qx4zxXghI9MuzDLizFgEx6Rd8wsy4vFpXkwdcEk3JU3nCOvbdLGn4G8iQwm4SpX1Fy3yFsT5HWf+MpKrMEkXKMvHiGvTZHXjmgDooNVMAmfyIvGhX8OHXeaIm+i1WcwCQMk/3koIMY4ov9E3kRn1AUm4RXJuRYLiAvkv6dkQGSLvImO44NJuM96l1kRcYe8GZcQy8C2RAA54VEoD4a4KyRCCzPWLvImGjZCTlgsnIq9eEHeRGoVDTlhoYBDnHeHNuE2b8JXDfvdFm3CQ94i4hx5Ey2+gJwwLhSwQJyiXsQbUi/0kDfRQRnkhOKKtEPejXA3YVh7kG2FCCU8YK/t0Sb8yOfBLfImOm4POeGlUMA8Yo625A55E62XgJxQIpPwRZvwmpfpkDfLTYjWLCAnfBU7ES6kqA//crmwiBgl8iZhYZzKm6hoBDlhXu2X9+Kl2EBbsW5MTLCInLDoKovmCeZFR0gT7hJ5E02JICcsjmNlvfgqDrOZiXY7SULUiwniQTRbQ07YK/ZisYQk2hFpGvxLAmHZGHLC4pBUnhCD4owuMlg0RsdZ80BOOCkWMPMiOvA9L47q4YC4RuqGnLC4HE08KRZtiS68meBjZ+h4OeSExVEV8YrKHFUY0/Xxg5a21RI5YXE+TMKLnvLZGfLiCXnzKtCEPSQvSsgLGSuiE0I9MUW96MArKtF62Sk6m4nWLdFqFr0sMu0kzobonSLosnRSXP3ywAsvCaTzG8iTFzrZgnQM0f5IXjjQjlYcXxUdLSUZULSQEy0Bxpvw03PQWSx0oEYeXXqMvCiTLERnGNBFFnTODl3RQr2IJhxofwSfz1h8sFBeRJ4cFbuM6FjpU/CleehcDHphb130OdKLDSp3RH/+BWJQRBx9scfXADrNxcGsqF4z4yjJi+iD0YsmgCMWmvCMTOPx0AnaCM2LGvbc9dAqJDq9iQ5eEQviQ8IbXsWSRVyAfdVXhVwL7w4cMccIQGfkdrhF0ElisQc9daoKoYuCnjDEBlRJ7/lFAeMSn+sFl9ALpqgnj9jgMDHiBzjgJ9M7sQiD4iiPeQPLaFAnOxzggHdCceMeOO2TbRvQSxeTY3MXPtLwuLWLJ/FGgP2ij4OrzU3ImW/jTXTLbBnRVTiMCZHxyJaZDKGzQnlc3YIL96xbsrMUa0t0NKJAuG5lwXTRsLARp9ipnzPRTXbT8gZatXIhuguK+9SNt3QVJyxbZNxgH9+NZ1I037aFsC8L0Ump+k4M5l26cPvNhE+8SWF9xKKZG1+xvJIbsSXzxYjBbf0aY28xbYMvizRrY8bQCdv5nRk32LeEH7WdLG7Tn+Ir1g4q9uaO3yvIFYOYNDLlTzCd2MkepL5m1tlvNnY9IJ6rnJA7se2jxJewrWnwabRGZ4TJqbP14Q1/qvlcEHFTZ9fAGZ+JORGdOvuuJt/Jp8i6DvJc+sJNrZ8F8ldcxMFAdqUNomNRc9rOhzOjyoxzdRMGrdGZL0Ub1tgqtjXGo1oTLLcPdH7Eu0Pzrcw18b9uS24p3qVqLxo84qZN+1UxMtPd5pxRGJDY5/W31z9c9bWRZd7m72a/VzF/hnOyM1bz8LoM+/37ZrM5fX3CICiMYCWbjUXkH45rKnvVUVFRUVFRUVFRUVFRUVFR0f9btrlwZ47h207BZ47tLVzHsS3L/fznbdlO/vOFY9iL+dJo7mN/5fUPyYL+8oORPtx/2ov0x90gvV7+ZBFf6l2JO5fFXN+I3j1+Hp/OfxiH0WX16h/CY+b/2HZLXr8jG+NW3wHZ8FPezG30RHx2wJ50ZELsdUPzFj7U/YT8wzdWtzNKAb8+6/2g/vZ98XadEDLQM7LQvxEp68VGv9Nw1SFhf1v/F8Crdg9Wz4Tk0+hkfBrUd2KHhI3mnlbqbqS+CR1XGfHIbsPuCNdqS/C5fSX0TbgcqSPuFU3YHWH/qGrD/lbVid0RTtRyofGlmgu7I+zfld6xUS5LuyM0lAhHykHUvRMqla0HxbK0Q8LKbSj0oh4I+3elsnSkFJZ2SKiSDZUqNV0S9kfyblTo0O6dcCGdEBU6tB0SyofwRroDQj0R7hTatFzCEXYcXa2xYk3CqUTXxcxu7FbBd4USFL/2jq5KrUNoynxpFLmrnVlpS45QYiuBtUWtqcOOCOUGnSy5PQKWnA1HvXV/IG7DmaQLJdb1LNlY2hGhzHBr+OHnPE2pTZEkTeAKbbjVi9CWadOvZIPJPRHKzfPd6D22UutUJSqGpdv0rS7hQmbkEFtj5ug9KqFc4r9qSugszAqvNiXK0v29thOZ92Jq+F6HhDKZYi9uw1W/H4p30a+83Uwibx1lBvp1CWWCqVs5//UkdqPTBqFM4aMtb4lw43MuuHC7mUTeSiXG+nUJDfFXWnLlhI64iGmLUKJjQzxU6dGHx9L+G1XLnJh7Qok8IP5qSR5QINwU0+6qmm5oSbgRu9AWf7FtwhY9mffhQhzGfXEw1fKoSBL/zVLsQn0ItUWYzn5wXTgXv1NuAVHDw2klxvcaCBWOgahJOBL3pU1xpxqiObPd01fXUvaiubhgVyP0OU8RI2pcpj1yw0uB0BO/UAeh5wkfqIfQZ7uwF4lTjVAmU+gibAgIQ3JB6OUcjheJ4VKThMVlXW0QhuTh9Y7FfekLV6gVMiJJ6q3UxXa+cIVaISXO/FLYly58oShYiUvY4D1tKGHDL6dciYEYxmLvfYnzYXt5MA8pGWDUTWjKLHcpbFNvvU0H8qlWFbEmdCbdEv6JJ6TkvdgvHU8ps8MnK+kQDlnDGZlQfiOFnJgiZieW0OI8pSbhd95dIyGPkSUcsiZHZEIvZjxGnpAdwWcIH6ynyBIau5q/yFMB8Za+spAJu8pLDKE/ZxomlXBaY3WOjLiOHM75fzKEtw6XP+/Y55QJpyvWYxSciHs4a88GRZzd3h+1E7J3AZB3Yq1dlQsJw5MaKGQgHpUH8uGgILbUzLIJY82EDUYXlQnPSrdcUECMr9PZPPKnk5sXRFG0iSIi8/EV+P40mo12++DW4KpPCKEBvTixVkJ+a9QyYcN9AjifpTBHqmfCt1vYmk01EyaE7e+93jBhh+0WpnxJPRcHXMJOL4Uw5Wvqi0SQCbs9GNoc9zoJ1ZZ3a2lW60LH/8qEauvStXSuNR+KJ8i7u8JeXT2nQDgUPgGEjpvvyBgEH/dctcVZB31PpqKioqKioqKioqKioqKioqKioqKioqKiogb6D0rC9Ggm3sFPAAAAAElFTkSuQmCC";

export default function SolucaoPixPage() {
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [detalhesVisiveis, setDetalhesVisiveis] = useState(false);

  // Simulação de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setCarregando(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(CODIGO_PIX_ESTATICO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Solução PIX</h1>
      
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando informações PIX...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <div className="p-6 rounded-xl bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-green-700">
                Código PIX pronto para uso
              </h2>
            </div>
            
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li className="text-green-700">Use o QR Code ou o código copia e cola para fazer o pagamento</li>
              <li className="text-green-700">O código PIX foi configurado com um valor de exemplo de R$ 1,00</li>
            </ul>
          </div>
          
          {/* Código PIX */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold">Código PIX</h2>
            </div>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <img
                  src={QR_CODE_PIX_ESTATICO}
                  alt="QR Code PIX"
                  className="w-64 h-64 border border-gray-200 rounded-lg p-2"
                />
              </div>

              {/* Código Copia e Cola */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Código PIX Copia e Cola:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={CODIGO_PIX_ESTATICO}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 text-sm"
                  />
                  <Button
                    onClick={copiarCodigoPix}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    {copiado ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informações */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informações</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Este é um código PIX estático pré-configurado para demonstração. Para configurar 
                sua própria chave PIX no sistema, acesse as <a href="/configuracoes" className="text-primary-500 underline">Configurações</a>.
              </p>
              <p>
                O código PIX acima foi gerado uma única vez e pode ser usado para testes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 