import appDataSource from "../../config/dbConfig.mjs";
import { VenueEntity } from "./venues.entity.mjs";

const venueRepo = () => appDataSource.getRepository(VenueEntity);

export const getAllVenues = async () => {
    return venueRepo().find({ order: { name: "ASC" } });
};
