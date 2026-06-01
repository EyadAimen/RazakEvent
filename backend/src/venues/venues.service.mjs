import appDataSource from "../../config/dbConfig.mjs";
import { VenueEntity } from "./venues.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { NotFoundError, ValidationError } from "../shared/errors.mjs";

const venueRepo = () => appDataSource.getRepository(VenueEntity);

export const getAllVenues = async () => {
    return venueRepo().find({ order: { name: "ASC" } });
};

export const getVenueBookedDates = async (venueId) => {
    const events = await appDataSource.getRepository(EventEntity).find({
        where: { venueId: Number(venueId) },
        order: { eventDate: "ASC" },
    });
    return events
        .filter(e => e.eventDate)
        .map(e => ({
            eventId: e.id,
            name:    e.name,
            eventDate: e.eventDate,
            status:  e.status,
        }));
};

export const createVenue = async ({ name, location }) => {
    if (!name?.trim()) throw new ValidationError("Venue name is required");
    const repo = venueRepo();
    const existing = await repo.findOne({ where: { name: name.trim() } });
    if (existing) throw new ValidationError("A venue with this name already exists");
    const venue = repo.create({ name: name.trim(), location: location?.trim() ?? null });
    return repo.save(venue);
};

export const updateVenue = async (id, { name, location }) => {
    const repo = venueRepo();
    const venue = await repo.findOne({ where: { id: Number(id) } });
    if (!venue) throw new NotFoundError("Venue not found");
    if (name !== undefined && name.trim() !== venue.name) {
        const dup = await repo.findOne({ where: { name: name.trim() } });
        if (dup) throw new ValidationError("A venue with this name already exists");
    }
    await repo.update(Number(id), {
        ...(name !== undefined     && { name: name.trim() }),
        ...(location !== undefined && { location: location?.trim() ?? null }),
    });
    return repo.findOne({ where: { id: Number(id) } });
};

export const deleteVenue = async (id) => {
    const repo = venueRepo();
    const venue = await repo.findOne({ where: { id: Number(id) } });
    if (!venue) throw new NotFoundError("Venue not found");
    await repo.delete(Number(id));
};
