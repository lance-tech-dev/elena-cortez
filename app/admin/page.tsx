import { redirect } from "next/navigation";

// /admin opens the first tab.
export default function AdminPage() {
  redirect("/admin/profile");
}
