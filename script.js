// Campos por modelo
const camposPorModelo = {
  certificacao: ["nomes", "certificacao", "cargahoraria", "data", "periodo", "conteudo", "professor", "turno", "horario"],
  capacitacao: ["nomes", "capacitacao", "cargahoraria", "data", "periodo", "conteudo", "professor", "turno", "horario"],
  declaracao: ["nomes", "evento", "cargahoraria", "data", "periodo", "conteudo", "professor", "turno", "horario"],
  inovacao: ["nomes"]
};

// Atualiza o formulário com base no modelo escolhido
function atualizarFormulario() {
  const modelo = document.getElementById("modelo").value;
  const campos = document.querySelectorAll(".campo");

  campos.forEach(campo => campo.style.display = "none");

  if (camposPorModelo[modelo]) {
    camposPorModelo[modelo].forEach(id => {
      const campo = document.getElementById("campo-" + id);
      if (campo) campo.style.display = "block";
    });
  }
}

// Geração principal
async function gerarCertificados() {
  const modelo = document.getElementById("modelo").value;
  if (!modelo || !camposPorModelo[modelo]) {
    alert("Selecione um modelo válido.");
    return;
  }

  const nomes = document.getElementById("nomes").value.trim().split("\n").filter(n => n.trim());
  if (nomes.length === 0) {
    alert("Insira ao menos um nome.");
    return;
  }

  const dados = {};
  camposPorModelo[modelo].forEach(id => {
    const el = document.getElementById(id);
    dados[id] = el ? el.value.trim() : "";
  });

  // Conteúdo em lista
  if (dados.conteudo) {
    dados.conteudo = dados.conteudo.split("\n").map(linha => linha.trim()).filter(l => l).join(", ");
  }

  const marcadorMap = {
    nome: "NOME",
    certificacao: "CERTIFICACAO",
    capacitacao: "CAPACITACAO",
    evento: "EVENTO",
    cargahoraria: "CARGAHORARIA",
    data: "DATA",
    periodo: "PERIODO",
    conteudo: "CONTEUDO",
    professor: "PROFESSOR",
    turno: "TURNO",
    horario: "HORARIO"
  };

  const zip = new JSZip();

  const modeloPath = `modelos/${modelo}.pdf`;
  const modeloBytes = await fetch(modeloPath).then(res => res.arrayBuffer());

  for (const nome of nomes) {
    const pdfDoc = await PDFLib.PDFDocument.load(modeloBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    const substitutions = {
      NOME: nome.trim(),
    };

    Object.keys(dados).forEach(id => {
      const key = marcadorMap[id];
      if (key && key !== "NOME") {
        substitutions[key] = dados[id];
      }
    });

    const pageText = page.getTextContent ? await page.getTextContent() : null;

    Object.keys(substitutions).forEach(tag => {
      const marcador = `{{${tag}}}`;
      page.drawText(substitutions[tag] || "", {
        x: 100,
        y: 300 - Object.keys(substitutions).indexOf(tag) * 20, // ajuste vertical simples
        size: 14,
        font,
        color: PDFLib.rgb(0, 0, 0)
      });
    });

    const pdfBytes = await pdfDoc.save();
    const nomeArquivo = `${nome.trim()}.pdf`;
    zip.file(nomeArquivo, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "certificados-gerados.zip");
}
