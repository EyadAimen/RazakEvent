// Seed script — run with: node seed.mjs
// Requires the backend to have started at least once so TypeORM
// creates the tables (synchronize: true).

import appDataSource from "./config/dbConfig.mjs";
import { UserEntity }          from "./src/users/users.entity.mjs";
import { ClubEntity }          from "./src/clubs/clubs.entity.mjs";
import { VenueEntity }         from "./src/venues/venues.entity.mjs";
import { EventProposalEntity } from "./src/proposals/proposals.entity.mjs";
import { EventEntity }         from "./src/events/events.entity.mjs";
import bcrypt from "bcryptjs";

async function seed() {
    await appDataSource.initialize();
    console.log("✅ DB connected");

    const userRepo     = appDataSource.getRepository(UserEntity);
    const clubRepo     = appDataSource.getRepository(ClubEntity);
    const venueRepo    = appDataSource.getRepository(VenueEntity);
    const proposalRepo = appDataSource.getRepository(EventProposalEntity);
    const eventRepo    = appDataSource.getRepository(EventEntity);

    // ── 1. Venues ─────────────────────────────────────────────
    const venueNames = [
        { name: "Dewan Tun Hussein Onn, KTR", location: "Block A, Kolej Tun Razak" },
        { name: "Computer Lab 1, KTR",        location: "Block B, Kolej Tun Razak" },
        { name: "Seminar Room A, KTR",         location: "Block C, Kolej Tun Razak" },
    ];
    const venues = {};
    for (const v of venueNames) {
        let venue = await venueRepo.findOne({ where: { name: v.name } });
        if (!venue) {
            venue = await venueRepo.save(venueRepo.create(v));
            console.log(`✅ Venue "${v.name}" created`);
        } else {
            console.log(`ℹ️  Venue "${v.name}" already exists`);
        }
        venues[v.name] = venue;
    }

    // ── 2. Club (no lead yet) ─────────────────────────────────
    let club = await clubRepo.findOne({ where: { name: "Tech Club" } });
    if (!club) {
        club = await clubRepo.save(clubRepo.create({
            name:        "Tech Club",
            type:        "club",
            description: "Technology and innovation club for KTR students.",
        }));
        console.log("✅ Tech Club created");
    } else {
        console.log("ℹ️  Tech Club already exists");
    }

    // ── 3. Lead user (Sarah) ──────────────────────────────────
    const passwordHash = await bcrypt.hash("Password123!", 10);
    let lead = await userRepo.findOne({ where: { email: "sarah.lead@graduate.utm.my" } });
    if (!lead) {
        lead = await userRepo.save(userRepo.create({
            fullName:        "Sarah Amirah",
            staffOrMatricId: "A22CS0001",
            email:           "sarah.lead@graduate.utm.my",
            passwordHash,
            role:            "lead",
        }));
        console.log("✅ Lead user Sarah created");
    } else {
        console.log("ℹ️  Lead user already exists");
    }

    // ── 4. Link club → lead ───────────────────────────────────
    if (club.leadId !== lead.id) {
        await clubRepo.update(club.id, { leadId: lead.id });
        club.leadId = lead.id;
        console.log("✅ Tech Club linked to Sarah");
    }

    // ── 5. Proposals ──────────────────────────────────────────
    const proposalDefs = [
        {
            key:             "symposium",
            eventName:       "Tech Symposium 2026",
            proposedDate:    new Date("2026-05-15T09:00:00"),
            venueKey:        "Dewan Tun Hussein Onn, KTR",
            description:     "Annual technology symposium bringing together students and industry professionals.",
            estimatedBudget: 5000.00,
            status:          "approved",
            submittedAt:     new Date(Date.now() - 30 * 86400000),
            reviewedAt:      new Date(Date.now() - 25 * 86400000),
        },
        {
            key:             "hackathon",
            eventName:       "Hackathon Kickoff",
            proposedDate:    new Date("2026-05-20T08:00:00"),
            venueKey:        "Computer Lab 1, KTR",
            description:     "24-hour hackathon open to all KTR students.",
            estimatedBudget: 2000.00,
            status:          "pending",
            submittedAt:     new Date(Date.now() - 10 * 86400000),
        },
        {
            key:             "aiworkshop",
            eventName:       "AI Workshop",
            proposedDate:    new Date("2026-04-10T09:00:00"),
            venueKey:        "Seminar Room A, KTR",
            description:     "Hands-on workshop covering machine learning fundamentals.",
            estimatedBudget: 1500.00,
            status:          "approved",
            submittedAt:     new Date(Date.now() - 50 * 86400000),
            reviewedAt:      new Date(Date.now() - 45 * 86400000),
        },
    ];

    const proposals = {};
    for (const def of proposalDefs) {
        let proposal = await proposalRepo.findOne({ where: { eventName: def.eventName } });
        if (!proposal) {
            proposal = await proposalRepo.save(proposalRepo.create({
                leadId:          lead.id,
                clubId:          club.id,
                venueId:         venues[def.venueKey].id,
                eventName:       def.eventName,
                proposedDate:    def.proposedDate,
                description:     def.description,
                estimatedBudget: def.estimatedBudget,
                status:          def.status,
                submittedAt:     def.submittedAt ?? null,
                reviewedAt:      def.reviewedAt ?? null,
            }));
            console.log(`✅ Proposal "${def.eventName}" created`);
        } else {
            console.log(`ℹ️  Proposal "${def.eventName}" already exists`);
        }
        proposals[def.key] = proposal;
    }

    // ── 6. Events (approved proposals only) ───────────────────
    const eventDefs = [
        {
            proposal: proposals.symposium,
            status:   "approved",
        },
        {
            proposal: proposals.aiworkshop,
            status:   "report_due",
        },
    ];

    for (const def of eventDefs) {
        const p = def.proposal;
        const existing = await eventRepo.findOne({ where: { proposalId: p.id } });
        if (!existing) {
            await eventRepo.save(eventRepo.create({
                proposalId:  p.id,
                clubId:      p.clubId,
                venueId:     p.venueId,
                name:        p.eventName,
                description: p.description,
                eventDate:   p.proposedDate,
                status:      def.status,
            }));
            console.log(`✅ Event "${p.eventName}" created (${def.status})`);
        } else {
            console.log(`ℹ️  Event "${p.eventName}" already exists`);
        }
    }

    console.log("\n🎉 Seed complete!");
    console.log("   Login: sarah.lead@graduate.utm.my / Password123!");
    await appDataSource.destroy();
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
