import {
    listClubs,
    createClubRequest,
    listClubRequests,
    getClubRequest,
    decideClubRequest,

    getMyClub,
    getMyClubs,
    getMyClubMembers,
    getMembershipRequests,
    decideMembershipRequest,
    removeMember,

    getClubMembersByClubId,
    getClubEventsByClubId,

    listUsersWithoutClub,
    addClubMemberByAdmin,
    removeClubMemberByAdmin,
    changeClubLeadByAdmin,
    updateClubDetailsByAdmin,

    deleteClub,
} from "./clubs.service.mjs";

export const createClubRequestHandler = async (req, res, next) => {
    try {
        const { clubName, clubType, description, category } = req.body;
        const supportingLetterPath = req.file?.path ?? null;
        const result = await createClubRequest(req.user.userId, { clubName, clubType, description, category, supportingLetterPath });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

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

export const getClubEventsByClubIdHandler = async (req, res, next) => {
    try {
        const events = await getClubEventsByClubId(req.params.clubId);
        res.json({ events });
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

export const listUsersWithoutClubHandler = async (req, res, next) => {
    try {
        const users = await listUsersWithoutClub({
            search: req.query.search,
        });

        res.json({ users });
    } catch (err) {
        next(err);
    }
};

export const addClubMemberByAdminHandler = async (req, res, next) => {
    try {
        const result = await addClubMemberByAdmin(
            req.params.clubId,
            req.body.userId
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const removeClubMemberByAdminHandler = async (req, res, next) => {
    try {
        const result = await removeClubMemberByAdmin(
            req.params.clubId,
            req.params.userId
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const changeClubLeadByAdminHandler = async (req, res, next) => {
    try {
        const result = await changeClubLeadByAdmin(
            req.params.clubId,
            req.body.newLeadId
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const updateClubDetailsByAdminHandler = async (req, res, next) => {
    try {
        const result = await updateClubDetailsByAdmin(
            req.params.clubId,
            req.body
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

export const getMyClubsHandler = async (req, res, next) => {
    try { res.json({ clubs: await getMyClubs(req.user.userId) }); }
    catch (err) { next(err); }
};

export const getMyClubMembersHandler = async (req, res, next) => {
    try { res.json({ members: await getMyClubMembers(req.user.userId, req.query.clubId) }); }
    catch (err) { next(err); }
};

export const getMembershipRequestsHandler = async (req, res, next) => {
    try { res.json({ requests: await getMembershipRequests(req.user.userId, req.query.clubId) }); }
    catch (err) { next(err); }
};

export const decideMembershipRequestHandler = async (req, res, next) => {
    try {
        const result = await decideMembershipRequest(
            req.user.userId,
            req.params.requestId,
            req.body.decision,
            req.query.clubId,
        );
        res.json(result);
    } catch (err) { next(err); }
};

export const removeMemberHandler = async (req, res, next) => {
    try { res.json(await removeMember(req.user.userId, req.params.userId, req.query.clubId)); }
    catch (err) { next(err); }
};
