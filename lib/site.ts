// Central place for site copy. Items marked PLACEHOLDER should be replaced
// with Elena's real info.

export const site = {
  name: "Elena Cortez",
  role: "IT Professional", // PLACEHOLDER
  email: "dlsp.ccst.cortezelena@gmail.com",
  status: "Open to opportunities", // PLACEHOLDER
  location: "Philippines", // PLACEHOLDER
  bio: [
    // PLACEHOLDER
    "IT professional focused on building dependable systems, troubleshooting complex issues, and keeping technology running smoothly for the people who rely on it.",
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

// PLACEHOLDER experience
export const experience = [
  {
    year: "20XX",
    title: "IT Specialist",
    org: "Company Name",
    description: "Describe your responsibilities and the impact you had in this role.",
  },
  {
    year: "20XX",
    title: "IT Support Technician",
    org: "Company Name",
    description: "Describe your responsibilities and the impact you had in this role.",
  },
  {
    year: "20XX",
    title: "Degree / Certification",
    org: "School or Provider",
    description: "Add relevant education, certifications, or training.",
  },
];

// PLACEHOLDER skills
export const skillGroups = [
  { title: "Networking", items: ["TCP/IP", "DNS & DHCP", "VLANs", "Firewalls", "VPN"] },
  { title: "Systems", items: ["Windows Server", "Linux", "Active Directory", "Virtualization"] },
  { title: "Cloud", items: ["AWS", "Azure", "Microsoft 365", "Backups & DR"] },
  { title: "Tools & Scripting", items: ["PowerShell", "Bash", "Git", "Ticketing"] },
];
