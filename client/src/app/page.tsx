import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      {/* If not logged in, MainLayout will handle showing the auth pages */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted-foreground)" }}>
        Select a workspace to begin
      </div>
    </MainLayout>
  );
}
