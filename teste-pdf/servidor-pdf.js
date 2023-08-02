const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// Define a rota para a página inicial
app.get('/', async (req, res) => {
  try {
    // Consulta os dados da tabela "Contato" diretamente do banco de dados
    const dadosContatos = await prisma.contato.findMany({
      select: {
        nome: true,
        telefonePrincipal: true,
      },
    });

    // Renderiza os dados na página do navegador
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contatos</title>
      </head>
      <body>
        <h1>Contatos</h1>
        <ul>
          ${dadosContatos
            .map((contato) => `<li>Nome: ${contato.nome}, Telefone: ${contato.telefonePrincipal}</li>`)
            .join('')}
        </ul>
        <a href="/gerar-pdf" target="_blank">Baixar PDF</a>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error('Erro ao consultar o banco de dados:', err);
    res.status(500).send('Erro ao consultar o banco de dados.');
  }
});

// Define a rota pra gerar e baixar o PDF
app.get('/gerar-pdf', async (req, res) => {
  try {
    // Consulta os dados da tabela "Contato" diretamente do banco de dados novamente
    const dadosContatos = await prisma.contato.findMany({
      select: {
        nome: true,
        telefonePrincipal: true,
      },
    });

    // Cria um novo documento PDF
    const pdf = await PDFDocument.create();

    // Adicionar uma página ao documento
    const pagina = pdf.addPage([400, 600]);
    const { width, height } = pagina.getSize();

    // Incorpora a fonte "Helvetica" ao PDF
    const fonteHelvetica = await pdf.embedFont(StandardFonts.Helvetica);

    // Adiciona os dados dos contatos à página do PDF
    const tamanhoFonte = 12;
    const margem = 25;

    let y = height - margem;
    dadosContatos.forEach((contato) => {
      pagina.drawText(`Nome: ${contato.nome}, Telefone: ${contato.telefonePrincipal}`, {
        x: margem,
        y,
        size: tamanhoFonte,
        font: fonteHelvetica,
        color: rgb(0, 0, 0), // cor preta
      });
      y -= tamanhoFonte + 5;
    });

    // Gera o conteúdo do PDF
    const pdfBytes = await pdf.save();

    // Define o cabeçalho da resposta para o download do arquivo PDF
    res.setHeader('Content-Disposition', 'inline; filename=contatos.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    // Envia o conteúdo do PDF para o navegador (ao clicar no botão de baixar o PDF)
    res.end(pdfBytes);
  } catch (err) {
    console.error('Erro ao gerar o PDF:', err);
    res.status(500).send('Erro ao gerar o PDF.');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


// build do servidor: node teste-pdf/servidor-pdf.js
// http://localhost:3000