const fs = require("fs");
const pages = [
  "dashboard",
  "vehicles",
  "drivers",
  "trips",
  "maintenance",
  "finance",
  "reports",
  "compliance",
  "settings",
];

pages.forEach((p) => {
  const dir = "app/(protected)/" + p;
  fs.mkdirSync(dir, { recursive: true });
  const Name = p.charAt(0).toUpperCase() + p.slice(1);
  const content = `import { requirePermission } from "@/lib/auth/current-user";

export default async function ${Name}Page() {
  await requirePermission("read:${p}");
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">${Name}</h1>
      <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
        <p className="text-muted-foreground">${Name} module content goes here.</p>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(dir + "/page.tsx", content);
});
