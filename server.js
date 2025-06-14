const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const open = require('open');

const app = express();
const PORT = 3001;
const execAsync = promisify(exec);

// Configurações
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Storage para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `print_${Date.now()}.pdf`);
  }
});

const upload = multer({ storage });

// Criar diretórios necessários
fs.ensureDirSync('temp');
fs.ensureDirSync('public');

// Estado do serviço
let serviceStatus = {
  running: true,
  printer: null,
  lastPrint: null,
  totalPrints: 0,
  errors: []
};

// Detectar impressoras disponíveis
async function detectPrinters() {
  try {
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
      command = 'wmic printer get name';
    } else if (platform === 'darwin') {
      command = 'lpstat -p';
    } else {
      command = 'lpstat -p';
    }
    
    const { stdout } = await execAsync(command);
    console.log('🖨️ Impressoras detectadas:', stdout);
    
    // Procurar por impressoras térmicas comuns
    const thermalPrinters = [
      'Printer_POS_80',
      'POS-80',
      'Thermal',
      'Receipt',
      'Tomate',
      'MDK081'
    ];
    
    for (const printer of thermalPrinters) {
      if (stdout.includes(printer)) {
        serviceStatus.printer = printer;
        console.log(`✅ Impressora térmica encontrada: ${printer}`);
        return printer;
      }
    }
    
    console.log('⚠️ Nenhuma impressora térmica específica encontrada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao detectar impressoras:', error);
    serviceStatus.errors.push(`Erro ao detectar impressoras: ${error.message}`);
    return null;
  }
}

// Imprimir PDF
async function printPDF(filePath, printerName = null) {
  try {
    const platform = process.platform;
    const printer = printerName || serviceStatus.printer || 'default';
    
    let command;
    
    if (platform === 'win32') {
      // Windows
      command = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
    } else if (platform === 'darwin') {
      // macOS
      if (printer === 'default') {
        command = `lp "${filePath}"`;
      } else {
        command = `lp -d "${printer}" -o media=Custom.80x200mm -o fit-to-page "${filePath}"`;
      }
    } else {
      // Linux
      command = `lp -d "${printer}" "${filePath}"`;
    }
    
    console.log(`🖨️ Executando comando: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('request id')) {
      throw new Error(stderr);
    }
    
    serviceStatus.totalPrints++;
    serviceStatus.lastPrint = new Date().toISOString();
    
    console.log('✅ Impressão enviada com sucesso');
    return { success: true, message: 'Impressão enviada com sucesso' };
    
  } catch (error) {
    console.error('❌ Erro na impressão:', error);
    serviceStatus.errors.push(`Erro na impressão: ${error.message}`);
    throw error;
  }
}

// Rotas da API

// Status do serviço
app.get('/status', (req, res) => {
  res.json({
    ...serviceStatus,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    port: PORT
  });
});

// Detectar impressoras
app.get('/printers', async (req, res) => {
  try {
    const printer = await detectPrinters();
    res.json({
      success: true,
      printer,
      available: !!printer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Imprimir PDF via upload
app.post('/print/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PDF enviado'
      });
    }
    
    const result = await printPDF(req.file.path, req.body.printer);
    
    // Limpar arquivo temporário
    fs.removeSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Imprimir PDF via URL
app.post('/print/url', async (req, res) => {
  try {
    const { pdfUrl, printer } = req.body;
    
    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL do PDF é obrigatória'
      });
    }
    
    // Download do PDF
    const response = await fetch(pdfUrl);
    const buffer = await response.buffer();
    
    const tempFile = path.join('temp', `download_${Date.now()}.pdf`);
    fs.writeFileSync(tempFile, buffer);
    
    const result = await printPDF(tempFile, printer);
    
    // Limpar arquivo temporário
    fs.removeSync(tempFile);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Imprimir PDF via base64
app.post('/print/base64', async (req, res) => {
  try {
    const { pdfBase64, printer } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'PDF em base64 é obrigatório'
      });
    }
    
    // Decodificar base64
    const buffer = Buffer.from(pdfBase64, 'base64');
    const tempFile = path.join('temp', `base64_${Date.now()}.pdf`);
    fs.writeFileSync(tempFile, buffer);
    
    const result = await printPDF(tempFile, printer);
    
    // Limpar arquivo temporário
    fs.removeSync(tempFile);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Teste de impressão
app.post('/print/test', async (req, res) => {
  try {
    // Criar PDF de teste simples
    const testContent = `
      TESTE DE IMPRESSÃO
      ==================
      
      Ecclesia Food
      Serviço de Impressão Local
      
      Data: ${new Date().toLocaleString('pt-BR')}
      Impressora: ${serviceStatus.printer || 'Padrão'}
      
      ==================
      Se você consegue ler isso,
      a impressão está funcionando!
    `;
    
    const testFile = path.join('temp', `test_${Date.now()}.txt`);
    fs.writeFileSync(testFile, testContent);
    
    const result = await printPDF(testFile, req.body.printer);
    
    // Limpar arquivo temporário
    fs.removeSync(testFile);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Limpar logs de erro
app.post('/clear-errors', (req, res) => {
  serviceStatus.errors = [];
  res.json({ success: true, message: 'Logs de erro limpos' });
});

// Página de interface web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ecclesia Food - Serviço de Impressão</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .status { padding: 15px; border-radius: 5px; margin: 15px 0; }
            .status.online { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .status.offline { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .button:hover { background: #0056b3; }
            .button.success { background: #28a745; }
            .button.danger { background: #dc3545; }
            .info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .error { background: #f8d7da; padding: 10px; border-radius: 5px; margin: 5px 0; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🖨️ Ecclesia Food</h1>
                <h2>Serviço de Impressão Local</h2>
            </div>
            
            <div id="status" class="status online">
                ✅ Serviço Online - Porta ${PORT}
            </div>
            
            <div class="info">
                <h3>📊 Informações do Sistema</h3>
                <p><strong>Plataforma:</strong> ${process.platform}</p>
                <p><strong>Porta:</strong> ${PORT}</p>
                <p><strong>Impressora Detectada:</strong> <span id="printer">Detectando...</span></p>
                <p><strong>Total de Impressões:</strong> <span id="totalPrints">0</span></p>
                <p><strong>Última Impressão:</strong> <span id="lastPrint">Nenhuma</span></p>
            </div>
            
            <div>
                <h3>🔧 Ações</h3>
                <button class="button" onclick="detectPrinters()">🔍 Detectar Impressoras</button>
                <button class="button success" onclick="testPrint()">🧪 Teste de Impressão</button>
                <button class="button danger" onclick="clearErrors()">🗑️ Limpar Erros</button>
                <button class="button" onclick="refreshStatus()">🔄 Atualizar Status</button>
            </div>
            
            <div id="errors"></div>
            
            <div class="info">
                <h3>📖 Como Usar</h3>
                <p>1. Mantenha este serviço rodando no computador/tablet onde a impressora está conectada</p>
                <p>2. O sistema web irá se comunicar automaticamente com este serviço</p>
                <p>3. Certifique-se de que a impressora está ligada e conectada via USB</p>
                <p>4. Use o teste de impressão para verificar se tudo está funcionando</p>
            </div>
        </div>
        
        <script>
            async function refreshStatus() {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    document.getElementById('printer').textContent = data.printer || 'Nenhuma detectada';
                    document.getElementById('totalPrints').textContent = data.totalPrints;
                    document.getElementById('lastPrint').textContent = data.lastPrint ? new Date(data.lastPrint).toLocaleString('pt-BR') : 'Nenhuma';
                    
                    // Mostrar erros
                    const errorsDiv = document.getElementById('errors');
                    if (data.errors && data.errors.length > 0) {
                        errorsDiv.innerHTML = '<h3>⚠️ Erros Recentes</h3>' + 
                            data.errors.map(error => '<div class="error">' + error + '</div>').join('');
                    } else {
                        errorsDiv.innerHTML = '';
                    }
                } catch (error) {
                    console.error('Erro ao atualizar status:', error);
                }
            }
            
            async function detectPrinters() {
                try {
                    const response = await fetch('/printers');
                    const data = await response.json();
                    alert(data.printer ? 'Impressora encontrada: ' + data.printer : 'Nenhuma impressora térmica detectada');
                    refreshStatus();
                } catch (error) {
                    alert('Erro ao detectar impressoras: ' + error.message);
                }
            }
            
            async function testPrint() {
                try {
                    const response = await fetch('/print/test', { method: 'POST' });
                    const data = await response.json();
                    alert(data.success ? 'Teste de impressão enviado!' : 'Erro: ' + data.error);
                    refreshStatus();
                } catch (error) {
                    alert('Erro no teste de impressão: ' + error.message);
                }
            }
            
            async function clearErrors() {
                try {
                    await fetch('/clear-errors', { method: 'POST' });
                    refreshStatus();
                } catch (error) {
                    alert('Erro ao limpar logs: ' + error.message);
                }
            }
            
            // Atualizar status a cada 5 segundos
            setInterval(refreshStatus, 5000);
            
            // Carregar status inicial
            refreshStatus();
        </script>
    </body>
    </html>
  `);
});

// Inicializar servidor
async function startServer() {
  try {
    // Detectar impressoras na inicialização
    await detectPrinters();
    
    app.listen(PORT, () => {
      console.log(`
🚀 ECCLESIA FOOD - SERVIÇO DE IMPRESSÃO LOCAL
=============================================
✅ Servidor rodando na porta ${PORT}
🌐 Interface web: http://localhost:${PORT}
🖨️ Impressora detectada: ${serviceStatus.printer || 'Nenhuma'}
📱 Plataforma: ${process.platform}

🔧 APIs disponíveis:
- GET  /status          - Status do serviço
- GET  /printers        - Detectar impressoras
- POST /print/upload    - Imprimir PDF via upload
- POST /print/url       - Imprimir PDF via URL
- POST /print/base64    - Imprimir PDF via base64
- POST /print/test      - Teste de impressão

💡 Mantenha este serviço rodando para que o sistema web
   possa se comunicar com a impressora local!
      `);
      
      // Abrir interface web automaticamente
      setTimeout(() => {
        open(`http://localhost:${PORT}`);
      }, 2000);
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  serviceStatus.errors.push(`Erro não capturado: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  serviceStatus.errors.push(`Promise rejeitada: ${reason}`);
});

// Inicializar
startServer(); 