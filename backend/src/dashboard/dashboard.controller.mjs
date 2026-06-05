import { getAdminDashboard } from "./dashboard.service.mjs";

export const getAdminDashboardHandler = async (req, res, next) => {
    try {
        const data = await getAdminDashboard();
        res.status(200).json(data);
    } catch (err) { next(err); }
};
