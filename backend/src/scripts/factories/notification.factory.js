const { Notification } = require("../../modules/notifications/notification.model");
const { pick, chance } = require("../utils/random");
const { pickBetween } = require("../utils/dates");

async function createNotifications({ interests, materials, buyers, providers }) {
  const notifications = [];

  for (const interest of interests) {
    const mat = materials.find(
      (m) => m._id.toString() === interest.material.toString()
    );
    const title = mat?.title ?? "a material";

    await pushNotif(notifications, {
      recipient: interest.provider,
      type: "interest_received",
      title: "Interest received",
      message: `A buyer signalled fit for “${title}”.`,
      relatedMaterial: interest.material,
      relatedInterest: interest._id,
      read: chance(0.3),
    });

    if (interest.status === "accepted") {
      await pushNotif(notifications, {
        recipient: interest.buyer,
        type: "interest_accepted",
        title: "Interest accepted",
        message: `Your interest in “${title}” was accepted.`,
        relatedMaterial: interest.material,
        relatedInterest: interest._id,
        read: chance(0.4),
      });
    }
    if (interest.status === "rejected") {
      await pushNotif(notifications, {
        recipient: interest.buyer,
        type: "interest_rejected",
        title: "Interest declined",
        message: `Your interest in “${title}” was not progressed.`,
        relatedMaterial: interest.material,
        relatedInterest: interest._id,
        read: true,
      });
    }
    if (["discussion", "pickup_scheduled", "completed", "closed"].includes(interest.status)) {
      await pushNotif(notifications, {
        recipient: interest.buyer,
        type: "interest_workflow_update",
        title: "Opportunity status updated",
        message: `Operational status for “${title}” is now ${interest.status.replace(/_/g, " ")}.`,
        relatedMaterial: interest.material,
        relatedInterest: interest._id,
        read: chance(0.5),
      });
    }
  }

  for (const buyer of buyers.slice(0, 10)) {
    const mat = pick(materials.filter((m) => m.visibility === "network"));
    if (!mat) continue;
    await pushNotif(notifications, {
      recipient: buyer._id,
      type: "new_matching_material",
      title: "New opportunity aligned to your mandate",
      message: `“${mat.title}” may fit your sourcing profile.`,
      relatedMaterial: mat._id,
      relatedInterest: null,
      read: chance(0.6),
    });
  }

  const stalePending = interests.filter((i) => i.status === "pending");
  for (const interest of stalePending.slice(0, 4)) {
    const mat = materials.find(
      (m) => m._id.toString() === interest.material.toString()
    );
    await pushNotif(notifications, {
      recipient: interest.provider,
      type: "response_reminder",
      title: "Interest awaiting your response",
      message: `An interest on “${mat?.title ?? "a listing"}” requires a decision.`,
      relatedMaterial: interest.material,
      relatedInterest: interest._id,
      read: false,
    });
  }

  for (const buyer of buyers.slice(0, 6)) {
    await pushNotif(notifications, {
      recipient: buyer._id,
      type: "saved_opportunity_active",
      title: "Saved opportunity updated",
      message: "A material on your watch list was recently updated on the network.",
      relatedMaterial: pick(materials)?._id ?? null,
      relatedInterest: null,
      read: chance(0.5),
    });
  }

  for (const provider of providers.slice(0, 4)) {
    await pushNotif(notifications, {
      recipient: provider._id,
      type: "relevant_category_activity",
      title: "Category activity on the network",
      message: "Recovery activity in your material categories increased this week.",
      relatedMaterial: null,
      relatedInterest: null,
      read: true,
    });
  }

  return notifications;
}

async function pushNotif(list, params) {
  const createdAt = pickBetween(14, 0);
  const doc = await Notification.create({
    recipient: params.recipient,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedMaterial: params.relatedMaterial ?? null,
    relatedInterest: params.relatedInterest ?? null,
    isRead: params.read ?? false,
  });
  await Notification.collection.updateOne(
    { _id: doc._id },
    { $set: { createdAt, updatedAt: createdAt } }
  );
  list.push(doc);
}

module.exports = { createNotifications };
