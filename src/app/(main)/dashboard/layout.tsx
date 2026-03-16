export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <section className="flex-1 p-10">{children}</section>
    </div>
  );
}
