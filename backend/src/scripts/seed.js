/**
 * Quanta Loop — development seed (demo-ready industrial dataset).
 * Usage: npm run seed
 * Optional: SEED_DEMO_PASSWORD=YourPass npm run seed
 */
require("dotenv").config();

const { assertDevelopmentOnly } = require("./utils/guard");
const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");

const { createAdmins, createProviders, createBuyers, DEFAULT_PASSWORD } = require("./factories/user.factory");
const { createMaterials } = require("./factories/material.factory");
const { createInterests } = require("./factories/interest.factory");
const { createConversationsAndMessages } = require("./factories/conversation.factory");
const { createNotifications } = require("./factories/notification.factory");
const { createReminders } = require("./factories/reminder.factory");
const { createReports } = require("./factories/report.factory");
const { createTimelineEvents } = require("./factories/timeline.factory");
const { createSavedMaterials } = require("./factories/saved-material.factory");

async function runSeed() {
  assertDevelopmentOnly();
  const start = Date.now();

  if (process.env.NODE_ENV !== "development") {
    process.stdout.write(
      "Warning: NODE_ENV is not 'development'. Proceeding because guard allows it.\n"
    );
  }

  await connectSeedDatabase();

  process.stdout.write("\n=== Quanta Loop seed ===\n\n");

  process.stdout.write("1/11 Creating admins...\n");
  const admins = await createAdmins(2);

  process.stdout.write("2/11 Creating material providers...\n");
  const providers = await createProviders(18);

  process.stdout.write("3/11 Creating verified buyers...\n");
  const buyers = await createBuyers(18);

  process.stdout.write("4/11 Creating materials...\n");
  const materials = await createMaterials(providers, 80);

  process.stdout.write("5/11 Creating interests (all workflow states)...\n");
  const interests = await createInterests(buyers, materials);

  process.stdout.write("6/11 Creating conversations & messages...\n");
  const { conversations, messages } =
    await createConversationsAndMessages(interests);

  process.stdout.write("7/11 Creating saved opportunities...\n");
  const saved = await createSavedMaterials(buyers, materials);

  process.stdout.write("8/11 Creating notifications...\n");
  const notifications = await createNotifications({
    interests,
    materials,
    buyers,
    providers,
  });

  process.stdout.write("9/11 Creating reminders...\n");
  const reminders = await createReminders({
    interests,
    conversations,
    materials,
    providers,
    buyers,
  });

  process.stdout.write("10/11 Creating reports...\n");
  const reports = await createReports({
    buyers,
    providers,
    materials,
    admins,
  });

  process.stdout.write("11/11 Creating timeline events...\n");
  const timeline = await createTimelineEvents({
    interests,
    materials,
    conversations,
  });

  await disconnectSeedDatabase();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  process.stdout.write("\n=== Seed complete ===\n\n");
  process.stdout.write(`Time: ${elapsed}s\n\n`);
  process.stdout.write("Counts:\n");
  process.stdout.write(`  Admins:         ${admins.length}\n`);
  process.stdout.write(`  Providers:      ${providers.length}\n`);
  process.stdout.write(`  Buyers:         ${buyers.length}\n`);
  process.stdout.write(`  Materials:      ${materials.length}\n`);
  process.stdout.write(`  Interests:      ${interests.length}\n`);
  process.stdout.write(`  Conversations:  ${conversations.length}\n`);
  process.stdout.write(`  Messages:       ${messages.length}\n`);
  process.stdout.write(`  Saved:          ${saved.length}\n`);
  process.stdout.write(`  Notifications:  ${notifications.length}\n`);
  process.stdout.write(`  Reminders:      ${reminders.length}\n`);
  process.stdout.write(`  Reports:        ${reports.length}\n`);
  process.stdout.write(`  Timeline:       ${timeline.length}\n\n`);

  process.stdout.write("Demo login (all @demo.quantaloop.local):\n");
  process.stdout.write(`  Password: ${DEFAULT_PASSWORD}\n\n`);
  process.stdout.write("  Admin:    admin1@demo.quantaloop.local\n");
  process.stdout.write("  Provider: provider1@demo.quantaloop.local … provider18@...\n");
  process.stdout.write("  Buyer:    buyer1@demo.quantaloop.local … buyer18@...\n\n");
  process.stdout.write("UI testing entry points:\n");
  process.stdout.write("  /dashboard — overview, follow-ups, ranked feed\n");
  process.stdout.write("  /dashboard/recommendations — Phase 6 recommendations\n");
  process.stdout.write("  /dashboard/insights — operational insights\n");
  process.stdout.write("  /dashboard/interests — workflow actions (provider)\n");
  process.stdout.write("  /dashboard/conversations — coordination threads\n");
  process.stdout.write("  /admin — reports + verifications\n\n");
}

runSeed().catch((err) => {
  process.stderr.write(`\nSeed failed: ${err.message}\n`);
  if (err.stack) process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
