/**
 * Wipe Quanta Loop seed collections (development only).
 * Usage: SEED_CONFIRM=YES npm run clear
 *    or: npm run clear -- --force
 */
require("dotenv").config();

const { assertDevelopmentOnly, assertClearConfirmed } = require("./utils/guard");
const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");

const { Message } = require("../modules/messages/message.model");
const { TimelineEvent } = require("../modules/timeline/timeline.model");
const { Reminder } = require("../modules/reminders/reminder.model");
const { Notification } = require("../modules/notifications/notification.model");
const { Report } = require("../modules/reports/report.model");
const { SavedMaterial } = require("../modules/saved-materials/saved-material.model");
const { Conversation } = require("../modules/conversations/conversation.model");
const { Interest } = require("../modules/interests/interest.model");
const { Material } = require("../modules/materials/material.model");
const { User } = require("../modules/users/user.model");

const COLLECTIONS = [
  { name: "messages", model: Message },
  { name: "timelineevents", model: TimelineEvent },
  { name: "reminders", model: Reminder },
  { name: "notifications", model: Notification },
  { name: "reports", model: Report },
  { name: "savedmaterials", model: SavedMaterial },
  { name: "conversations", model: Conversation },
  { name: "interests", model: Interest },
  { name: "materials", model: Material },
  { name: "users", model: User },
];

async function clearAll() {
  assertDevelopmentOnly();
  assertClearConfirmed();

  await connectSeedDatabase();

  for (const { name, model } of COLLECTIONS) {
    const result = await model.deleteMany({});
    process.stdout.write(`Cleared ${name}: ${result.deletedCount} documents\n`);
  }

  await disconnectSeedDatabase();
  process.stdout.write("Done.\n");
}

clearAll().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
