// typeorm configuration to connect to the db

import { DataSource } from "typeorm";
import configVars from "./envConfig.mjs";
import { UserEntity } from "../src/users/users.entity.mjs";
import { ClubEntity } from "../src/clubs/clubs.entity.mjs";
import { ClubMemberEntity } from "../src/clubs/club_members.entity.mjs";
import { ClubRequestEntity } from "../src/clubs/club_requests.entity.mjs";
import { VenueEntity } from "../src/venues/venues.entity.mjs";
import { EventProposalEntity } from "../src/proposals/proposals.entity.mjs";
import { EventEntity } from "../src/events/events.entity.mjs";
import { VolunteeringRoleEntity } from "../src/volunteering/volunteering_roles.entity.mjs";
import { VolunteeringApplicationEntity } from "../src/volunteering/volunteering_applications.entity.mjs";
import { CertificateEntity } from "../src/certificates/certificates.entity.mjs";
import { EventReportEntity } from "../src/reports/event_reports.entity.mjs";
import { MoneyReportEntity } from "../src/reports/money_reports.entity.mjs";
import { LeadRoleRequestEntity } from "../src/requests/lead_role_requests.entity.mjs";
import { MembershipRequestEntity } from "../src/requests/membership_requests.entity.mjs";

const appDataSource = new DataSource({
    type: "postgres",
    host: configVars.host,
    port: configVars.dbPort,
    username: configVars.dbUsername,
    password: configVars.dbPassword,
    database: configVars.database,

    // synchronize: true,
    entities: [
        UserEntity,
        ClubEntity,
        ClubMemberEntity,
        ClubRequestEntity,
        VenueEntity,
        EventProposalEntity,
        EventEntity,
        VolunteeringRoleEntity,
        VolunteeringApplicationEntity,
        CertificateEntity,
        EventReportEntity,
        MoneyReportEntity,
        LeadRoleRequestEntity,
        MembershipRequestEntity,
    ],
});

export default appDataSource;