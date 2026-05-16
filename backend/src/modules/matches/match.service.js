const mongoose = require("mongoose");

const { User } = require("../users/user.model");
const { Material } = require("../materials/material.model");
const { createNotification } = require("../notifications/notification.service");
const { isListedForNetworkBrowse } = require("../materials/material-status.helper");

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function tokenOverlap(a, b) {
  const ta = norm(a)
    .split(/[\s,;/|]+/)
    .filter(Boolean);
  const tb = new Set(
    norm(b)
      .split(/[\s,;/|]+/)
      .filter(Boolean)
  );
  if (!ta.length || !tb.size) return 0;
  let hits = 0;
  for (const t of ta) {
    if (tb.has(t)) hits += 1;
    else {
      for (const u of tb) {
        if (u.includes(t) || t.includes(u)) {
          hits += 1;
          break;
        }
      }
    }
  }
  return hits;
}

/**
 * Lightweight relevance score (0–100) for buyer ↔ material. Not ML.
 */
function scoreMaterialForBuyer(material, buyer) {
  let score = 0;
  const mt = norm(material.materialType);
  const buyerTypes = (buyer.materialTypes ?? []).map(norm).filter(Boolean);
  if (mt && buyerTypes.some((t) => mt.includes(t) || t.includes(mt))) {
    score += 45;
  } else if (mt && buyerTypes.length) {
    const partial = buyerTypes.some(
      (t) => tokenOverlap(mt, t) > 0 || tokenOverlap(material.industryType, t) > 0
    );
    if (partial) score += 25;
  }

  const locM = norm(material.location);
  const locB = norm(buyer.location);
  if (locM && locB) {
    if (locM === locB) score += 35;
    else if (locM.includes(locB) || locB.includes(locM)) score += 28;
    else if (tokenOverlap(locM, locB) > 0) score += 18;
  }

  const indM = norm(material.industryType);
  const indB = norm(buyer.industryType);
  if (indM && indB && (indM.includes(indB) || indB.includes(indM))) {
    score += 20;
  }

  return Math.min(100, score);
}

const NOTIFY_SCORE_THRESHOLD = 38;
const MAX_MATCH_NOTIFICATIONS = 24;

async function notifyBuyersOfNewMaterial(materialDoc) {
  if (!materialDoc || !isListedForNetworkBrowse(materialDoc.status)) return;
  if (materialDoc.visibility !== "network") return;

  const buyers = await User.find({ role: "verified_buyer" })
    .select(
      "companyName name email materialTypes location industryType role"
    )
    .lean()
    .limit(400);

  let sent = 0;
  const providerId = materialDoc.provider?.toString?.();

  for (const buyer of buyers) {
    if (sent >= MAX_MATCH_NOTIFICATIONS) break;
    if (buyer._id.toString() === providerId) continue;

    const score = scoreMaterialForBuyer(materialDoc, buyer);
    if (score < NOTIFY_SCORE_THRESHOLD) continue;

    await createNotification({
      recipient: buyer._id,
      type: "new_matching_material",
      title: "New opportunity aligned to your mandate",
      message: `A material "${materialDoc.title}" may fit your sourcing profile (${materialDoc.materialType} · ${materialDoc.location}).`,
      relatedMaterial: materialDoc._id,
      relatedInterest: null,
    });
    sent += 1;
  }
}

async function getBuyerMaterialSuggestions(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const buyer = await User.findById(uid).lean();
  if (!buyer || buyer.role !== "verified_buyer") {
    return { items: [] };
  }

  const materials = await Material.find({
    status: { $in: ["available", "active", "in_discussion"] },
    visibility: "network",
    provider: { $ne: uid },
  })
    .populate("provider", "companyName")
    .sort({ updatedAt: -1 })
    .limit(80)
    .lean();

  const ranked = materials
    .map((m) => ({
      material: m,
      score: scoreMaterialForBuyer(m, buyer),
    }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    items: ranked.map(({ material: m, score }) => ({
      materialId: m._id.toString(),
      title: m.title,
      materialType: m.materialType,
      location: m.location,
      providerCompany:
        m.provider && typeof m.provider === "object"
          ? m.provider.companyName ?? ""
          : "",
      score,
      headline:
        score >= NOTIFY_SCORE_THRESHOLD
          ? "Strong alignment with your mandate"
          : "Relevant to your stated preferences",
    })),
  };
}

async function getProviderMatchSignals(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const provider = await User.findById(uid).lean();
  if (!provider || provider.role !== "material_provider") {
    return { headlines: [], buyers: [] };
  }

  const materials = await Material.find({
    provider: uid,
    status: { $in: ["available", "active", "in_discussion"] },
  })
    .select("materialType industryType location title")
    .lean();

  if (!materials.length) {
    return {
      headlines: ["Publish availability to unlock match signals."],
      buyers: [],
    };
  }

  const typeSet = new Set(
    materials.map((m) => norm(m.materialType)).filter(Boolean)
  );
  const locHint = materials.map((m) => m.location).find(Boolean) ?? "";

  const buyers = await User.find({ role: "verified_buyer" })
    .select("companyName materialTypes location industryType")
    .lean()
    .limit(200);

  const ranked = buyers
    .map((b) => {
      let score = 0;
      for (const t of typeSet) {
        const bts = (b.materialTypes ?? []).map(norm);
        if (bts.some((bt) => bt && (t.includes(bt) || bt.includes(t)))) {
          score += 40;
          break;
        }
      }
      if (locHint && norm(b.location) && norm(locHint).includes(norm(b.location))) {
        score += 25;
      }
      return { buyer: b, score };
    })
    .filter((x) => x.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const headlines = [];
  if (locHint) {
    headlines.push(`Relevant near ${locHint.split(",")[0].trim()}`);
  }
  headlines.push("Matches your published material categories");

  return {
    headlines,
    buyers: ranked.map(({ buyer: b, score }) => ({
      companyName: b.companyName,
      location: b.location ?? "",
      industryType: b.industryType ?? "",
      score,
    })),
  };
}

module.exports = {
  scoreMaterialForBuyer,
  notifyBuyersOfNewMaterial,
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
};
