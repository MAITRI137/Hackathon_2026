import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with roles, permissions, and demo users...');

  // 1. Define Permissions
  const permissionsData = [
    { action: 'read', subject: 'dashboard' },
    { action: 'read', subject: 'vehicles' },
    { action: 'manage', subject: 'vehicles' },
    { action: 'read', subject: 'drivers' },
    { action: 'manage', subject: 'drivers' },
    { action: 'read', subject: 'trips' },
    { action: 'manage', subject: 'trips' },
    { action: 'read', subject: 'maintenance' },
    { action: 'manage', subject: 'maintenance' },
    { action: 'read', subject: 'finance' },
    { action: 'manage', subject: 'finance' },
    { action: 'read', subject: 'reports' },
    { action: 'export', subject: 'reports' },
    { action: 'read', subject: 'compliance' },
    { action: 'manage', subject: 'compliance' },
    { action: 'read', subject: 'settings' },
    { action: 'manage', subject: 'settings' },
    { action: 'manage', subject: 'users' },
    { action: 'manage', subject: 'roles' },
  ];

  // Upsert all permissions
  const permissions = await Promise.all(
    permissionsData.map((p) =>
      prisma.permission.upsert({
        where: { action_subject: { action: p.action, subject: p.subject } },
        update: {},
        create: p,
      })
    )
  );
  console.log(`Ensured ${permissions.length} permissions exist.`);

  // 2. Define Roles and Their Permissions
  const roleDefinitions = [
    {
      slug: 'admin',
      name: 'Administrator',
      permissions: permissionsData, // Admin gets everything
    },
    {
      slug: 'fleet_manager',
      name: 'Fleet Manager',
      permissions: [
        { action: 'read', subject: 'dashboard' },
        { action: 'read', subject: 'vehicles' },
        { action: 'manage', subject: 'vehicles' },
        { action: 'read', subject: 'drivers' },
        { action: 'read', subject: 'trips' },
        { action: 'read', subject: 'maintenance' },
        { action: 'manage', subject: 'maintenance' },
        { action: 'read', subject: 'reports' },
      ],
    },
    {
      slug: 'dispatcher',
      name: 'Dispatcher',
      permissions: [
        { action: 'read', subject: 'dashboard' },
        { action: 'read', subject: 'vehicles' },
        { action: 'read', subject: 'drivers' },
        { action: 'read', subject: 'trips' },
        { action: 'manage', subject: 'trips' },
        { action: 'read', subject: 'maintenance' },
        { action: 'read', subject: 'finance' },
        { action: 'manage', subject: 'finance' },
      ],
    },
    {
      slug: 'safety_officer',
      name: 'Safety Officer',
      permissions: [
        { action: 'read', subject: 'dashboard' },
        { action: 'read', subject: 'drivers' },
        { action: 'manage', subject: 'drivers' },
        { action: 'read', subject: 'compliance' },
        { action: 'manage', subject: 'compliance' },
        { action: 'read', subject: 'reports' },
      ],
    },
    {
      slug: 'financial_analyst',
      name: 'Financial Analyst',
      permissions: [
        { action: 'read', subject: 'dashboard' },
        { action: 'read', subject: 'vehicles' },
        { action: 'read', subject: 'drivers' },
        { action: 'read', subject: 'trips' },
        { action: 'read', subject: 'finance' },
        { action: 'manage', subject: 'finance' },
        { action: 'read', subject: 'reports' },
        { action: 'export', subject: 'reports' },
      ],
    },
    {
      slug: 'driver',
      name: 'Driver',
      permissions: [
        { action: 'read', subject: 'dashboard' },
        { action: 'read', subject: 'trips' },
        { action: 'read', subject: 'finance' },
      ],
    },
  ];

  for (const roleDef of roleDefinitions) {
    // Ensure Role exists
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name },
      create: { slug: roleDef.slug, name: roleDef.name },
    });

    // Resolve Permission IDs for this role
    const rolePermissions = await Promise.all(
      roleDef.permissions.map(async (p) => {
        const perm = await prisma.permission.findUniqueOrThrow({
          where: { action_subject: { action: p.action, subject: p.subject } },
        });
        return perm.id;
      })
    );

    // Delete existing mappings to ensure clean state
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create new mappings
    await prisma.rolePermission.createMany({
      data: rolePermissions.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
    });
  }
  console.log('Roles and permissions seeded.');

  // 3. Create Demo Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    { email: 'admin@transitops.local', name: 'Admin User', roleSlug: 'admin' },
    { email: 'fleet@transitops.local', name: 'Fleet Manager User', roleSlug: 'fleet_manager' },
    { email: 'dispatcher@transitops.local', name: 'Dispatcher User', roleSlug: 'dispatcher' },
    { email: 'safety@transitops.local', name: 'Safety Officer User', roleSlug: 'safety_officer' },
    { email: 'finance@transitops.local', name: 'Financial Analyst User', roleSlug: 'financial_analyst' },
    { email: 'driver@transitops.local', name: 'Driver User', roleSlug: 'driver' },
  ];

  for (const userDef of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { slug: userDef.roleSlug },
    });

    await prisma.user.upsert({
      where: { email: userDef.email },
      update: {
        name: userDef.name,
        roleId: role.id,
        passwordHash, // Reset password to default
        status: 'ACTIVE',
      },
      create: {
        email: userDef.email,
        name: userDef.name,
        roleId: role.id,
        passwordHash,
        status: 'ACTIVE',
      },
    });
  }
  console.log('Demo users seeded.');

  const now = new Date();
  const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000);

  await prisma.tripEvent.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.complianceAlert.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.routeCache.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  await prisma.vehicle.createMany({ data: [
    { registrationNumber: 'MH-12-AB-1234', name: 'Van-05', manufacturer: 'Tata', model: 'Winger', type: 'Van', region: 'West', maxLoadCapacity: 500, odometer: 42000, acquisitionCost: 1450000, acquisitionDate: day(-900), fuelType: 'Diesel', status: 'AVAILABLE', insuranceExpiry: day(180), registrationExpiry: day(300), pollutionExpiry: day(90), fitnessExpiry: day(240), permitExpiry: day(160), notes: 'GPS, AC, first-aid kit' },
    { registrationNumber: 'MH-12-CD-5678', name: 'Truck-02', manufacturer: 'Ashok Leyland', model: 'Dost', type: 'Truck', region: 'West', maxLoadCapacity: 5000, odometer: 192000, acquisitionCost: 2400000, acquisitionDate: day(-1500), fuelType: 'Diesel', status: 'IN_SHOP', insuranceExpiry: day(120), registrationExpiry: day(240), pollutionExpiry: day(25), fitnessExpiry: day(70), permitExpiry: day(100) },
    { registrationNumber: 'MH-12-EF-9012', name: 'MiniVan-01', manufacturer: 'Maruti', model: 'Eeco', type: 'Mini Van', region: 'West', maxLoadCapacity: 300, odometer: 64000, acquisitionCost: 760000, acquisitionDate: day(-700), fuelType: 'Petrol', status: 'AVAILABLE', insuranceExpiry: day(45), registrationExpiry: day(220), pollutionExpiry: day(20), fitnessExpiry: day(130), permitExpiry: day(110) },
    { registrationNumber: 'TS-09-GH-3456', name: 'Truck-09', manufacturer: 'Tata', model: 'Ultra', type: 'Truck', region: 'South', maxLoadCapacity: 7500, odometer: 221000, acquisitionCost: 3200000, acquisitionDate: day(-1800), fuelType: 'Diesel', status: 'ON_TRIP', insuranceExpiry: day(210), registrationExpiry: day(190), pollutionExpiry: day(75), fitnessExpiry: day(120), permitExpiry: day(140) },
    { registrationNumber: 'KA-01-IJ-7890', name: 'Bus-01', manufacturer: 'Eicher', model: 'Skyline', type: 'Bus', region: 'South', maxLoadCapacity: 2500, odometer: 480000, acquisitionCost: 4200000, acquisitionDate: day(-3200), fuelType: 'Diesel', status: 'RETIRED', insuranceExpiry: day(-30), registrationExpiry: day(-10), pollutionExpiry: day(-45), fitnessExpiry: day(-20), permitExpiry: day(-15) },
    { registrationNumber: 'DL-01-KL-1122', name: 'Van-03', manufacturer: 'Force', model: 'Traveller', type: 'Van', region: 'North', maxLoadCapacity: 900, odometer: 83000, acquisitionCost: 1800000, acquisitionDate: day(-1100), fuelType: 'Diesel', status: 'AVAILABLE', insuranceExpiry: day(12), registrationExpiry: day(160), pollutionExpiry: day(50), fitnessExpiry: day(90), permitExpiry: day(120) },
    { registrationNumber: 'GJ-01-MN-3344', name: 'Truck-04', manufacturer: 'Eicher', model: 'Pro', type: 'Truck', region: 'West', maxLoadCapacity: 4200, odometer: 145000, acquisitionCost: 2700000, acquisitionDate: day(-1300), fuelType: 'Diesel', status: 'AVAILABLE', insuranceExpiry: day(250), registrationExpiry: day(310), pollutionExpiry: day(80), fitnessExpiry: day(170), permitExpiry: day(190) },
  ] });

  await prisma.driver.createMany({ data: [
    { name: 'Alex', employeeId: 'EMP-001', licenceNumber: 'DL-1425-2016', licenceCategory: 'LMV', licenceExpiry: day(365), contactNumber: '9876500001', region: 'West', safetyScore: 94, status: 'AVAILABLE', emergencyContact: '9876500101', dateJoined: day(-1200) },
    { name: 'Raj', employeeId: 'EMP-002', licenceNumber: 'KA-9987-2018', licenceCategory: 'HMV', licenceExpiry: day(-30), contactNumber: '9876500002', region: 'West', safetyScore: 68, status: 'AVAILABLE', emergencyContact: '9876500102', dateJoined: day(-900) },
    { name: 'Sam', employeeId: 'EMP-003', licenceNumber: 'TS-7731-2017', licenceCategory: 'HMV', licenceExpiry: day(240), contactNumber: '9876500003', region: 'South', safetyScore: 86, status: 'ON_TRIP', emergencyContact: '9876500103', dateJoined: day(-1500) },
    { name: 'Priya', employeeId: 'EMP-004', licenceNumber: 'MH-3344-2019', licenceCategory: 'LMV', licenceExpiry: day(150), contactNumber: '9876500004', region: 'West', safetyScore: 76, status: 'SUSPENDED', emergencyContact: '9876500104', dateJoined: day(-800) },
    { name: 'Neha', employeeId: 'EMP-005', licenceNumber: 'TG-7788-2020', licenceCategory: 'LMV', licenceExpiry: day(15), contactNumber: '9876500005', region: 'South', safetyScore: 64, status: 'OFF_DUTY', emergencyContact: '9876500105', dateJoined: day(-600) },
    { name: 'Suresh', employeeId: 'EMP-006', licenceNumber: 'DL-5546-2017', licenceCategory: 'HMV', licenceExpiry: day(190), contactNumber: '9876500006', region: 'North', safetyScore: 82, status: 'AVAILABLE', emergencyContact: '9876500106', dateJoined: day(-1400) },
  ] });

  const vehicles = Object.fromEntries((await prisma.vehicle.findMany()).map((v) => [v.name, v]));
  const drivers = Object.fromEntries((await prisma.driver.findMany()).map((d) => [d.name, d]));
  await prisma.trip.createMany({ data: [
    { tripNumber: 'TRP-1024', source: 'Delhi', destination: 'Jaipur', sourceLat: 28.6139, sourceLng: 77.209, destinationLat: 26.9124, destinationLng: 75.7873, plannedStart: day(2), plannedCompletion: day(3), vehicleId: vehicles['Van-03'].id, driverId: drivers['Suresh'].id, cargoDescription: 'Medical supplies', cargoWeight: 600, plannedDistance: 280, estimatedDuration: 330, expectedRevenue: 36500, estimatedFuelCost: 9100, estimatedTollCost: 1200, estimatedMaintenanceReserve: 1400, estimatedMargin: 24800, status: 'DRAFT' },
    { tripNumber: 'TRP-1025', source: 'Hyderabad', destination: 'Vijayawada', sourceLat: 17.385, sourceLng: 78.4867, destinationLat: 16.5062, destinationLng: 80.648, plannedStart: day(-1), plannedCompletion: day(1), vehicleId: vehicles['Truck-09'].id, driverId: drivers['Sam'].id, cargoDescription: 'Industrial goods', cargoWeight: 4200, plannedDistance: 275, estimatedDuration: 340, startingOdometer: 221000, expectedRevenue: 58000, estimatedFuelCost: 14800, estimatedTollCost: 2100, estimatedMaintenanceReserve: 2600, estimatedMargin: 38500, actualStart: day(-1), status: 'DISPATCHED' },
    { tripNumber: 'TRP-1023', source: 'Bengaluru', destination: 'Mysuru', sourceLat: 12.9716, sourceLng: 77.5946, destinationLat: 12.2958, destinationLng: 76.6394, plannedStart: day(-8), plannedCompletion: day(-7), vehicleId: vehicles['Van-05'].id, driverId: drivers['Alex'].id, cargoDescription: 'Retail stock', cargoWeight: 350, plannedDistance: 145, estimatedDuration: 190, startingOdometer: 41800, finalOdometer: 41948, expectedRevenue: 21000, estimatedFuelCost: 4200, estimatedTollCost: 600, estimatedMaintenanceReserve: 740, estimatedMargin: 15460, actualFuelConsumed: 23, actualFuelCost: 2420, actualStart: day(-8), actualCompletion: day(-7), status: 'COMPLETED' },
    { tripNumber: 'TRP-1022', source: 'Mumbai', destination: 'Surat', sourceLat: 19.076, sourceLng: 72.8777, destinationLat: 21.1702, destinationLng: 72.8311, plannedStart: day(-4), plannedCompletion: day(-3), cargoDescription: 'Textiles', cargoWeight: 900, plannedDistance: 285, estimatedDuration: 360, expectedRevenue: 30000, cancellationReason: 'Customer rescheduled', status: 'CANCELLED' },
  ] });

  await prisma.maintenanceLog.createMany({ data: [
    { vehicleId: vehicles['Truck-02'].id, serviceType: 'Engine repair', description: 'Injector and cooling system service', scheduledDate: day(-2), startedDate: day(-1), odometer: 192000, vendor: 'Metro Fleet Care', technician: 'Ravi Kumar', estimatedCost: 18000, priority: 'HIGH', status: 'IN_PROGRESS' },
    { vehicleId: vehicles['Van-03'].id, serviceType: 'Scheduled service', description: 'Oil and filter change', scheduledDate: day(5), odometer: 83000, vendor: 'North Hub Workshop', estimatedCost: 5200, priority: 'MEDIUM', status: 'SCHEDULED' },
    { vehicleId: vehicles['Truck-04'].id, serviceType: 'Tyre replacement', description: 'Rear axle tyres', scheduledDate: day(-20), startedDate: day(-20), completedDate: day(-19), odometer: 144500, vendor: 'Highway Tyres', technician: 'Amit', estimatedCost: 32000, actualCost: 30800, priority: 'MEDIUM', status: 'COMPLETED' },
  ] });

  const completedTrip = await prisma.trip.findUniqueOrThrow({ where: { tripNumber: 'TRP-1023' } });
  await prisma.fuelLog.createMany({ data: [
    { vehicleId: vehicles['Van-05'].id, tripId: completedTrip.id, date: day(-7), litres: 23, cost: 2420, odometer: 41948, fuelStation: 'Bharat Petroleum', enteredById: drivers['Alex'].id },
    { vehicleId: vehicles['Truck-04'].id, date: day(-3), litres: 82, cost: 8610, odometer: 145000, fuelStation: 'Indian Oil' },
  ] });
  await prisma.expense.createMany({ data: [
    { vehicleId: vehicles['Van-05'].id, tripId: completedTrip.id, category: 'Toll', amount: 620, date: day(-7), description: 'Bengaluru-Mysuru tolls', status: 'APPROVED', approvedAt: day(-6) },
    { vehicleId: vehicles['Truck-02'].id, category: 'Repair', amount: 18000, date: day(-1), description: 'Engine repair estimate', status: 'PENDING' },
    { vehicleId: vehicles['Bus-01'].id, category: 'Fine', amount: 2500, date: day(-30), description: 'Legacy parking fine', status: 'REJECTED' },
  ] });

  await prisma.complianceAlert.createMany({ data: [
    { severity: 'CRITICAL', entityType: 'Driver', entityId: drivers['Raj'].id, message: 'Raj cannot be assigned because his licence has expired.', dueDate: drivers['Raj'].licenceExpiry },
    { severity: 'WARNING', entityType: 'Driver', entityId: drivers['Neha'].id, message: 'Neha\'s licence expires within 30 days.', dueDate: drivers['Neha'].licenceExpiry },
    { severity: 'WARNING', entityType: 'Vehicle', entityId: vehicles['Van-03'].id, message: 'Van-03 insurance expires within 30 days.', dueDate: vehicles['Van-03'].insuranceExpiry },
  ] });
  await prisma.routeCache.createMany({ data: [
    { source: 'Mumbai', destination: 'Pune', distanceKm: 148, durationMinutes: 190, polylineJson: JSON.stringify([[19.076,72.8777],[18.75,73.2],[18.5204,73.8567]]), isFallback: true },
    { source: 'Delhi', destination: 'Jaipur', distanceKm: 280, durationMinutes: 330, polylineJson: JSON.stringify([[28.6139,77.209],[27.7,76.6],[26.9124,75.7873]]), isFallback: true },
  ] });
  await prisma.emailOutbox.create({ data: { recipient: 'safety@transitops.local', subject: 'TransitOps compliance reminders', body: 'Raj: licence expired. Neha: licence expires soon.', status: 'SENT', sentAt: now } });
  await prisma.auditLog.createMany({ data: [
    { action: 'SEED', entityType: 'System', details: 'Deterministic TransitOps demo data generated.' },
    { action: 'DISPATCH', entityType: 'Trip', entityId: (await prisma.trip.findUniqueOrThrow({ where: { tripNumber: 'TRP-1025' } })).id, details: 'Truck-09 and Sam assigned atomically.' },
  ] });
  console.log('Operational demo data seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
