import appDataSource from "../../config/dbConfig.mjs";
import { EventProposalEntity } from "./proposals.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";

const getRepo = () => appDataSource.getRepository(EventProposalEntity);

export const getAllProposals = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const query = getRepo()
      .createQueryBuilder("proposal")
      .leftJoin("users", "lead", "lead.id = proposal.lead_id")
      .leftJoin("clubs", "club", "club.id = proposal.club_id")
      .leftJoin("venues", "venue", "venue.id = proposal.venue_id")
      .select([
        "proposal.id AS id",
        "proposal.lead_id AS lead_id",
        "proposal.club_id AS club_id",
        "proposal.admin_id AS admin_id",
        "proposal.venue_id AS venue_id",
        "proposal.event_name AS event_name",
        "proposal.proposed_date AS proposed_date",
        "proposal.description AS description",
        "proposal.estimated_budget AS estimated_budget",
        "proposal.proposal_pdf_url AS proposal_pdf_url",
        "proposal.status AS status",
        "proposal.admin_comment AS admin_comment",
        "proposal.submitted_at AS submitted_at",
        "proposal.reviewed_at AS reviewed_at",
        "proposal.created_at AS created_at",
        "lead.full_name AS requester_name",
        "club.name AS club_name",
        "club.type AS club_type",
        "venue.name AS venue_name",
      ])
      .orderBy("proposal.created_at", "DESC");

    if (status && ["draft", "pending", "approved", "rejected"].includes(status.toLowerCase())) {
      query.andWhere("proposal.status = :status", { status: status.toLowerCase() });
    }

    if (role === "lead") {
      query.andWhere("proposal.lead_id = :userId", { userId });
    }

    if (role !== "admin" && role !== "lead") {
      return res.status(403).json({
        success: false,
        message: "Only admins and leads can view proposals.",
      });
    }

    const rawProposals = await query.getRawMany();

    const proposals = rawProposals.map((item) => ({
      id: Number(item.id),
      leadId: item.lead_id,
      clubId: item.club_id,
      adminId: item.admin_id,
      venueId: item.venue_id,
      eventName: item.event_name,
      proposedDate: item.proposed_date,
      description: item.description,
      estimatedBudget: item.estimated_budget,
      proposalPdfUrl: item.proposal_pdf_url,
      status: item.status,
      adminComment: item.admin_comment,
      submittedAt: item.submitted_at,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      requesterName: item.requester_name || "Unknown Submitter",
      clubName: item.club_name || "Unknown Club",
      clubType: item.club_type || "club",
      venueName: item.venue_name || "No venue assigned",
    }));

    return res.status(200).json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching proposals.",
    });
  }
};

export const reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment, venueId } = req.body;

    const cleanStatus = status?.toLowerCase();

    if (!["approved", "rejected"].includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status decision. Must be approved or rejected.",
      });
    }

    const proposal = await getRepo().findOneBy({ id: Number(id) });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found.",
      });
    }

    proposal.status = cleanStatus;
    proposal.adminComment = adminComment || proposal.adminComment;
    proposal.adminId = req.user?.userId || null;
    proposal.reviewedAt = new Date();

    if (venueId) {
      proposal.venueId = Number(venueId);
    }

    const updatedProposal = await getRepo().save(proposal);

    if (updatedProposal.status === "approved") {
      const eventRepo = appDataSource.getRepository(EventEntity);

      const existingEvent = await eventRepo.findOne({
        where: { proposalId: updatedProposal.id },
      });

      if (!existingEvent) {
        if (!updatedProposal.clubId || !updatedProposal.venueId || !updatedProposal.proposedDate) {
          return res.status(400).json({
            success: false,
            message: "Approved proposal must have club, venue, and proposed date before creating an event.",
          });
        }

        const event = eventRepo.create({
          proposalId: updatedProposal.id,
          clubId: updatedProposal.clubId,
          venueId: updatedProposal.venueId,
          name: updatedProposal.eventName,
          description: updatedProposal.description || "No description provided.",
          eventDate: updatedProposal.proposedDate,
          status: "approved",
          volunteeringStatus: "closed",
        });

        await eventRepo.save(event);
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedProposal,
    });
  } catch (error) {
    console.error("Error reviewing proposal:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while reviewing proposal.",
    });
  }
};