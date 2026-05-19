import appDataSource from "../../config/dbConfig.mjs";
import { EventProposalEntity } from "./proposals.entity.mjs";

const getRepo = () => appDataSource.getRepository(EventProposalEntity);

export const getAllProposals = async (req, res) => {
    try {
        const { status } = req.query;
        const findOptions = {
            order: { createdAt: "DESC" }
        };

        if (status && ["draft", "pending", "approved", "rejected"].includes(status.toLowerCase())) {
            findOptions.where = { status: status.toLowerCase() };
        }

        const proposals = await getRepo().find(findOptions);
        return res.status(200).json({ success: true, data: proposals });
    } catch (error) {
        console.error("Error fetching proposals:", error);
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