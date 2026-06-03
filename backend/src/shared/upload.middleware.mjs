import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "./uploads/proposals";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CLUB_LETTER_DIR = "./uploads/club-letters";
if (!fs.existsSync(CLUB_LETTER_DIR)) fs.mkdirSync(CLUB_LETTER_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}.pdf`);
    },
});

const clubLetterStorage = multer.diskStorage({
    destination: CLUB_LETTER_DIR,
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}.pdf`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are accepted"), false);
    }
};

export const uploadProposalPdf = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("proposalPdf");

export const uploadClubLetter = multer({
    storage: clubLetterStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single("supportingLetter");

const REPORTS_DIR = "./uploads/reports";
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

const reportStorage = multer.diskStorage({
    destination: REPORTS_DIR,
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}.pdf`);
    },
});

export const uploadReportFiles = multer({
    storage: reportStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
    { name: "eventReport", maxCount: 1 },
    { name: "moneyReport", maxCount: 1 },
]);
