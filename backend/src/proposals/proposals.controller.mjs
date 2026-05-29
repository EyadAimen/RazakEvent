import appDataSource from "../../config/dbConfig.mjs";
import { EventProposalEntity } from "./proposals.entity.mjs";

const getRepo = () => appDataSource.getRepository(EventProposalEntity);

export const getAllProposals = async (req, res) => {
    try {
        const { status } = req.query;

        const query = getRepo()
            .createQueryBuilder("proposal")
            .leftJoin("users", "user", "user.id = proposal.lead_id") 
            .select([
                "proposal.id AS id",
                "proposal.lead_id AS leadId",
                "proposal.club_id AS clubId",
                "proposal.admin_id AS adminId",
                "proposal.venue_id AS venueId",
                "proposal.event_name AS eventName",
                "proposal.proposed_date AS proposedDate",
                "proposal.description AS description",
                "proposal.estimated_budget AS estimatedBudget",
                "proposal.proposal_pdf_url AS proposalPdfUrl",
                "proposal.status AS status",
                "proposal.admin_comment AS adminComment",
                "proposal.submitted_at AS submittedAt",
                "proposal.reviewed_at AS reviewedAt",
                "proposal.created_at AS createdAt",
                "user.full_name AS requesterName"
            ])
            .orderBys({ "proposal.created_at": "DESC" });

        if (status && ["draft", "pending", "approved", "rejected"].includes(status.toLowerCase())) {
            query.where("proposal.status = :status", { status: status.toLowerCase() });
        }

        const rawProposals = await query.getRawMany();

        return res.status(200).json({ success: true, data: rawProposals });
    } catch (error) {
        console.error("Error fetching proposals with user joins:", error);
        return res.status(500).json({ error: "Internal server error while fetching proposals." });
    }
};


export const reviewProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminComment, venueId } = req.body;

        const adminId = req.user?.userId ?? null;

        if (!["approved", "rejected"].includes(status?.toLowerCase())) {
            return res.status(400).json({ error: "Invalid status decision. Must be 'approved' or 'rejected'." });
        }

        const proposal = await getRepo().findOneBy({ id: parseInt(id, 10) });
        if (!proposal) {
            return res.status(404).json({ error: "The targeted event proposal does not exist." });
        }

        proposal.status = status.toLowerCase();
        proposal.adminComment = adminComment || proposal.adminComment;
        proposal.adminId = adminId;
        proposal.reviewedAt = new Date();

        if (venueId) {
            proposal.venueId = parseInt(venueId, 10);
        }

        const updatedProposal = await getRepo().save(proposal);
        return res.status(200).json({ success: true, data: updatedProposal });
    } catch (error) {
        console.error("Error evaluating proposal decision:", error);
        return res.status(500).json({ error: "Internal server error processing administration decision." });
    }
};