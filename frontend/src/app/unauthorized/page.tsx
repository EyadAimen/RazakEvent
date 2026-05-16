import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <h1>Access Denied</h1>
      <p>You don&apos;t have permission to view this page.</p>
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  );
}
