import type { Certificate } from "@/lib/certificate-format";
import type { Experience } from "@/lib/experience-format";

// Central place for site copy. Items marked PLACEHOLDER should be replaced
// with Elena's real info.

// Profile fallback only: the live profile is edited in Admin → Profile and
// stored in Supabase (see lib/profile.ts). These values are used until the
// profile table exists.
export const site = {
  name: "Elena Cortez",
  role: "IT Graduate · College Lecturer",
  email: "dlsp.ccst.cortezelena@gmail.com",
  status: "Open to IT opportunities",
  location: "San Pablo City, Laguna, Philippines",
  bio: [
    "Information Technology graduate (Cum Laude) majoring in Network Technology, with a solid foundation in networking, web development, hardware troubleshooting, and operating system management.",
    "Now a College Lecturer at Dalubhasaan ng Lungsod ng San Pablo, teaching IT subjects. Detail-oriented, a fast learner who thrives on new challenges, and ready to bring technical skills and a strong work ethic to a forward-thinking IT team.",
  ],
  tagline: "You bring the problem — I'll find the fix.", // PLACEHOLDER
};

export const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Skills", href: "/skills" },
  { name: "Experience", href: "/experience" },
  { name: "Contact", href: "/contact" },
] as const;

export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  href?: string; // live link — adds a "Live Preview" button when set
  image?: string; // cover image URL (uploaded in Admin → Projects)
  published: boolean; // false = hidden from the public site
};

// Projects fallback only: the live list is edited in Admin → Projects and
// stored in Supabase (see lib/projects.ts). Used until that table exists.
export const projects: Project[] = [
  {
    id: "fallback-1",
    title: "Home Lab Network",
    published: true,
    description:
      "Segmented VLANs, firewall rules, and monitoring for a self-hosted lab environment.",
    tags: ["Networking", "pfSense", "VLANs"],
  },
  {
    id: "fallback-2",
    title: "Cloud Migration",
    published: true,
    description:
      "Moved on-prem services to the cloud with automated backups and access controls.",
    tags: ["AWS", "IAM", "Backups"],
  },
  {
    id: "fallback-3",
    title: "Helpdesk Automation",
    published: true,
    description:
      "Scripts that automate account setup and common support tasks to cut ticket time.",
    tags: ["PowerShell", "Active Directory"],
  },
];

// Experience fallback only: the live list is edited in Admin → Experience and
// stored in Supabase (see lib/experience.ts). Used until that table exists.
// Matches the seed rows in supabase/migrations/20261110120000_experience.sql.
export const experience: Experience[] = [
  {
    id: "fallback-1",
    title: "College Lecturer",
    org: "DLSP",
    location: "San Pablo City, Laguna",
    startYear: 2026, startMonth: 8, endYear: null, endMonth: null,
    description:
      "College of Computer Studies and Technology. Delivers lectures and leads class discussions on IT subjects, and builds instructional materials, presentations, quizzes, exams and learning activities aligned with course outcomes.",
  },
  {
    id: "fallback-2",
    title: "On-the-Job Trainee",
    org: "DepEd San Pablo",
    location: "San Pablo City, Laguna",
    startYear: 2026, startMonth: 2, endYear: 2026, endMonth: 5,
    description:
      "Procurement Unit. Prepared, encoded and organized procurement documents, kept digital and physical filing systems accurate, and processed purchase requests and quotations in line with government procurement guidelines.",
  },
  {
    id: "fallback-3",
    title: "Student Assistant",
    org: "Cash for Work",
    location: "",
    startYear: 2025, startMonth: 7, endYear: 2025, endMonth: 8,
    description:
      "Administrative and clerical support: encoding, organizing and maintaining department records, with every task done reliably and on schedule.",
  },
  {
    id: "fallback-4",
    title: "Barangay Information Officer",
    org: "San Pablo City",
    location: "San Pablo City, Laguna",
    startYear: 2024, startMonth: 7, endYear: 2024, endMonth: 12,
    description:
      "Wrote and shared community news and official announcements, documented barangay activities through reports and photography, and coordinated with local officials. Named Best Barangay Information Office Reporter in San Pablo City.",
  },
  {
    id: "fallback-5",
    title: "BS Information Technology",
    org: "DLSP",
    location: "San Pablo City, Laguna",
    startYear: 2022, startMonth: null, endYear: 2026, endMonth: null,
    description:
      "Major in Network Technology at Dalubhasaan ng Lungsod ng San Pablo. Graduated Cum Laude and a consistent Dean's Lister.",
  },
  {
    id: "fallback-6",
    title: "Freelance Event Photographer",
    org: "Independent",
    location: "",
    startYear: 2020, startMonth: 10, endYear: null, endMonth: null,
    description:
      "Covers birthdays, school events, fiestas and milestones end to end: client coordination, on-site shooting, and editing in Lightroom and Photoshop. Most work comes from repeat bookings and referrals.",
  },
];

// Skills fallback only: the live groups are edited in Admin → Skills and
// stored in Supabase (see lib/skills.ts). Used until that table exists.
export const skillGroups: { id: string; title: string; items: string[] }[] = [
  {
    id: "fallback-1",
    title: "IT & Networking",
    items: ["Network Technology", "Hardware Troubleshooting", "Operating Systems", "Web Development"],
  },
  {
    id: "fallback-2",
    title: "Professional",
    items: ["Teaching & Instruction", "Records Management", "Documentation & Reporting", "Client Coordination", "Public Communication"],
  },
  {
    id: "fallback-3",
    title: "Office & Productivity",
    items: ["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint", "Canva"],
  },
  {
    id: "fallback-4",
    title: "Creative",
    items: ["Event Photography", "Adobe Lightroom", "Adobe Photoshop"],
  },
];

// Awards fallback only: the live list is edited in Admin → Awards and
// stored in Supabase (see lib/awards.ts). Used until that table exists.
export const awards: { id: string; title: string; org: string; year: number; description: string }[] = [
  { id: "fallback-1", year: 2026, title: "Cum Laude · Consistent Dean's Lister", org: "DLSP", description: "" },
  { id: "fallback-2", year: 2026, title: "Leadership Awardee", org: "DLSP", description: "" },
  { id: "fallback-3", year: 2026, title: "Loyalty Awardee", org: "DLSP", description: "" },
  { id: "fallback-4", year: 2025, title: "Service Awardee (2025–2026)", org: "DLSP", description: "" },
  { id: "fallback-5", year: 2024, title: "Best Barangay Information Office Reporter", org: "San Pablo City", description: "" },
];

// Certificates fallback only: the live list is edited in Admin → Certificates
// and stored in Supabase (see lib/certificate.ts). Used until that table exists.
// Matches the seed rows in supabase/migrations/20261110130000_certificate.sql.
export const certificates: Certificate[] = [
  { id: "fallback-1", title: "A.S.C.E.N.D Student Leader and Teacher Adviser Assembly", issuer: "DLSP", description: "University Student Parliament", issuedOn: "2025-11-26", credentialUrl: "" },
  { id: "fallback-2", title: "Basic Computer Operations, MS Office, Canva & Bookkeeping", issuer: "LSPU", description: "College of Business Administration and Accountancy, Laguna State Polytechnic University", issuedOn: "2025-07-31", credentialUrl: "" },
  { id: "fallback-3", title: "Overview of ISO 9001:2015", issuer: "ASCXENT", description: "ASCXENT Knowledge Resource Inc.", issuedOn: "2025-06-18", credentialUrl: "" },
  { id: "fallback-4", title: "Digital Bayanihan Webinar", issuer: "DLSP", description: "College of Computer Studies and Technology", issuedOn: "2025-06-14", credentialUrl: "" },
  { id: "fallback-5", title: "Ethical Hacking and Data Security Seminar", issuer: "DLSP", description: "College of Computer Studies and Technology", issuedOn: "2025-04-04", credentialUrl: "" },
];
