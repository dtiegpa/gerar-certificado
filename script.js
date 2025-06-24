const camposPorModelo = {
  certificacao: ["nomes", "certificacao", "cargahoraria", "data", "periodo", "conteudo", "professor"],
  capacitacao: ["nomes", "capacitacao", "cargahoraria", "data", "periodo", "conteudo", "professor"],
  declaracao: ["nomes", "evento", "cargahoraria", "data", "periodo", "conteudo", "professor"],
  inovacao: ["nomes"]
};

function atualizarFormulario() {
  const modelo = document.getElementById("modelo").value;
  document.querySelectorAll(".campo").forEach(c => c.style.display = "none");
  if (camposPorModelo[modelo]) {
    camposPorModelo[modelo].forEach(id => {
      const campo = document.getElementById("campo-" + id);
      if (campo) campo.style.display = "block";
    });
  }
}

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

  if (dados.conteudo) {
    dados.conteudo = dados.conteudo.split("\n").map(l => l.trim()).filter(l => l).join(", ");
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
    professor: "PROFESSOR"
  };

  const zip = new JSZip();
  const modeloPath = `modelos/${modelo}.pdf`;
  const modeloBytes = await fetch(modeloPath).then(res => res.arrayBuffer());

  for (const nome of nomes) {
    const pdfDoc = await PDFLib.PDFDocument.load(modeloBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    const substitutions = { NOME: nome.trim() };
    Object.keys(dados).forEach(id => {
      const tag = marcadorMap[id];
      if (tag && tag !== "NOME") substitutions[tag] = dados[id];
    });

    Object.entries(substitutions).forEach(([tag, valor], i) => {
      page.drawText(valor || "", {
        x: 100,
        y: 300 - i * 18,
        size: 14,
        font,
        color: PDFLib.rgb(0, 0, 0)
      });
    });

    const pdfBytes = await pdfDoc.save();
    zip.file(`${nome.trim()}.pdf`, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "certificados-gerados.zip");
}
