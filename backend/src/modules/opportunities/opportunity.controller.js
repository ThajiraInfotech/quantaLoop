const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");
const { getProviderMatchSignals } = require("../matches/match.service");
const {
  getRankedBuyerFeedItems,
  enrichMaterialRow,
} = require("../recommendations/recommendation.service");
const { rankScoredMaterials } = require("../engagement/engagement.service");
const { User } = require("../users/user.model");
const { SavedMaterial } = require("../saved-materials/saved-material.model");

const listable = ["available", "active", "in_discussion"];

async function computeResponseMetrics(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const interests = await Interest.find({
    provider: uid,
    status: { $ne: "pending" },
    createdAt: { $gte: since },
  })
    .select("createdAt updatedAt status")
    .lean();

  let responded = 0;
  let totalHours = 0;
  for (const row of interests) {
    const ms = new Date(row.updatedAt) - new Date(row.createdAt);
    if (ms >= 0 && ms < 14 * 24 * 60 * 60 * 1000) {
      responded += 1;
      totalHours += ms / (1000 * 60 * 60);
    }
  }

  const avgHours = responded ? totalHours / responded : null;
  const responseRatePct =
    interests.length > 0
      ? Math.round((responded / interests.length) * 100)
      : null;

  const outbound = await Interest.countDocuments({
    buyer: uid,
    createdAt: { $gte: since },
  });

  const engagementScore = Math.min(
    100,
    responded * 12 + outbound * 6
  );

  return {
    windowDays: 30,
    averageResponseHours: avgHours != null ? Math.round(avgHours * 10) / 10 : null,
    activeResponseRatePct: responseRatePct,
    recentEngagementScore: engagementScore,
  };
}

const getOpportunityFeed = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  const sections = [];

  if (role === "verified_buyer") {
    const [rankedRelevant, recent, savedCount, buyer] = await Promise.all([
      getRankedBuyerFeedItems(userId),
      Material.find({
        status: { $in: listable },
        visibility: "network",
        provider: { $ne: new mongoose.Types.ObjectId(userId) },
      })
        .sort({ updatedAt: -1 })
        .limit(12)
        .populate("provider", "companyName")
        .lean(),
      SavedMaterial.countDocuments({ buyer: userId }),
      User.findById(userId).lean(),
    ]);

    const recentEnriched = [];
    if (buyer) {
      for (const m of recent) {
        recentEnriched.push(
          await enrichMaterialRow(m, buyer, {
            headline: "Recently active listing",
          })
        );
      }
    }
    const rankedRecent = rankScoredMaterials(recentEnriched).slice(0, 6);

    sections.push({
      id: "relevant_this_week",
      title: "Relevant this week",
      subtitle:
        "Ranked by mandate fit, freshness, and coordination signals — not marketplace offers.",
      items: rankedRelevant.slice(0, 6),
    });

    sections.push({
      id: "new_recovery",
      title: "New recovery opportunities",
      subtitle: "Recently updated listings on the network.",
      items: rankedRecent,
    });

    sections.push({
      id: "saved",
      title: "Saved opportunities",
      subtitle: `${savedCount} item${savedCount === 1 ? "" : "s"} on your watch list.`,
      items: [],
    });
  }

  if (role === "material_provider") {
    const [signals, metrics, activeNear] = await Promise.all([
      getProviderMatchSignals(userId),
      computeResponseMetrics(userId),
      Material.find({
        provider: userId,
        status: { $in: listable },
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .lean(),
    ]);

    sections.push({
      id: "response_posture",
      title: "Response posture",
      subtitle: "Operational responsiveness signals for your desk.",
      metrics,
    });

    sections.push({
      id: "match_context",
      title: "Counterparty context",
      subtitle: signals.headlines.join(" · ") || "Signals from your catalog.",
      items: signals.buyers.map((b) => ({
        companyName: b.companyName,
        location: b.location,
        score: b.score,
        headline: "Potential buyer alignment",
      })),
    });

    sections.push({
      id: "recent_active_near_you",
      title: "Recently active near you",
      subtitle: "Your own listings by last operational update.",
      items: activeNear.map((m) => ({
        materialId: m._id.toString(),
        title: m.title,
        materialType: m.materialType,
        location: m.location,
        headline: "Your published availability",
      })),
    });
  }

  if (role === "admin") {
    const openInterests = await Interest.countDocuments({ status: "pending" });
    const activeListings = await Material.countDocuments({
      status: { $in: listable },
    });
    sections.push({
      id: "network_pulse",
      title: "Network pulse",
      subtitle: "Operational volume snapshot.",
      items: [
        {
          headline: "Pending interests",
          value: openInterests,
        },
        {
          headline: "Active listings",
          value: activeListings,
        },
      ],
    });
  }

  sendSuccess(res, { sections }, "Opportunity feed retrieved");
});

const getOpportunityMetrics = asyncHandler(async (req, res) => {
  const metrics = await computeResponseMetrics(req.user.id);
  sendSuccess(res, { metrics }, "Metrics retrieved");
});

module.exports = { getOpportunityFeed, getOpportunityMetrics, computeResponseMetrics };
