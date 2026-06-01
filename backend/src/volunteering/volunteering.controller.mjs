import * as volunteeringService from "./volunteering.service.mjs";

export const getOpenEventsHandler = async (req, res, next) => {
    try {
        const data = await volunteeringService.getOpenEvents();
        res.status(200).json(data);
    } catch (err) { next(err); }
};

export const createRoleHandler = async (req, res, next) => {
    try {
        const role = await volunteeringService.createRole(req.params.eventId, req.user.userId, req.body);
        res.status(201).json(role);
    } catch (err) { next(err); }
};

export const updateRoleHandler = async (req, res, next) => {
    try {
        const role = await volunteeringService.updateRole(req.params.roleId, req.user.userId, req.body);
        res.status(200).json(role);
    } catch (err) { next(err); }
};

export const deleteRoleHandler = async (req, res, next) => {
    try {
        await volunteeringService.deleteRole(req.params.roleId, req.user.userId);
        res.status(200).json({ message: "Role deleted" });
    } catch (err) { next(err); }
};

export const applyToRoleHandler = async (req, res, next) => {
    try {
        const result = await volunteeringService.applyToRole(req.user.userId, req.body);
        res.status(201).json(result);
    } catch (err) { next(err); }
};

export const getMyApplicationsHandler = async (req, res, next) => {
    try {
        const data = await volunteeringService.getMyApplications(req.user.userId);
        res.status(200).json(data);
    } catch (err) { next(err); }
};

export const decideApplicationHandler = async (req, res, next) => {
    try {
        const result = await volunteeringService.decideVolunteerApplication(
            req.params.applicationId,
            req.user.userId,
            req.body.decision,
            req.body.rejectionMessage,
        );
        res.status(200).json(result);
    } catch (err) { next(err); }
};

export const getClubVolunteerApplicationsHandler = async (req, res, next) => {
    try {
        const result = await volunteeringService.getClubVolunteerApplications(
            req.query.clubId,
            req.user.userId,
        );
        res.status(200).json(result);
    } catch (err) { next(err); }
};
