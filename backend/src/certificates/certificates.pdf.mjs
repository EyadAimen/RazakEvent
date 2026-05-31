import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../../assets");

function drawDecorativeBorder(doc) {
    const { width, height } = doc.page;
    const outerPad   = 18;
    const innerPad   = 26;
    const cornerSize = 22;
    const goldColor  = "#8B6914";

    doc.rect(outerPad, outerPad, width - outerPad * 2, height - outerPad * 2)
        .lineWidth(2.5).strokeColor(goldColor).stroke();

    doc.rect(innerPad, innerPad, width - innerPad * 2, height - innerPad * 2)
        .lineWidth(1).strokeColor(goldColor).stroke();

    const corners = [
        [outerPad, outerPad],
        [width - outerPad - cornerSize, outerPad],
        [outerPad, height - outerPad - cornerSize],
        [width - outerPad - cornerSize, height - outerPad - cornerSize],
    ];
    corners.forEach(([x, y]) => {
        doc.rect(x, y, cornerSize, cornerSize)
            .lineWidth(1).strokeColor(goldColor).stroke();
    });
}

export const generateCertificatePdf = (res, {
    recipientName,
    eventName,
    eventDateStart,
    eventDateEnd,
    role,
}) => {
    const doc = new PDFDocument({ size: "A4", layout: "portrait", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="certificate.pdf"`);
    doc.pipe(res);

    const { width, height } = doc.page;
    const contentLeft  = 60;
    const contentWidth = width - contentLeft * 2;
    const goldColor    = "#8B6914";
    const darkColor    = "#1a1a1a";

    // ── Decorative border ──────────────────────────────────────────────────
    drawDecorativeBorder(doc);

    // ── Logos: UTM on top, KTR below, both centered, same size ────────────
    const utmLogoSize = 200;
    const ktrLogoSize = 90;
    const logoGap     = 70;
    const logoStartY  = 70;
    const utmLogoX    = (width - utmLogoSize) / 2;
    const ktrLogoX    = (width - ktrLogoSize) / 2;

    const ktrLogoY = logoStartY + 20 + logoGap;

    doc.image(join(assetsDir, "utm_logo.png"), utmLogoX, logoStartY, { fit: [utmLogoSize, utmLogoSize] });
    doc.image(join(assetsDir, "ktr_logo.png"), ktrLogoX, ktrLogoY,   { fit: [ktrLogoSize, ktrLogoSize] });

    // ── Top divider ────────────────────────────────────────────────────────
    const topDividerY    = ktrLogoY + ktrLogoSize + 16;
    const bottomDividerY = height - 42;

    doc.moveTo(contentLeft, topDividerY)
        .lineTo(width - contentLeft, topDividerY)
        .lineWidth(1).strokeColor(goldColor).stroke();

    doc.moveTo(contentLeft, bottomDividerY)
        .lineTo(width - contentLeft, bottomDividerY)
        .lineWidth(1).strokeColor(goldColor).stroke();

    // ── Content starts just below top divider ──────────────────────────────
    doc.x = 0;
    doc.y = topDividerY + 36;

    // ── Title ──────────────────────────────────────────────────────────────
    doc.fontSize(34)
        .font("Times-BoldItalic")
        .fillColor(darkColor)
        .text("Certificate of Participation", { align: "center" });

    // ── Subtitle ───────────────────────────────────────────────────────────
    doc.moveDown(0.7);
    doc.fontSize(15)
        .font("Times-Italic")
        .fillColor("#333333")
        .text("This certificate is proudly awarded to", { align: "center" });

    // ── Recipient name with underline ──────────────────────────────────────
    doc.moveDown(0.7);
    doc.fontSize(36)
        .font("Times-BoldItalic")
        .fillColor(darkColor)
        .text(recipientName, { align: "center" });

    const nameLineY     = doc.y + 5;
    const nameLineWidth = 300;
    const nameLineX     = (width - nameLineWidth) / 2;
    doc.moveTo(nameLineX, nameLineY)
        .lineTo(nameLineX + nameLineWidth, nameLineY)
        .lineWidth(1).strokeColor(darkColor).stroke();

    // ── Body text ──────────────────────────────────────────────────────────
    doc.moveDown(1.2);
    doc.fontSize(14)
        .font("Times-Italic")
        .fillColor("#333333")
        .text(
            `in recognition of their commitment and dedication as a ${role} for the`,
            { align: "center" }
        );

    // ── Event name ─────────────────────────────────────────────────────────
    doc.moveDown(0.7);
    doc.fontSize(24)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(eventName, { align: "center" });

    // ── Event date ─────────────────────────────────────────────────────────
    if (eventDateStart || eventDateEnd) {
        const fmt      = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;
        const startStr = fmt(eventDateStart);
        const endStr   = fmt(eventDateEnd);
        const dateStr  = startStr && endStr
            ? `Held from ${startStr} to ${endStr}`
            : startStr ? `Held on ${startStr}` : "";

        doc.moveDown(0.6);
        doc.fontSize(14)
            .font("Times-Italic")
            .fillColor("#444444")
            .text(dateStr, { align: "center" });
    }

    doc.end();
};
