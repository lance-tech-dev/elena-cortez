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
  title: string;
  description: string;
  tags: string[];
  href?: string; // live link — adds a "Live Preview" button when set
  image?: string; // path in /public, e.g. "/projects/home-lab.png"
};

// PLACEHOLDER projects
export const projects: Project[] = [
  {
    title: "Home Lab Network",
    description:
      "Segmented VLANs, firewall rules, and monitoring for a self-hosted lab environment.",
    tags: ["Networking", "pfSense", "VLANs"],
  },
  {
    title: "Cloud Migration",
    description:
      "Moved on-prem services to the cloud with automated backups and access controls.",
    tags: ["AWS", "IAM", "Backups"],
  },
  {
    title: "Helpdesk Automation",
    description:
      "Scripts that automate account setup and common support tasks to cut ticket time.",
    tags: ["PowerShell", "Active Directory"],
  },
];

// From Elena's CV. `year` is the start year (graduation year for education).
export const experience = [
  {
    year: "2026",
    title: "College Lecturer",
    org: "DLSP",
    description:
      "Aug 2026 – Present · College of Computer Studies and Technology. Delivers lectures and leads class discussions on IT subjects, and builds instructional materials, presentations, quizzes, exams and learning activities aligned with course outcomes.",
  },
  {
    year: "2026",
    title: "BS Information Technology",
    org: "DLSP",
    description:
      "2022 – 2026 · Major in Network Technology at Dalubhasaan ng Lungsod ng San Pablo. Graduated Cum Laude and a consistent Dean's Lister.",
  },
  {
    year: "2026",
    title: "On-the-Job Trainee",
    org: "DepEd San Pablo",
    description:
      "Feb – May 2026 · Procurement Unit. Prepared, encoded and organized procurement documents, kept digital and physical filing systems accurate, and processed purchase requests and quotations in line with government procurement guidelines.",
  },
  {
    year: "2025",
    title: "Student Assistant",
    org: "Cash for Work",
    description:
      "Jul – Aug 2025 · Administrative and clerical support: encoding, organizing and maintaining department records, with every task done reliably and on schedule.",
  },
  {
    year: "2024",
    title: "Barangay Information Officer",
    org: "San Pablo City",
    description:
      "Jul – Dec 2024 · Wrote and shared community news and official announcements, documented barangay activities through reports and photography, and coordinated with local officials. Named Best Barangay Information Office Reporter in San Pablo City.",
  },
  {
    year: "2020",
    title: "Freelance Event Photographer",
    org: "Independent",
    description:
      "Oct 2020 – Present · Covers birthdays, school events, fiestas and milestones end to end: client coordination, on-site shooting, and editing in Lightroom and Photoshop. Most work comes from repeat bookings and referrals.",
  },
];

export const skillGroups = [
  {
    title: "IT & Networking",
    items: ["Network Technology", "Hardware Troubleshooting", "Operating Systems", "Web Development"],
  },
  {
    title: "Professional",
    items: ["Teaching & Instruction", "Records Management", "Documentation & Reporting", "Client Coordination", "Public Communication"],
  },
  {
    title: "Office & Productivity",
    items: ["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint", "Canva"],
  },
  {
    title: "Creative",
    items: ["Event Photography", "Adobe Lightroom", "Adobe Photoshop"],
  },
];

export const awards = [
  { year: "2026", title: "Cum Laude · Consistent Dean's Lister", org: "DLSP" },
  { year: "2026", title: "Leadership Awardee", org: "DLSP" },
  { year: "2026", title: "Loyalty Awardee", org: "DLSP" },
  { year: "2025", title: "Service Awardee (2025–2026)", org: "DLSP" },
  { year: "2024", title: "Best Barangay Information Office Reporter", org: "San Pablo City" },
];

export const trainings = [
  { year: "2025", title: "A.S.C.E.N.D Student Leader and Teacher Adviser Assembly", org: "DLSP", description: "University Student Parliament · Nov 26, 2025" },
  { year: "2025", title: "Basic Computer Operations, MS Office, Canva & Bookkeeping", org: "LSPU", description: "College of Business Administration and Accountancy, Laguna State Polytechnic University · Jul 31, 2025" },
  { year: "2025", title: "Overview of ISO 9001:2015", org: "ASCXENT", description: "ASCXENT Knowledge Resource Inc. · Jun 18, 2025" },
  { year: "2025", title: "Digital Bayanihan Webinar", org: "DLSP", description: "College of Computer Studies and Technology · Jun 14, 2025" },
  { year: "2025", title: "Ethical Hacking and Data Security Seminar", org: "DLSP", description: "College of Computer Studies and Technology · Apr 4, 2025" },
];
