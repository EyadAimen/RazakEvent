import {
    listClubs, listClubRequests, getClubRequest, decideClubRequest,
    getMyClub, getMyClubMembers, getMembershipRequests,
    decideMembershipRequest, removeMember,
} from "./clubs.service.mjs";

export const listClubsHandler = async (req, res, next) => {
    try {
        const clubs = await listClubs();
        res.json({ clubs });
    } catch (err) {
        next(err);
    }
};

export const listClubRequestsHandler = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const requests = await listClubRequests({ status, search });
        res.json({ requests });
    } catch (err) {
        next(err);
    }
};

export const getClubRequestHandler = async (req, res, next) => {
    try {
        const request = await getClubRequest(req.params.requestId);
        res.json({ request });
    } catch (err) {
        next(err);
    }
};

export const decideClubRequestHandler = async (req, res, next) => {
    try {
        const { action, adminComment } = req.body;
        const result = await decideClubRequest(
            req.params.requestId,
            req.user.userId,
            action,
            adminComment
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// ── Lead — My Club ────────────────────────────────────────────────────────────

export const getMyClubHandler = async (req, res, next) => {
    try {
        const club = await getMyClub(req.user.userId);
        res.json({ club });
    } catch (err) {
        next(err);
    }
};

export const getMyClubMembersHandler = async (req, res, next) => {
    try {
        const members = await getMyClubMembers(req.user.userId);
        res.json({ members });
    } catch (err) {
        next(err);
    }
};

export const getMembershipRequestsHandler = async (req, res, next) => {
    try {
        const requests = await getMembershipRequests(req.user.userId);
        res.json({ requests });
    } catch (err) {
        next(err);
    }
};

export const decideMembershipRequestHandler = async (req, res, next) => {
    try {
        const { decision } = req.body;
        const result = await decideMembershipRequest(
            req.user.userId,
            req.params.requestId,
            decision
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const removeMemberHandler = async (req, res, next) => {
    try {
        const result = await removeMember(req.user.userId, req.params.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
