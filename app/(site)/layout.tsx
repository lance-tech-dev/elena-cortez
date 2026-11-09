import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getProfile, initials } from "@/lib/profile";

// Public portfolio chrome. Login and admin live outside this group,
// so they render without the navbar and footer.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { name, email } = await getProfile();
  return (
    <>
      <Navbar name={name} email={email} monogram={initials(name)} />
      <main className="content-container flex-1 py-12 font-mono sm:py-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
