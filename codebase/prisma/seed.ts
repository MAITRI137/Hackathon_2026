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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
