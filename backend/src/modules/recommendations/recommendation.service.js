const mongoose = require("mongoose");

const { User } = require("../users/user.model");
const { Material } = require("../materials/material.model");
const { Interest } = require("../interests/interest.model");
const { SavedMaterial } = require("../saved-materials/saved-material.model");
const {
  scoreMaterialForBuyer,
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
} = require("../matches/match.service");
const {
  freshnessBoost,
  getProviderResponseQuality,
  computeUserEngagementScore,
  computeMaterialActivityScore,
  rankScoredMaterials,
} = require("../engagement/engagement.service");

const LISTABLE = ["available", "active", "in_discussion"];

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function locationCity(loc) {
  const s = (loc ?? "").toString().trim();
  if (!s) return "";
  return s.split(",")[0].trim();
}

async function enrichMaterialRow(m, buyer, extras = {}) {
  const relevanceScore = buyer ? scoreMaterialForBuyer(m, buyer) : 0;
  const activityScore = await computeMaterialActivityScore(m._id);
  const freshnessScore = freshnessBoost(m.updatedAt);
  let providerQuality = 50;
  if (m.provider) {
    const pid =
      typeof m.provider === "object" && m.provider._id
        ? m.provider._id.toString()
        : m.provider.toString();
    const q = await getProviderResponseQuality(pid);
    providerQuality = q.score;
  }

  const composite =
    relevanceScore * 0.45 +
    activityScore * 0.2 +
    freshnessScore +
    providerQuality * 0.15;

  return {
    materialId: m._id.toString(),
    title: m.title,
    materialType: m.materialType,
    location: m.location,
    providerCompany:
      m.provider && typeof m.provider === "object"
        ? m.provider.companyName ?? ""
        : "",
    relevanceScore,
    activityScore,
    freshnessScore,
    compositeScore: Math.round(composite),
    priority:
      composite >= 70
        ? "high"
        : composite >= 45
          ? "medium"
          : "standard",
    headline: extras.headline ?? "Aligned recovery opportunity",
    ...extras,
  };
}

/**
 * @param {object} user - req.user lean or doc
 */
async function getMaterialRecommendations(user) {
  const userId = user.id ?? user._id?.toString();
  const role = user.role;
  const sections = [];

  if (role === "verified_buyer") {
    const buyer = await User.findById(userId).lean();
    if (!buyer) return { sections: [] };

    const [savedIds, pastTypes, materials] = await Promise.all([
      SavedMaterial.find({ buyer: userId }).select("material").lean(),
      Interest.find({ buyer: userId })
        .populate("material", "materialType")
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Material.find({
        status: { $in: LISTABLE },
        visibility: "network",
        provider: { $ne: new mongoose.Types.ObjectId(userId) },
      })
        .populate("provider", "companyName responseRate verificationStatus")
        .sort({ updatedAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const savedSet = new Set(savedIds.map((s) => s.material.toString()));
    const typeFreq = {};
    for (const row of pastTypes) {
      const t = row.material?.materialType;
      if (t) typeFreq[norm(t)] = (typeFreq[norm(t)] ?? 0) + 1;
    }

    const enriched = [];
    for (const m of materials) {
      const row = await enrichMaterialRow(m, buyer);
      if (savedSet.has(row.materialId)) row.headline = "On your watch list";
      enriched.push(row);
    }

    const ranked = rankScoredMaterials(enriched);

    const forOperations = ranked
      .filter((r) => r.relevanceScore >= 25)
      .slice(0, 8)
      .map((r) => ({
        ...r,
        sectionType: "recommended_operations",
      }));

    const city = locationCity(buyer.location);
    const nearYou = ranked
      .filter((r) => city && norm(r.location).includes(norm(city)))
      .slice(0, 6)
      .map((r) => ({
        ...r,
        headline: city ? `Active near ${city}` : r.headline,
        sectionType: "near_you",
      }));

    const topType = Object.entries(typeFreq).sort((a, b) => b[1] - a[1])[0]?.[0];
    const similar = topType
      ? ranked
          .filter((r) => norm(r.materialType).includes(topType))
          .slice(0, 6)
          .map((r) => ({
            ...r,
            headline: "Similar to your recent interests",
            sectionType: "similar_recovery",
          }))
      : [];

    const weekFresh = ranked
      .filter((r) => r.freshnessScore >= 12)
      .slice(0, 6)
      .map((r) => ({
        ...r,
        headline: "Relevant this week",
        sectionType: "relevant_week",
      }));

    if (forOperations.length) {
      sections.push({
        id: "recommended_operations",
        title: "Recommended for your operations",
        subtitle: "Rule-based alignment on type, location, and network activity.",
        items: forOperations,
      });
    }
    if (nearYou.length) {
      sections.push({
        id: "frequently_active_near",
        title: city ? `Relevant near ${city}` : "Frequently active near you",
        subtitle: "Listings with regional operational context.",
        items: nearYou,
      });
    }
    if (similar.length) {
      sections.push({
        id: "similar_recovery",
        title: "Similar recovery opportunities",
        subtitle: "Based on materials you have engaged with before.",
        items: similar,
      });
    }
    if (weekFresh.length) {
      sections.push({
        id: "relevant_week",
        title: "Relevant this week",
        subtitle: "Fresh listings with recent network movement.",
        items: weekFresh,
      });
    }
  }

  if (role === "material_provider") {
    const materials = await Material.find({
      provider: userId,
      status: { $in: LISTABLE },
    })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const items = [];
    for (const m of materials) {
      const activityScore = await computeMaterialActivityScore(m._id);
      items.push({
        materialId: m._id.toString(),
        title: m.title,
        materialType: m.materialType,
        location: m.location,
        activityScore,
        freshnessScore: freshnessBoost(m.updatedAt),
        priority: activityScore >= 25 ? "high" : "standard",
        headline:
          activityScore >= 25
            ? "Fast-moving opportunity"
            : "Your published availability",
      });
    }

    sections.push({
      id: "provider_active_listings",
      title: "Your active opportunities",
      subtitle: "Ranked by recent coordination and interest signals.",
      items: items.sort((a, b) => b.activityScore - a.activityScore),
    });
  }

  return { sections };
}

async function getParticipantRecommendations(user) {
  const userId = user.id ?? user._id?.toString();
  const role = user.role;
  const sections = [];

  if (role === "verified_buyer") {
    const buyer = await User.findById(userId).lean();
    if (!buyer) return { sections: [] };

    const providers = await User.find({ role: "material_provider" })
      .select("companyName location industryType responseRate verificationStatus")
      .limit(80)
      .lean();

    const ranked = [];
    for (const p of providers) {
      const quality = await getProviderResponseQuality(p._id);
      const engagement = await computeUserEngagementScore(p._id);
      let alignment = 0;
      const mats = await Material.find({
        provider: p._id,
        status: { $in: LISTABLE },
        visibility: "network",
      })
        .limit(5)
        .lean();
      for (const m of mats) {
        alignment = Math.max(alignment, scoreMaterialForBuyer(m, buyer));
      }

      const composite = Math.round(
        quality.score * 0.4 + engagement * 0.25 + alignment * 0.35
      );
      if (composite < 30) continue;

      ranked.push({
        participantId: p._id.toString(),
        companyName: p.companyName,
        location: p.location ?? "",
        industryType: p.industryType ?? "",
        responseQualityScore: quality.score,
        responseQualityLabel: quality.label,
        engagementScore: engagement,
        alignmentScore: alignment,
        compositeScore: composite,
        priority: composite >= 70 ? "high" : "standard",
        headline:
          quality.score >= 75
            ? "High response quality"
            : "Engaged network participant",
      });
    }

    ranked.sort((a, b) => b.compositeScore - a.compositeScore);

    if (ranked.length) {
      sections.push({
        id: "high_response_participants",
        title: "Participants with high response quality",
        subtitle: "Operators with reliable coordination patterns — not endorsements.",
        items: ranked.slice(0, 8),
      });
    }

    const city = locationCity(buyer.location);
    const near = ranked
      .filter(
        (r) =>
          city &&
          norm(r.location).includes(norm(city)) &&
          r.compositeScore >= 40
      )
      .slice(0, 6);
    if (near.length) {
      sections.push({
        id: "active_near_you",
        title: city
          ? `Frequently engaged near ${city}`
          : "Frequently engaged participants",
        subtitle: "Regional operational density on the network.",
        items: near,
      });
    }
  }

  if (role === "material_provider") {
    const myMaterialIds = await Material.find({ provider: userId })
      .select("_id")
      .lean();
    const matIds = myMaterialIds.map((m) => m._id);

    const recentInterests = await Interest.find({
      material: { $in: matIds },
      createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    })
      .populate("buyer", "companyName location industryType")
      .limit(40)
      .lean();

    const byBuyer = new Map();
    for (const row of recentInterests) {
      const b = row.buyer;
      if (!b || typeof b !== "object") continue;
      const bid = b._id.toString();
      if (!byBuyer.has(bid)) {
        byBuyer.set(bid, { buyer: b, hits: 0 });
      }
      byBuyer.get(bid).hits += 1;
    }

    const items = [];
    for (const { buyer: b, hits } of byBuyer.values()) {
      const engagement = await computeUserEngagementScore(b._id);
      const alignmentScore = Math.min(100, hits * 25 + 20);
      const compositeScore = Math.round(alignmentScore * 0.55 + engagement * 0.45);
      items.push({
        participantId: b._id.toString(),
        companyName: b.companyName,
        location: b.location ?? "",
        industryType: b.industryType ?? "",
        alignmentScore,
        engagementScore: engagement,
        compositeScore,
        priority: compositeScore >= 55 ? "high" : "standard",
        headline: "Potential buyer alignment",
      });
    }

    const signals = await getProviderMatchSignals(userId);

    if (items.length) {
      sections.push({
        id: "aligned_buyers",
        title: "Buyers aligned with your catalog",
        subtitle: signals.headlines.join(" · ") || "Mandate overlap signals.",
        items: items.sort((a, b) => b.compositeScore - a.compositeScore),
      });
    }
  }

  return { sections };
}

/**
 * Intelligent feed ranking for opportunity controller.
 */
async function getRankedBuyerFeedItems(userId) {
  const suggestions = await getBuyerMaterialSuggestions(userId);
  const buyer = await User.findById(userId).lean();
  if (!buyer) return suggestions.items;

  const enriched = [];
  for (const item of suggestions.items) {
    const m = await Material.findById(item.materialId)
      .populate("provider", "companyName")
      .lean();
    if (!m) {
      enriched.push({ ...item, compositeScore: item.score ?? 0 });
      continue;
    }
    const row = await enrichMaterialRow(m, buyer, {
      headline: item.headline,
    });
    enriched.push(row);
  }

  return rankScoredMaterials(enriched).slice(0, 8);
}

module.exports = {
  getMaterialRecommendations,
  getParticipantRecommendations,
  getRankedBuyerFeedItems,
  enrichMaterialRow,
};
