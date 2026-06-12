import appDataSource from "../../config/dbConfig.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { ClubRequestEntity } from "../clubs/club_requests.entity.mjs";

export const getAdminDashboard = async () => {
    const userRepo        = appDataSource.getRepository(UserEntity);
    const clubRepo        = appDataSource.getRepository(ClubEntity);
    const proposalRepo    = appDataSource.getRepository(EventProposalEntity);
    const eventRepo       = appDataSource.getRepository(EventEntity);
    const clubRequestRepo = appDataSource.getRepository(ClubRequestEntity);

    const [
        activeUsers,
        totalClubs,
        totalCommunities,
        pendingProposals,
        reportsDue,
        clubRequests,
    ] = await Promise.all([
        userRepo.count(),
        clubRepo.count({ where: { type: "club",      deletedAt: null } }),
        clubRepo.count({ where: { type: "community", deletedAt: null } }),
        proposalRepo.count({ where: { status: "pending" } }),
        eventRepo.count({ where: { status: "report_due" } }),
        clubRequestRepo.count({ where: { status: "pending" } }),
    ]);

    return {
        activeUsers,
        totalClubs,
        totalCommunities,
        pendingProposals,
        reportsDue,
        clubRequests,
    };
};
