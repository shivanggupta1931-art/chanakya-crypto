import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateEvidenceReport(
  element: HTMLElement,
  caseData: any,
  wallets: any[]
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true
  });

  const image = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("CHANDIGARH POLICE", 20, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("CYBER CRIME CELL", 20, 27);
  pdf.text("CHANAKYA-CRYPTO | DEMO EVIDENCE DOSSIER", 20, 33);

  pdf.line(20, 37, 190, 37);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("CRYPTO TRANSACTION EVIDENCE DOSSIER", 20, 49);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const lines = [
    `Case ID: ${caseData.id}`,
    `FIR Number: ${caseData.firNumber}`,
    `Investigator ID: ${caseData.investigator}`,
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    `Estimated illicit funds: INR ${Number(caseData.estimatedIllicitFundsINR).toLocaleString("en-IN")}`,
    `Linked accounts: ${wallets.length}`
  ];

  lines.forEach((line, index) => pdf.text(line, 20, 61 + index * 7));

  pdf.addImage(image, "PNG", 15, 110, 180, 105);

  pdf.addPage();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Linked Account Index", 20, 25);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  wallets.forEach((wallet, index) => {
    const y = 38 + index * 16;
    if (y > 275) {
      pdf.addPage();
      pdf.setFont("helvetica", "bold");
      pdf.text("Linked Account Index — continued", 20, 25);
    }
    pdf.text(`${wallet.label} | ${wallet.type} | Risk ${wallet.riskScore}/100`, 20, y > 275 ? 40 : y);
    pdf.text(wallet.address, 20, (y > 275 ? 40 : y) + 5);
  });

  pdf.save(`${caseData.firNumber}-Evidence-Dossier.pdf`);
}