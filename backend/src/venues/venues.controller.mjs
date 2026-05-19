import * as venuesService from "./venues.service.mjs";

export const getAllVenuesHandler = async (req, res, next) => {
    try {
        const venues = await venuesService.getAllVenues();
        res.status(200).json({ venues });
    } catch (err) { next(err); }
};
