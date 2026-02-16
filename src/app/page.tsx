import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <div className="card" style={{ maxWidth: 680, margin: "80px auto" }}>
        <h1 className="heading">Home Cleaning Booking</h1>
        <p className="subtle" style={{ marginTop: 8 }}>
          This project includes an admin dashboard for managing appointments.
        </p>
        <div style={{ marginTop: 20 }}>
          <Link className="btn btn-primary" href="/admin">
            Open Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
