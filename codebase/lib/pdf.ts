import { db } from "@/lib/db";
import {
  fleetUtilization,
  fuelEfficiency,
  onTimePerformance,
  operationalCost,
} from "@/lib/analytics";

// @react-pdf/renderer needs the same React instance as its reconciler (React 18).
// Next 15 vendors React 19 into bundled server code, so both packages are loaded
// from node_modules at runtime, outside the webpack graph. process.getBuiltinModule
// (Node 22+) cannot be rewritten by webpack; eval("require") covers Node 20.
const getBuiltin = (process as any).getBuiltinModule as
  ((name: string) => any) | undefined;
const nodeRequire: (id: string) => any = getBuiltin
  ? getBuiltin("node:module").createRequire(process.cwd() + "/package.json")
  : // eslint-disable-next-line no-eval
    eval("require");
const React = nodeRequire("react") as any;
const pdf = nodeRequire("@react-pdf/renderer") as any;

const { Document, Page, Text, View, StyleSheet, renderToBuffer } = pdf;
const h = (
  type: any,
  props: Record<string, unknown> | null,
  ...children: any[]
) => React.createElement(type, props, ...children);

const palette = {
  loam: "#2C2C24",
  moss: "#5D7052",
  mist: "#F3F4F1",
  timber: "#DED8CF",
  grass: "#78786C",
  paper: "#FDFCF8",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 64,
    fontSize: 9,
    color: palette.loam,
    backgroundColor: palette.paper,
    fontFamily: "Helvetica",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: palette.moss,
    paddingBottom: 10,
    marginBottom: 16,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: palette.moss },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2 },
  meta: { fontSize: 8, color: palette.grass, textAlign: "right" },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpi: {
    flex: 1,
    backgroundColor: palette.mist,
    borderRadius: 10,
    padding: 10,
  },
  kpiLabel: { fontSize: 7, color: palette.grass, textTransform: "uppercase" },
  kpiValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    color: palette.moss,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
  },
  headRow: {
    flexDirection: "row",
    backgroundColor: palette.mist,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: palette.timber,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    backgroundColor: palette.mist,
    borderRadius: 6,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: palette.grass,
    borderTopWidth: 0.5,
    borderTopColor: palette.timber,
    paddingTop: 8,
  },
});

const inr = (n: number | null | undefined) =>
  `Rs ${Math.round(n || 0).toLocaleString("en-IN")}`;
const dmy = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-IN") : "—";

function kpi(label: string, value: string | number) {
  return h(
    View,
    { style: styles.kpi },
    h(Text, { style: styles.kpiLabel }, label),
    h(Text, { style: styles.kpiValue }, String(value))
  );
}

function table(
  widths: number[],
  head: string[],
  rows: (string | number | null | undefined)[][],
  total?: (string | number)[]
) {
  const cell = (v: unknown, i: number, bold = false) =>
    h(
      Text,
      {
        key: i,
        style: {
          flex: widths[i],
          paddingRight: 4,
          ...(bold ? { fontFamily: "Helvetica-Bold" } : {}),
        },
      },
      String(v ?? "—")
    );
  return h(
    View,
    null,
    h(View, { style: styles.headRow }, ...head.map((x, i) => cell(x, i, true))),
    ...rows.map((r, ri) =>
      h(
        View,
        { key: ri, style: styles.row, wrap: false },
        ...r.map((v, i) => cell(v, i))
      )
    ),
    ...(total
      ? [
          h(
            View,
            { style: styles.totalRow },
            ...total.map((v, i) => cell(v, i, true))
          ),
        ]
      : [])
  );
}

function frame(title: string, generatedBy: string, ...children: any[]) {
  return h(
    Document,
    { title: `TransitOps — ${title}`, author: "TransitOps" },
    h(
      Page,
      { size: "A4", style: styles.page },
      h(
        View,
        { style: styles.brandRow, fixed: true },
        h(
          View,
          null,
          h(Text, { style: styles.brand }, "TransitOps"),
          h(Text, { style: styles.title }, title)
        ),
        h(
          View,
          null,
          h(
            Text,
            { style: styles.meta },
            `Generated ${new Date().toLocaleString("en-IN")}`
          ),
          h(Text, { style: styles.meta }, `Generated by ${generatedBy}`)
        )
      ),
      ...children,
      h(
        View,
        { style: styles.footer, fixed: true },
        h(Text, null, "TransitOps — Smart Transport Operations Platform"),
        h(Text, {
          render: ({
            pageNumber,
            totalPages,
          }: {
            pageNumber: number;
            totalPages: number;
          }) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  );
}

const section = (title: string) =>
  h(Text, { style: styles.sectionTitle }, title);

export async function buildReportPdf(
  report: string,
  generatedBy: string,
  id?: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  if (report === "fleet" || report === "fleet-summary") {
    const [vehicles, trips, fuel, maintenance, expenses] = await Promise.all([
      db.vehicle.findMany({ orderBy: { name: "asc" } }),
      db.trip.findMany(),
      db.fuelLog.findMany(),
      db.maintenanceLog.findMany(),
      db.expense.findMany({ where: { status: "APPROVED" } }),
    ]);
    const completed = trips.filter((t) => t.status === "COMPLETED");
    const cost = operationalCost(
      fuel.reduce((s, f) => s + f.cost, 0),
      maintenance.reduce((s, m) => s + (m.actualCost || 0), 0),
      expenses.reduce((s, e) => s + e.amount, 0)
    );
    const buffer = await renderToBuffer(
      frame(
        "Fleet Summary Report",
        generatedBy,
        h(
          View,
          { style: styles.kpiRow },
          kpi("Fleet utilization", `${fleetUtilization(vehicles)}%`),
          kpi("On-time performance", `${onTimePerformance(trips)}%`),
          kpi("Operational cost", inr(cost)),
          kpi(
            "Fuel efficiency",
            `${fuelEfficiency(
              completed.reduce((s, t) => s + t.plannedDistance, 0),
              fuel.reduce((s, f) => s + f.litres, 0)
            )} km/L`
          )
        ),
        section(`Vehicle registry (${vehicles.length})`),
        table(
          [1.2, 1.4, 0.9, 0.8, 1, 1, 1],
          [
            "Vehicle",
            "Registration",
            "Type",
            "Status",
            "Odometer",
            "Insurance",
            "Fitness",
          ],
          vehicles.map((v) => [
            v.name,
            v.registrationNumber,
            v.type,
            v.status,
            `${v.odometer.toLocaleString("en-IN")} km`,
            dmy(v.insuranceExpiry),
            dmy(v.fitnessExpiry),
          ])
        ),
        section(`Trips (${trips.length})`),
        table(
          [1, 1.6, 0.9, 1, 1],
          ["Trip", "Route", "Status", "Revenue", "Est. margin"],
          trips.map((t) => [
            t.tripNumber,
            `${t.source} - ${t.destination}`,
            t.status,
            inr(t.expectedRevenue),
            inr(t.estimatedMargin),
          ]),
          [
            "Total",
            "",
            "",
            inr(trips.reduce((s, t) => s + t.expectedRevenue, 0)),
            inr(trips.reduce((s, t) => s + t.estimatedMargin, 0)),
          ]
        )
      )
    );
    return { buffer, filename: "transitops-fleet-summary.pdf" };
  }

  if (report === "vehicle-detail") {
    const include = {
      trips: true,
      maintenanceLogs: true,
      fuelLogs: true,
      expenses: true,
    } as const;
    const vehicle = id
      ? await db.vehicle.findUnique({ where: { id }, include })
      : await db.vehicle.findFirst({ include, orderBy: { name: "asc" } });
    if (!vehicle) return null;
    const cost = operationalCost(
      vehicle.fuelLogs.reduce((s, f) => s + f.cost, 0),
      vehicle.maintenanceLogs.reduce((s, m) => s + (m.actualCost || 0), 0),
      vehicle.expenses
        .filter((e) => e.status === "APPROVED")
        .reduce((s, e) => s + e.amount, 0)
    );
    const buffer = await renderToBuffer(
      frame(
        `Vehicle Detail — ${vehicle.name}`,
        generatedBy,
        h(
          View,
          { style: styles.kpiRow },
          kpi("Registration", vehicle.registrationNumber),
          kpi("Status", vehicle.status),
          kpi("Odometer", `${vehicle.odometer.toLocaleString("en-IN")} km`),
          kpi("Operational cost", inr(cost))
        ),
        section("Document validity"),
        table(
          [1.5, 1],
          ["Document", "Expires"],
          [
            ["Insurance", dmy(vehicle.insuranceExpiry)],
            ["Registration", dmy(vehicle.registrationExpiry)],
            ["Pollution certificate", dmy(vehicle.pollutionExpiry)],
            ["Fitness certificate", dmy(vehicle.fitnessExpiry)],
            ["Permit", dmy(vehicle.permitExpiry)],
          ]
        ),
        section(`Trip history (${vehicle.trips.length})`),
        table(
          [1, 1.6, 0.9, 1],
          ["Trip", "Route", "Status", "Revenue"],
          vehicle.trips.map((t) => [
            t.tripNumber,
            `${t.source} - ${t.destination}`,
            t.status,
            inr(t.expectedRevenue),
          ])
        ),
        section(`Maintenance history (${vehicle.maintenanceLogs.length})`),
        table(
          [1.4, 1, 0.9, 1],
          ["Service", "Scheduled", "Status", "Cost"],
          vehicle.maintenanceLogs.map((m) => [
            m.serviceType,
            dmy(m.scheduledDate),
            m.status,
            inr(m.actualCost ?? m.estimatedCost),
          ])
        )
      )
    );
    return {
      buffer,
      filename: `transitops-vehicle-${vehicle.name.toLowerCase()}.pdf`,
    };
  }

  if (report === "trip-completion") {
    const include = {
      vehicle: true,
      driver: true,
      events: { orderBy: { createdAt: "asc" as const } },
    };
    const trip = id
      ? await db.trip.findUnique({ where: { id }, include })
      : await db.trip.findFirst({
          where: { status: "COMPLETED" },
          include,
          orderBy: { actualCompletion: "desc" },
        });
    if (!trip) return null;
    const distance =
      trip.finalOdometer && trip.startingOdometer
        ? trip.finalOdometer - trip.startingOdometer
        : trip.plannedDistance;
    const buffer = await renderToBuffer(
      frame(
        `Trip Completion — ${trip.tripNumber}`,
        generatedBy,
        h(
          View,
          { style: styles.kpiRow },
          kpi("Route", `${trip.source} - ${trip.destination}`),
          kpi("Status", trip.status),
          kpi("Distance", `${distance} km`),
          kpi("Revenue", inr(trip.expectedRevenue))
        ),
        section("Assignment & execution"),
        table(
          [1.5, 1.5],
          ["Field", "Value"],
          [
            ["Vehicle", trip.vehicle?.name ?? "—"],
            ["Driver", trip.driver?.name ?? "—"],
            ["Cargo", `${trip.cargoDescription} (${trip.cargoWeight} kg)`],
            [
              "Planned window",
              `${dmy(trip.plannedStart)} - ${dmy(trip.plannedCompletion)}`,
            ],
            [
              "Actual start",
              trip.actualStart ? trip.actualStart.toLocaleString("en-IN") : "—",
            ],
            [
              "Actual completion",
              trip.actualCompletion
                ? trip.actualCompletion.toLocaleString("en-IN")
                : "—",
            ],
            ["Starting odometer", `${trip.startingOdometer ?? "—"} km`],
            ["Final odometer", `${trip.finalOdometer ?? "—"} km`],
            [
              "Fuel consumed",
              trip.actualFuelConsumed
                ? `${trip.actualFuelConsumed} L (${inr(trip.actualFuelCost)})`
                : "—",
            ],
          ]
        ),
        section("Economics"),
        table(
          [1.5, 1],
          ["Line", "Amount"],
          [
            ["Expected revenue", inr(trip.expectedRevenue)],
            ["Estimated fuel", inr(trip.estimatedFuelCost)],
            ["Estimated tolls", inr(trip.estimatedTollCost)],
            ["Maintenance reserve", inr(trip.estimatedMaintenanceReserve)],
          ],
          ["Estimated margin", inr(trip.estimatedMargin)]
        ),
        section("Event timeline"),
        table(
          [1, 2, 1],
          ["Event", "Detail", "At"],
          trip.events.map((e) => [
            e.type,
            e.message,
            e.createdAt.toLocaleString("en-IN"),
          ])
        )
      )
    );
    return {
      buffer,
      filename: `transitops-${trip.tripNumber.toLowerCase()}.pdf`,
    };
  }

  if (report === "expense-report") {
    const expenses = await db.expense.findMany({
      include: { vehicle: true },
      orderBy: { date: "desc" },
    });
    const approved = expenses.filter((e) => e.status === "APPROVED");
    const byCategory = Object.entries(
      approved.reduce<Record<string, number>>(
        (acc, e) => ({
          ...acc,
          [e.category]: (acc[e.category] || 0) + e.amount,
        }),
        {}
      )
    );
    const buffer = await renderToBuffer(
      frame(
        "Expense Report",
        generatedBy,
        h(
          View,
          { style: styles.kpiRow },
          kpi("Submitted", expenses.length),
          kpi("Approved", approved.length),
          kpi("Pending", expenses.filter((e) => e.status === "PENDING").length),
          kpi("Approved spend", inr(approved.reduce((s, e) => s + e.amount, 0)))
        ),
        section("Approved spend by category"),
        table(
          [1.5, 1],
          ["Category", "Amount"],
          byCategory.map(([c, v]) => [c, inr(v)]),
          ["Total", inr(approved.reduce((s, e) => s + e.amount, 0))]
        ),
        section("All expenses"),
        table(
          [0.9, 1, 1, 0.8, 1.6, 0.8],
          ["Date", "Vehicle", "Category", "Amount", "Description", "Status"],
          expenses.map((e) => [
            dmy(e.date),
            e.vehicle?.name ?? "—",
            e.category,
            inr(e.amount),
            e.description,
            e.status,
          ])
        )
      )
    );
    return { buffer, filename: "transitops-expense-report.pdf" };
  }

  if (report === "compliance-report") {
    const alerts = await db.complianceAlert.findMany({
      orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }],
    });
    const open = alerts.filter((a) => a.status === "OPEN");
    const buffer = await renderToBuffer(
      frame(
        "Compliance Report",
        generatedBy,
        h(
          View,
          { style: styles.kpiRow },
          kpi("Open alerts", open.length),
          kpi("Critical", open.filter((a) => a.severity === "CRITICAL").length),
          kpi("Warnings", open.filter((a) => a.severity === "WARNING").length),
          kpi("Resolved", alerts.length - open.length)
        ),
        section(`Alert register (${alerts.length})`),
        table(
          [0.8, 0.8, 2.4, 0.9, 0.8],
          ["Severity", "Entity", "Message", "Due", "Status"],
          alerts.map((a) => [
            a.severity,
            a.entityType,
            a.message,
            dmy(a.dueDate),
            a.status,
          ])
        )
      )
    );
    return { buffer, filename: "transitops-compliance-report.pdf" };
  }

  return null;
}
