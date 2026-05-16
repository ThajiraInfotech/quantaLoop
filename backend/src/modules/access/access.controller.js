const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");

const PLANS = {
  tiers: [
    {
      id: "early_access",
      name: "Early access",
      positioning: "Founding participant positioning on the network.",
      highlight: "Invitation-based rollout",
    },
    {
      id: "network_access",
      name: "Network access",
      positioning: "Verified industrial demand and recovery opportunity context.",
      highlight: "Operational trust layer",
    },
    {
      id: "enterprise_access",
      name: "Enterprise access",
      positioning: "Reserved for policy, verification depth, and integration scope.",
      highlight: "Future-ready",
    },
  ],
  anchor: {
    headline: "Recover value from what your operations already produce",
    subtext:
      "Access to verified industrial demand and relevant recovery opportunities.",
    annualInr: 4999,
    dailyInrApprox: 13.7,
    rationale:
      "One successful recovery opportunity can cover years of access.",
  },
};

const getPlans = asyncHandler(async (req, res) => {
  sendSuccess(res, PLANS, "Access positioning retrieved");
});

module.exports = { getPlans };
