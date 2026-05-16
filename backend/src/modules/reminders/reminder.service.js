const mongoose = require("mongoose");

const { Interest } = require("../interests/interest.model");
const { Conversation } = require("../conversations/conversation.model");
const { Message } = require("../messages/message.model");
const { Material } = require("../materials/material.model");
const { SavedMaterial } = require("../saved-materials/saved-material.model");
const { Notification } = require("../notifications/notification.model");
const { createNotification } = require("../notifications/notification.service");
const { Reminder, toPublicReminder } = require("./reminder.model");

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

async function upsertReminder(params) {
  const userId = new mongoose.Types.ObjectId(params.userId);
  const doc = await Reminder.findOneAndUpdate(
    { user: userId, dedupeKey: params.dedupeKey },
    {
      $set: {
        type: params.type,
        title: params.title,
        message: params.message,
        priority: params.priority ?? "medium",
        relatedMaterial: params.relatedMaterial ?? null,
        relatedInterest: params.relatedInterest ?? null,
        relatedConversation: params.relatedConversation ?? null,
        dueAt: params.dueAt ?? null,
        status: "open",
      },
    },
    { upsert: true, new: true }
  );
  return doc;
}

/**
 * On-demand reminder sync (no cron). Call when listing reminders.
 */
async function syncRemindersForUser(userId, role) {
  const uid = new mongoose.Types.ObjectId(userId);
  const now = Date.now();

  if (role === "material_provider") {
    const pending = await Interest.find({
      provider: uid,
      status: "pending",
      createdAt: { $lte: new Date(now - 48 * MS_HOUR) },
    })
      .populate("material", "title")
      .populate("buyer", "companyName")
      .limit(20)
      .lean();

    for (const row of pending) {
      const key = `response:${row._id}`;
      await upsertReminder({
        userId,
        dedupeKey: key,
        type: "response_reminder",
        title: "Pending interest awaiting response",
        message: `${row.buyer?.companyName ?? "A buyer"} is waiting on your decision for “${row.material?.title ?? "a material"}”.`,
        priority: "high",
        relatedMaterial: row.material?._id ?? row.material,
        relatedInterest: row._id,
      });

      await maybeNotifyOnce({
        recipient: userId,
        dedupeKey: `notif:${key}`,
        type: "response_reminder",
        title: "Interest awaiting your response",
        message: `An interest on “${row.material?.title ?? "a listing"}” has been pending for over 48 hours.`,
        relatedMaterial: row.material?._id ?? row.material,
        relatedInterest: row._id,
      });
    }

    const stalled = await Interest.find({
      provider: uid,
      status: { $in: ["accepted", "discussion"] },
      updatedAt: { $lte: new Date(now - 5 * MS_DAY) },
    })
      .populate("material", "title")
      .limit(15)
      .lean();

    for (const row of stalled) {
      await upsertReminder({
        userId,
        dedupeKey: `pending_opp:${row._id}`,
        type: "pending_opportunity",
        title: "Opportunity coordination may be stalled",
        message: `Workflow on “${row.material?.title ?? "a material"}” has not progressed recently.`,
        priority: "medium",
        relatedMaterial: row.material?._id ?? row.material,
        relatedInterest: row._id,
      });
    }
  }

  if (role === "verified_buyer") {
    const convs = await Conversation.find({
      buyer: uid,
      status: "active",
    })
      .populate("material", "title")
      .limit(30)
      .lean();

    for (const c of convs) {
      const lastAt = c.lastMessageAt
        ? new Date(c.lastMessageAt).getTime()
        : new Date(c.createdAt).getTime();
      if (now - lastAt < 72 * MS_HOUR) continue;

      const lastMsg = await Message.findOne({ conversation: c._id })
        .sort({ createdAt: -1 })
        .select("sender createdAt")
        .lean();
      const buyerNeedsReply =
        lastMsg && lastMsg.sender?.toString() !== userId;

      if (buyerNeedsReply || !lastMsg) {
        await upsertReminder({
          userId,
          dedupeKey: `inactive_conv:${c._id}`,
          type: "inactive_conversation",
          title: "Coordination thread awaiting follow-up",
          message: `The thread for “${c.material?.title ?? "a material"}” has been quiet — consider aligning on next steps.`,
          priority: "medium",
          relatedMaterial: c.material?._id ?? c.material,
          relatedConversation: c._id,
        });
      }
    }

    const saved = await SavedMaterial.find({ buyer: uid })
      .populate("material", "title updatedAt status")
      .lean();

    const weekAgo = new Date(now - 7 * MS_DAY);
    for (const s of saved) {
      const m = s.material;
      if (!m || typeof m !== "object") continue;
      if (new Date(m.updatedAt) < weekAgo) continue;
      if (!["available", "active", "in_discussion"].includes(m.status)) continue;

      await upsertReminder({
        userId,
        dedupeKey: `saved_update:${m._id}`,
        type: "saved_material_update",
        title: "Saved opportunity became active again",
        message: `“${m.title}” was recently updated on the network.`,
        priority: "low",
        relatedMaterial: m._id,
      });

      await maybeNotifyOnce({
        recipient: userId,
        dedupeKey: `notif:saved_update:${m._id}`,
        type: "saved_opportunity_active",
        title: "Saved opportunity updated",
        message: `A material on your watch list — “${m.title}” — was recently updated.`,
        relatedMaterial: m._id,
        relatedInterest: null,
      });
    }
  }
}

async function maybeNotifyOnce(params) {
  const q = {
    recipient: params.recipient,
    type: params.type,
    createdAt: { $gte: new Date(Date.now() - 7 * MS_DAY) },
  };
  if (params.relatedMaterial) {
    q.relatedMaterial = params.relatedMaterial;
  }
  const existing = await Notification.findOne(q).select("_id").lean();
  if (existing) return;

  await createNotification({
    recipient: params.recipient,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedMaterial: params.relatedMaterial ?? null,
    relatedInterest: params.relatedInterest ?? null,
  });
}

async function listRemindersForUser(userId) {
  const docs = await Reminder.find({ user: userId, status: "open" })
    .sort({ priority: -1, updatedAt: -1 })
    .limit(50)
    .lean();
  return docs.map((d) => toPublicReminder(d));
}

async function dismissReminder(userId, reminderId) {
  const doc = await Reminder.findOneAndUpdate(
    { _id: reminderId, user: userId },
    { $set: { status: "dismissed" } },
    { new: true }
  );
  return doc ? toPublicReminder(doc) : null;
}

module.exports = {
  syncRemindersForUser,
  listRemindersForUser,
  dismissReminder,
};
