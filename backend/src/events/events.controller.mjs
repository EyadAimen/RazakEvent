import * as eventsService from "./events.service.mjs";

export const getDashboardHandler = async (req, res, next) => {
    try {
        const data = await eventsService.getLeadDashboard(req.user.userId);
        res.status(200).json(data);
    } catch (err) { next(err); }
};

export const getLeadEventsHandler = async (req, res, next) => {
    try {
        const { status } = req.query;
        const events = await eventsService.getLeadEvents(req.user.userId, status);
        res.status(200).json({ events });
    } catch (err) { next(err); }
};

export const createEventHandler = async (req, res, next) => {
    try {
        const event = await eventsService.createEvent(req.user.userId, req.body);
        res.status(201).json({ event });
    } catch (err) { next(err); }
};

export const getEventHandler = async (req, res, next) => {
    try {
        const event = await eventsService.getEventById(req.params.eventId, req.user.userId);
        res.status(200).json({ event });
    } catch (err) { next(err); }
};

export const updateEventHandler = async (req, res, next) => {
    try {
        const event = await eventsService.updateEvent(req.params.eventId, req.user.userId, req.body);
        res.status(200).json({ event });
    } catch (err) { next(err); }
};

export const submitProposalHandler = async (req, res, next) => {
    try {
        const event = await eventsService.submitEventProposal(req.params.eventId, req.user.userId);
        res.status(200).json({ event });
    } catch (err) { next(err); }
};

export const decideProposalHandler = async (req, res, next) => {
    try {
        const { decision, adminComment } = req.body;
        const event = await eventsService.decideProposal(req.params.eventId, decision, adminComment);
        res.status(200).json({ event });
    } catch (err) { next(err); }
};

export const getAllEventsHandler = async (req, res, next) => {
    try {
        const { status } = req.query;
        const events = await eventsService.getAllEvents(status);
        res.status(200).json({ events });
    } catch (err) { next(err); }
};
