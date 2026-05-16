const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Conversation } = require("../conversations/conversation.model");
const { buyerCanAccessMaterial } = require("../materials/material-access");
const { Material } = require("../materials/material.model");
const { createNotification } = require("../notifications/notification.service");
const { appendTimelineEvent } = require("../timeline/timeline.service");
const { Interest, toPublicInterest } = require("./interest.model");
const {
  safeParseCreate,
  safeParseStatus,
  safeParseWorkflow,
} = require("./interest.validation");

const WORKFLOW_FROM = {
  accepted: ["discussion", "closed"],
  discussion: ["pickup_scheduled", "closed"],
  pickup_scheduled: ["completed", "closed"],
  completed: ["closed"],
};

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function audiencePair(providerId, buyerId) {
  return [providerId.toString(), buyerId.toString()];
}

async function syncMaterialWithInterestStatus(materialDoc, nextStatus) {
  if (!materialDoc) return;
  const s = materialDoc.status;
  switch (nextStatus) {
    case "discussion":
    case "pickup_scheduled":
      if (["available", "active", "in_discussion"].includes(s)) {
        materialDoc.status = "in_discussion";
        await materialDoc.save();
      }
      break;
    case "completed":
      materialDoc.status = "fulfilled";
      await materialDoc.save();
      break;
    case "closed":
      if (!["archived", "inactive", "fulfilled"].includes(s)) {
        materialDoc.status = "available";
        await materialDoc.save();
      }
      break;
    default:
      break;
  }
}

const createInterest = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "verified_buyer") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const { materialId, message, pickupTimeline } = parsed.data;

  const material = await Material.findById(materialId).populate(
    "provider",
    "companyName name email"
  );
  if (!material) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId =
    material.provider?._id?.toString?.() ?? material.provider?.toString?.();
  if (providerId === req.user.id) {
    next(
      new AppError(
        "You cannot express interest on your own material",
        400,
        "INVALID_SELF_INTEREST"
      )
    );
    return;
  }

  if (!buyerCanAccessMaterial(material, req.user.id)) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const existing = await Interest.findOne({
    material: material._id,
    buyer: req.user.id,
  });
  if (existing) {
    next(
      new AppError(
        "Interest already recorded for this material",
        409,
        "DUPLICATE_INTEREST"
      )
    );
    return;
  }

  const interest = await Interest.create({
    material: material._id,
    buyer: req.user.id,
    provider: providerId,
    message,
    pickupTimeline,
    status: "pending",
  });

  const populated = await Interest.findById(interest._id)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status");

  await createNotification({
    recipient: providerId,
    type: "interest_received",
    title: "New interest on your material",
    message: `${populated.buyer?.companyName ?? "A buyer"} signaled interest on "${material.title}".`,
    relatedMaterial: material._id,
    relatedInterest: interest._id,
  });

  await appendTimelineEvent({
    type: "interest_received",
    summary: `Interest received on “${material.title}”.`,
    actor: req.user.id,
    material: material._id,
    interest: interest._id,
    audienceUserIds: audiencePair(providerId, req.user.id),
  });

  sendSuccess(
    res,
    { interest: toPublicInterest(populated) },
    "Interest recorded",
    201
  );
});

const listMyInterests = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  let query = Interest.find();

  if (role === "material_provider") {
    query = query.where({ provider: userId });
  } else if (role === "verified_buyer") {
    query = query.where({ buyer: userId });
  }

  const docs = await query
    .sort({ updatedAt: -1 })
    .limit(200)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status")
    .exec();

  const items = docs.map((d) => toPublicInterest(d));
  sendSuccess(res, { items }, "Interests retrieved");
});

const getMyInterestForMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  if (req.user.role !== "verified_buyer") {
    sendSuccess(res, { interest: null }, "");
    return;
  }

  const interest = await Interest.findOne({
    material: materialId,
    buyer: req.user.id,
  })
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status");

  sendSuccess(
    res,
    { interest: interest ? toPublicInterest(interest) : null },
    ""
  );
});

const updateInterestStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid interest id", 400, "INVALID_ID"));
    return;
  }

  if (req.user.role !== "material_provider" && req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseStatus(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const interest = await Interest.findById(id).populate(
    "material",
    "title provider status"
  );
  if (!interest) {
    next(new AppError("Interest not found", 404, "NOT_FOUND"));
    return;
  }

  const providerOnInterest = interest.provider.toString();
  if (
    req.user.role === "material_provider" &&
    providerOnInterest !== req.user.id
  ) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  if (interest.status !== "pending") {
    next(new AppError("Interest is no longer pending", 400, "INVALID_STATE"));
    return;
  }

  interest.status = parsed.data.status;

  if (parsed.data.status === "accepted") {
    const conv = await Conversation.create({
      material: interest.material._id ?? interest.material,
      interest: interest._id,
      provider: interest.provider,
      buyer: interest.buyer,
      status: "active",
      lastMessageAt: null,
    });
    interest.conversation = conv._id;
  }

  await interest.save();

  const materialDoc = await Material.findById(interest.material?._id ?? interest.material);
  if (parsed.data.status === "accepted" && materialDoc) {
    await appendTimelineEvent({
      type: "interest_accepted",
      summary: `Interest accepted — coordination thread opened for “${interest.material?.title ?? "material"}”.`,
      actor: req.user.id,
      material: interest.material?._id ?? interest.material,
      interest: interest._id,
      conversation: interest.conversation,
      audienceUserIds: audiencePair(interest.provider, interest.buyer),
    });
    await appendTimelineEvent({
      type: "discussion_opened",
      summary: "Operational coordination thread is available.",
      actor: req.user.id,
      material: interest.material?._id ?? interest.material,
      interest: interest._id,
      conversation: interest.conversation,
      audienceUserIds: audiencePair(interest.provider, interest.buyer),
    });
  }

  if (parsed.data.status === "rejected") {
    await appendTimelineEvent({
      type: "interest_rejected",
      summary: `Interest declined for “${interest.material?.title ?? "material"}”.`,
      actor: req.user.id,
      material: interest.material?._id ?? interest.material,
      interest: interest._id,
      audienceUserIds: audiencePair(interest.provider, interest.buyer),
    });
  }

  const populated = await Interest.findById(interest._id)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status")
    .populate("conversation");

  const notifType =
    parsed.data.status === "accepted"
      ? "interest_accepted"
      : "interest_rejected";
  const title =
    parsed.data.status === "accepted"
      ? "Interest accepted"
      : "Interest declined";

  await createNotification({
    recipient: interest.buyer,
    type: notifType,
    title,
    message: `Your interest in "${interest.material?.title ?? "a material"}" was ${parsed.data.status}.`,
    relatedMaterial: interest.material?._id ?? interest.material,
    relatedInterest: interest._id,
  });

  sendSuccess(res, { interest: toPublicInterest(populated) }, "Interest updated");
});

const patchInterestWorkflow = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid interest id", 400, "INVALID_ID"));
    return;
  }

  if (req.user.role !== "material_provider" && req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseWorkflow(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const nextStatus = parsed.data.status;
  const interest = await Interest.findById(id).populate(
    "material",
    "title provider status"
  );
  if (!interest) {
    next(new AppError("Interest not found", 404, "NOT_FOUND"));
    return;
  }

  const providerOnInterest = interest.provider.toString();
  if (
    req.user.role === "material_provider" &&
    providerOnInterest !== req.user.id
  ) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const allowed = WORKFLOW_FROM[interest.status];
  if (!allowed || !allowed.includes(nextStatus)) {
    next(
      new AppError(
        "Invalid workflow transition for current opportunity state",
        400,
        "INVALID_WORKFLOW"
      )
    );
    return;
  }

  interest.status = nextStatus;
  await interest.save();

  const materialDoc = await Material.findById(
    interest.material?._id ?? interest.material
  );
  await syncMaterialWithInterestStatus(materialDoc, nextStatus);

  const typeMap = {
    discussion: "workflow_discussion",
    pickup_scheduled: "workflow_pickup_scheduled",
    completed: "workflow_completed",
    closed: "workflow_closed",
  };
  const summaryMap = {
    discussion: "Opportunity moved into active operational discussion.",
    pickup_scheduled: "Pickup or handoff timing is being coordinated.",
    completed: "Opportunity marked complete from an operations standpoint.",
    closed: "Opportunity thread closed.",
  };

  await appendTimelineEvent({
    type: typeMap[nextStatus],
    summary: summaryMap[nextStatus],
    actor: req.user.id,
    material: interest.material?._id ?? interest.material,
    interest: interest._id,
    conversation: interest.conversation ?? undefined,
    audienceUserIds: audiencePair(interest.provider, interest.buyer),
    meta: { status: nextStatus },
  });

  await createNotification({
    recipient: interest.buyer,
    type: "interest_workflow_update",
    title: "Opportunity status update",
    message: `${summaryMap[nextStatus]} (“${interest.material?.title ?? "material"}”).`,
    relatedMaterial: interest.material?._id ?? interest.material,
    relatedInterest: interest._id,
  });

  if (nextStatus === "closed" && interest.conversation) {
    await Conversation.updateOne(
      { _id: interest.conversation },
      { $set: { status: "closed" } }
    );
  }

  const populated = await Interest.findById(interest._id)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status")
    .populate("conversation");

  sendSuccess(res, { interest: toPublicInterest(populated) }, "Workflow updated");
});

module.exports = {
  createInterest,
  listMyInterests,
  getMyInterestForMaterial,
  updateInterestStatus,
  patchInterestWorkflow,
};
