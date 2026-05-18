import {
    submitLeadRoleRequest,
    getMyRequest,
    getIncomingRequests,
    listLeadRoleRequests,
    getLeadRoleRequest,
    decideLeadDecision,
    decideAdminDecision,
} from "./lead_role_requests.service.mjs";

export const submitLeadRoleRequestHandler = async (req, res, next) => {
    try {
        const result = await submitLeadRoleRequest(req.user.userId, req.body.clubId);
        res.status(201).json({ message: "Lead role request submitted", ...result });
    } catch (err) {
        next(err);
    }
};

export const getMyRequestHandler = async (req, res, next) => {
    try {
        const result = await getMyRequest(req.user.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getIncomingRequestsHandler = async (req, res, next) => {
    try {
        const result = await getIncomingRequests(req.user.userId, req.query.status);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const listLeadRoleRequestsHandler = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const requests = await listLeadRoleRequests({ status, search });
        res.json({ requests });
    } catch (err) {
        next(err);
    }
};

export const getLeadRoleRequestHandler = async (req, res, next) => {
    try {
        const result = await getLeadRoleRequest(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const decideLeadDecisionHandler = async (req, res, next) => {
    try {
        const { action, comment } = req.body;
        const result = await decideLeadDecision(req.params.id, req.user.userId, action, comment);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const decideAdminDecisionHandler = async (req, res, next) => {
    try {
        const { action, adminComment } = req.body;
        const result = await decideAdminDecision(req.params.id, req.user.userId, action, adminComment);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
