import * as reportsService from "./reports.service.mjs";

export const getReportStatusHandler = async (req, res, next) => {
    try {
        const result = await reportsService.getReportStatus(req.params.eventId, req.user.userId);
        res.status(200).json(result);
    } catch (err) { next(err); }
};

export const submitReportsHandler = async (req, res, next) => {
    try {
        const eventReportFile = req.files?.eventReport?.[0];
        const moneyReportFile = req.files?.moneyReport?.[0];

        if (!eventReportFile) return res.status(400).json({ error: "Event report PDF is required" });
        if (!moneyReportFile) return res.status(400).json({ error: "Money report PDF is required" });

        const result = await reportsService.submitReports(
            req.params.eventId,
            req.user.userId,
            {
                eventReportUrl: `/uploads/reports/${eventReportFile.filename}`,
                moneyReportUrl: `/uploads/reports/${moneyReportFile.filename}`,
                amountSpent:    req.body.amountSpent,
            }
        );
        res.status(201).json(result);
    } catch (err) { next(err); }
};
