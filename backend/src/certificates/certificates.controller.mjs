import { getEventVolunteers, issueCertificates, getMyCertificates, getCertificateForDownload } from "./certificates.service.mjs";
import { generateCertificatePdf } from "./certificates.pdf.mjs";

export const getVolunteersHandler = async (req, res, next) => {
    try {
        const result = await getEventVolunteers(req.params.eventId, req.user.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const issueHandler = async (req, res, next) => {
    try {
        const result = await issueCertificates(req.params.eventId, req.user.userId, req.body.applicationIds);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const mineHandler = async (req, res, next) => {
    try {
        const result = await getMyCertificates(req.user.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const downloadHandler = async (req, res, next) => {
    try {
        const data = await getCertificateForDownload(req.params.id, req.user.userId);
        generateCertificatePdf(res, data);
    } catch (err) {
        next(err);
    }
};
