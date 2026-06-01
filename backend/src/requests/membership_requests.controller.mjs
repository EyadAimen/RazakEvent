import {
    submitMembershipRequest,
    getMyRequests,
    getIncomingRequests,
    decideMembership,
} from "./membership_requests.service.mjs";

export const submitMembershipRequestHandler = async (req, res, next) => {
    try {
        const result = await submitMembershipRequest(req.user.userId, req.body.clubId);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const getMyRequestsHandler = async (req, res, next) => {
    try {
        const result = await getMyRequests(req.user.userId);
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

export const decideMembershipHandler = async (req, res, next) => {
    try {
        const result = await decideMembership(
            req.params.id,
            req.user.userId,
            req.body.action,
            req.body.leadComment,
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};
