import appDataSource from "../../config/dbConfig.mjs";
import { EventReportEntity } from "./event_reports.entity.mjs";
import { MoneyReportEntity } from "./money_reports.entity.mjs";
import { EventEntity } from "../events/events.entity.mjs";
import { EventProposalEntity } from "../proposals/proposals.entity.mjs";
import { NotFoundError, ForbiddenError, ValidationError } from "../shared/errors.mjs";

const eventReportRepo = () => appDataSource.getRepository(EventReportEntity);
const moneyReportRepo = () => appDataSource.getRepository(MoneyReportEntity);
const eventRepo       = () => appDataSource.getRepository(EventEntity);
const proposalRepo    = () => appDataSource.getRepository(EventProposalEntity);

async function resolveEvent(rawId, leadId) {
    // The frontend always routes by proposal ID (enrichProposal returns proposal.id)
    const proposal = await proposalRepo().findOne({ where: { id: rawId } });
    if (!proposal) throw new NotFoundError("Event not found");
    if (proposal.leadId !== leadId) throw new ForbiddenError("You do not own this event");

    const event = await eventRepo().findOne({ where: { proposalId: rawId } });
    if (!event) throw new NotFoundError("Event not found");

    return { event, proposal };
}

export const getReportStatus = async (rawEventId, leadId) => {
    const { event } = await resolveEvent(rawEventId, leadId);

    const [eventReport, moneyReport] = await Promise.all([
        eventReportRepo().findOne({ where: { eventId: event.id } }),
        moneyReportRepo().findOne({ where: { eventId: event.id } }),
    ]);

    return {
        eventId:     event.id,
        eventName:   event.name,
        eventDate:   event.eventDate,
        status:      event.status,
        eventReport: eventReport
            ? { status: eventReport.status, submittedAt: eventReport.submittedAt, url: eventReport.reportPdfUrl }
            : null,
        moneyReport: moneyReport
            ? { status: moneyReport.status, amountSpent: moneyReport.amountSpent, submittedAt: moneyReport.submittedAt, url: moneyReport.reportPdfUrl }
            : null,
    };
};

export const submitReports = async (rawEventId, leadId, { eventReportUrl, moneyReportUrl, amountSpent }) => {
    if (!eventReportUrl) throw new ValidationError("Event report PDF is required");
    if (!moneyReportUrl) throw new ValidationError("Money report PDF is required");
    const amount = Number(amountSpent);
    if (isNaN(amount) || amount < 0) throw new ValidationError("Amount spent must be a non-negative number");

    const { event, proposal } = await resolveEvent(rawEventId, leadId);

    if (!["report_due", "completed"].includes(event.status)) {
        throw new ValidationError("Reports can only be submitted for events with report_due or completed status");
    }

    const existing = await eventReportRepo().findOne({ where: { eventId: event.id } });
    if (existing) {
        await eventReportRepo().update(existing.id, { reportPdfUrl: eventReportUrl, status: "submitted", submittedAt: new Date(), adminComment: null, reviewedAt: null });
    } else {
        await eventReportRepo().save(
            eventReportRepo().create({ eventId: event.id, leadId, clubId: proposal.clubId, reportPdfUrl: eventReportUrl })
        );
    }

    const existingMoney = await moneyReportRepo().findOne({ where: { eventId: event.id } });
    if (existingMoney) {
        await moneyReportRepo().update(existingMoney.id, { reportPdfUrl: moneyReportUrl, amountSpent: amount, status: "submitted", submittedAt: new Date(), adminComment: null, reviewedAt: null });
    } else {
        await moneyReportRepo().save(
            moneyReportRepo().create({ eventId: event.id, leadId, clubId: proposal.clubId, reportPdfUrl: moneyReportUrl, amountSpent: amount })
        );
    }

    if (event.status === "report_due") {
        await eventRepo().update(event.id, { status: "completed" });
    }

    return { submitted: true, eventName: event.name };
};
