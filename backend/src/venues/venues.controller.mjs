import * as venuesService from "./venues.service.mjs";

export const getAllVenuesHandler = async (req, res, next) => {
    try {
        const venues = await venuesService.getAllVenues();
        res.status(200).json({ venues });
    } catch (err) { next(err); }
};

export const getVenueBookedDatesHandler = async (req, res, next) => {
    try {
        const bookedDates = await venuesService.getVenueBookedDates(req.params.id);
        res.status(200).json({ bookedDates });
    } catch (err) { next(err); }
};

export const createVenueHandler = async (req, res, next) => {
    try {
        const venue = await venuesService.createVenue(req.body);
        res.status(201).json({ venue });
    } catch (err) { next(err); }
};

export const updateVenueHandler = async (req, res, next) => {
    try {
        const venue = await venuesService.updateVenue(req.params.id, req.body);
        res.status(200).json({ venue });
    } catch (err) { next(err); }
};

export const deleteVenueHandler = async (req, res, next) => {
    try {
        await venuesService.deleteVenue(req.params.id);
        res.status(204).end();
    } catch (err) { next(err); }
};
