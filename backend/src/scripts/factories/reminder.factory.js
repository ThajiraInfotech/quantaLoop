const { Reminder } = require("../../modules/reminders/reminder.model");
const { pick, pickN } = require("../utils/random");
const { daysAgo } = require("../utils/dates");

async function createReminders({ interests, conversations, materials, providers, buyers }) {
  const reminders = [];

  const stalePending = interests.filter((i) => i.status === "pending");
  for (const interest of stalePending.slice(0, 8)) {
    const mat = materials.find(
      (m) => m._id.toString() === interest.material.toString()
    );
    reminders.push(
      await seedReminder({
        user: interest.provider,
        dedupeKey: `response:${interest._id}`,
        type: "response_reminder",
        title: "Pending interest awaiting response",
        message: `A buyer is waiting on your decision for “${mat?.title ?? "a material"}”.`,
        priority: "high",
        relatedMaterial: interest.material,
        relatedInterest: interest._id,
        createdAt: daysAgo(1),
      })
    );
  }

  const stalled = interests.filter((i) =>
    ["accepted", "discussion"].includes(i.status)
  );
  for (const interest of stalled.slice(0, 6)) {
    const mat = materials.find(
      (m) => m._id.toString() === interest.material.toString()
    );
    reminders.push(
      await seedReminder({
        user: interest.provider,
        dedupeKey: `pending_opp:${interest._id}`,
        type: "pending_opportunity",
        title: "Opportunity coordination may be stalled",
        message: `Workflow on “${mat?.title ?? "a material"}” has not progressed recently.`,
        priority: "medium",
        relatedMaterial: interest.material,
        relatedInterest: interest._id,
        createdAt: daysAgo(2),
      })
    );
  }

  for (const conv of conversations.slice(0, 5)) {
    const mat = materials.find(
      (m) => m._id.toString() === conv.material.toString()
    );
    reminders.push(
      await seedReminder({
        user: conv.buyer,
        dedupeKey: `inactive_conv:${conv._id}`,
        type: "inactive_conversation",
        title: "Coordination thread awaiting follow-up",
        message: `The thread for “${mat?.title ?? "a material"}” has been quiet — align on next steps.`,
        priority: "medium",
        relatedMaterial: conv.material,
        relatedConversation: conv._id,
        createdAt: daysAgo(1),
      })
    );
  }

  const savedMats = pickN(
    materials.filter((m) => m.visibility === "network"),
    Math.min(8, materials.length)
  );
  for (const mat of savedMats) {
    const buyer = pick(buyers);
    reminders.push(
      await seedReminder({
        user: buyer._id,
        dedupeKey: `saved_update:${mat._id}`,
        type: "saved_material_update",
        title: "Saved opportunity became active again",
        message: `“${mat.title}” was recently updated on the network.`,
        priority: "low",
        relatedMaterial: mat._id,
        createdAt: daysAgo(0),
      })
    );
  }

  return reminders;
}

async function seedReminder(params) {
  const doc = await Reminder.create({
    user: params.user,
    type: params.type,
    title: params.title,
    message: params.message,
    status: "open",
    priority: params.priority,
    relatedMaterial: params.relatedMaterial ?? null,
    relatedInterest: params.relatedInterest ?? null,
    relatedConversation: params.relatedConversation ?? null,
    dedupeKey: params.dedupeKey,
    dueAt: null,
  });
  await Reminder.collection.updateOne(
    { _id: doc._id },
    {
      $set: {
        createdAt: params.createdAt,
        updatedAt: params.createdAt,
      },
    }
  );
  return doc;
}

module.exports = { createReminders };
