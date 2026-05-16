const mongoose = require("mongoose");

const { User } = require("../users/user.model");
const { Material } = require("../materials/material.model");
const { Interest } = require("../interests/interest.model");
const { computeUserEngagementScore } = require("../engagement/engagement.service");

const MS_DAY = 24 * 60 * 60 * 1000;
const LISTABLE = ["available", "active", "in_discussion"];

function locationCity(loc) {
  const s = (loc ?? "").toString().trim();
  if (!s) return "";
  return s.split(",")[0].trim();
}

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

/**
 * Calm operational insight cards — not analytics dashboards.
 */
async function getOperationalInsights(user) {
  const userId = user.id ?? user._id?.toString();
  const role = user.role;
  const insights = [];
  const since = new Date(Date.now() - 7 * MS_DAY);

  const me = await User.findById(userId)
    .select("location materialTypes industryType role companyName")
    .lean();

  if (!me) return { insights: [] };

  if (role === "verified_buyer") {
    const myTypes = (me.materialTypes ?? []).map(norm).filter(Boolean);
    const city = locationCity(me.location);

    if (myTypes.length) {
      const materials = await Material.find({
        status: { $in: LISTABLE },
        visibility: "network",
        updatedAt: { $gte: since },
      })
        .select("materialType industryType")
        .lean();

      const typeHits = {};
      for (const m of materials) {
        const mt = norm(m.materialType);
        if (myTypes.some((t) => mt.includes(t) || t.includes(mt))) {
          typeHits[mt] = (typeHits[mt] ?? 0) + 1;
        }
      }
      const top = Object.entries(typeHits).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) {
        insights.push({
          id: "category_activity",
          category: "network",
          title: "Category activity increased",
          body: `Response activity around ${top[0]} recovery opportunities increased this week on the network.`,
          tone: "neutral",
        });
      }
    }

    if (city) {
      const activeBuyers = await User.countDocuments({
        role: "verified_buyer",
        location: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      });
      const activeProviders = await User.countDocuments({
        role: "material_provider",
        location: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      });
      if (activeProviders >= 2) {
        insights.push({
          id: `regional_${norm(city)}`,
          category: "regional",
          title: `Activity near ${city}`,
          body: `Verified participants near ${city} are actively publishing and coordinating recovery opportunities.`,
          tone: "positive",
          meta: { activeProviders, activeBuyers },
        });
      }
    }

    const similarEngagement = await Interest.countDocuments({
      createdAt: { $gte: since },
    });
    if (similarEngagement >= 3 && myTypes[0]) {
      insights.push({
        id: "peer_engagement",
        category: "operations",
        title: "Peers are engaging",
        body: `Participants with similar material interests are engaging with ${myTypes[0]} recovery opportunities this week.`,
        tone: "neutral",
      });
    }
  }

  if (role === "material_provider") {
    const myMaterials = await Material.find({ provider: userId })
      .select("materialType")
      .lean();
    const types = [...new Set(myMaterials.map((m) => m.materialType).filter(Boolean))];

    if (types.length) {
      const weekInterests = await Interest.countDocuments({
        createdAt: { $gte: since },
      });
      const typeLabel = types[0];
      if (weekInterests >= 2) {
        insights.push({
          id: "network_interest_volume",
          category: "network",
          title: "Inbound interest volume",
          body: `Network-wide interest signals remain active this week — operators publishing ${typeLabel} see steady inbound coordination.`,
          tone: "neutral",
        });
      }
    }

    const pending = await Interest.countDocuments({
      provider: userId,
      status: "pending",
    });
    if (pending > 0) {
      insights.push({
        id: "pending_inbox",
        category: "operations",
        title: "Inbox attention",
        body: `You have ${pending} interest${pending === 1 ? "" : "s"} awaiting a response — timely replies improve your response posture.`,
        tone: pending >= 3 ? "attention" : "neutral",
      });
    }

    const engagement = await computeUserEngagementScore(userId);
    if (engagement >= 60) {
      insights.push({
        id: "engagement_posture",
        category: "operations",
        title: "Strong operational presence",
        body: "Your recent coordination activity positions you as a responsive participant on the network.",
        tone: "positive",
      });
    }
  }

  if (role === "admin") {
    const [pending, activeListings] = await Promise.all([
      Interest.countDocuments({ status: "pending" }),
      Material.countDocuments({ status: { $in: LISTABLE } }),
    ]);
    insights.push({
      id: "admin_pulse",
      category: "network",
      title: "Network pulse",
      body: `${pending} pending interests and ${activeListings} active listings across the recovery network.`,
      tone: "neutral",
    });
  }

  return { insights: insights.slice(0, 8) };
}

module.exports = { getOperationalInsights };
