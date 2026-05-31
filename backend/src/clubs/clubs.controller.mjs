import {
    listClubs, listClubRequests, getClubRequest, decideClubRequest,
    getMyClub, getMyClubMembers, getMembershipRequests, decideMembershipRequest, removeMember,
    deleteClub, getClubMembersByClubId,
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

export const getClubMembersByClubIdHandler = async (
    req,
    res,
    next
) => {
    try {
        const members =
            await getClubMembersByClubId(
                req.params.clubId
            );

        res.json({ members });
    } catch (err) {
        next(err);
    }
};

export const deleteClubHandler = async (req, res, next) => {
    try {
        const { deleteReason } = req.body;

        const result = await deleteClub(
            req.params.clubId,
            req.user.userId,
            deleteReason
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
};

// ── Lead handlers ─────────────────────────────────────────────────────────────

export const getMyClubHandler = async (req, res, next) => {
    try { res.json(await getMyClub(req.user.userId)); }
    catch (err) { next(err); }
};

export const getMyClubMembersHandler = async (req, res, next) => {
    try { res.json({ members: await getMyClubMembers(req.user.userId) }); }
    catch (err) { next(err); }
};

export const getMembershipRequestsHandler = async (req, res, next) => {
    try { res.json({ requests: await getMembershipRequests(req.user.userId) }); }
    catch (err) { next(err); }
};

export const decideMembershipRequestHandler = async (req, res, next) => {
    try {
        const result = await decideMembershipRequest(
            req.user.userId,
            req.params.requestId,
            req.body.decision,
        );
        res.json(result);
    } catch (err) { next(err); }
};

export const removeMemberHandler = async (req, res, next) => {
    try { res.json(await removeMember(req.user.userId, req.params.userId)); }
    catch (err) { next(err); }
};
