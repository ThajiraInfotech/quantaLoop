const { TimelineEvent } = require("../../modules/timeline/timeline.model");
const { pickBetween } = require("../utils/dates");

async function appendEvent(list, params) {
  const createdAt = params.createdAt ?? pickBetween(25, 0);
  const doc = await TimelineEvent.create({
    type: params.type,
    summary: params.summary,
    actor: params.actor ?? null,
    material: params.material ?? null,
    interest: params.interest ?? null,
    conversation: params.conversation ?? null,
    audienceUsers: params.audienceUsers,
    meta: params.meta,
  });
  await TimelineEvent.collection.updateOne(
    { _id: doc._id },
    { $set: { createdAt } }
  );
  list.push(doc);
}

function audience(providerId, buyerId) {
  return [providerId, buyerId];
}

async function createTimelineEvents({ interests, materials, conversations }) {
  const events = [];

  for (const interest of interests) {
    const mat = materials.find(
      (m) => m._id.toString() === interest.material.toString()
    );
    const title = mat?.title ?? "material";
    const aud = audience(interest.provider, interest.buyer);

    await appendEvent(events, {
      type: "interest_received",
      summary: `Interest received for “${title}”.`,
      actor: interest.buyer,
      material: interest.material,
      interest: interest._id,
      audienceUsers: aud,
      createdAt: interest.createdAt,
    });

    if (interest.status !== "pending") {
      const accepted = !["pending", "rejected"].includes(interest.status);
      await appendEvent(events, {
        type: accepted ? "interest_accepted" : "interest_rejected",
        summary: accepted
          ? `Interest accepted for “${title}”.`
          : `Interest declined for “${title}”.`,
        actor: interest.provider,
        material: interest.material,
        interest: interest._id,
        audienceUsers: aud,
        createdAt: interest.updatedAt,
      });
    }

    if (interest.conversation) {
      await appendEvent(events, {
        type: "discussion_opened",
        summary: "Operational coordination thread opened.",
        actor: interest.provider,
        material: interest.material,
        interest: interest._id,
        conversation: interest.conversation,
        audienceUsers: aud,
      });
    }

    const workflowMap = {
      discussion: "workflow_discussion",
      pickup_scheduled: "workflow_pickup_scheduled",
      completed: "workflow_completed",
      closed: "workflow_closed",
    };
    if (workflowMap[interest.status]) {
      await appendEvent(events, {
        type: workflowMap[interest.status],
        summary: `Opportunity status: ${interest.status.replace(/_/g, " ")}.`,
        actor: interest.provider,
        material: interest.material,
        interest: interest._id,
        conversation: interest.conversation ?? null,
        audienceUsers: aud,
        meta: { status: interest.status },
      });
    }
  }

  for (const conv of conversations.slice(0, 15)) {
    const interest = interests.find(
      (i) => i.conversation?.toString() === conv._id.toString()
    );
    if (!interest) continue;
    await appendEvent(events, {
      type: "message_posted",
      summary: "Coordination message posted in private thread.",
      actor: interest.buyer,
      material: conv.material,
      interest: interest._id,
      conversation: conv._id,
      audienceUsers: audience(interest.provider, interest.buyer),
    });
  }

  return events;
}

module.exports = { createTimelineEvents };
