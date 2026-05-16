const bcrypt = require("bcryptjs");
const { User } = require("../../modules/users/user.model");
const { pick, intBetween } = require("../utils/random");
const { CHENNAI_LOCATIONS, PROVIDER_PROFILES, BUYER_PROFILES } = require("../data/chennai-industrial");

const DEFAULT_PASSWORD = process.env.SEED_DEMO_PASSWORD || "SeedDemo123!";

async function hashPassword() {
  return bcrypt.hash(DEFAULT_PASSWORD, 10);
}

function opsDescription(companyName, industryType) {
  return `${companyName} participates in the Chennai industrial recovery network, focusing on ${industryType.toLowerCase()} streams with documented operational controls.`;
}

async function createAdmins(count = 2) {
  const password = await hashPassword();
  const admins = [];
  for (let i = 1; i <= count; i += 1) {
    const doc = await User.create({
      name: i === 1 ? "Platform Administrator" : "Network Operations Admin",
      companyName: "Quanta Loop Registry",
      email: `admin${i}@demo.quantaloop.local`,
      password,
      role: "admin",
      industryType: "Platform operations",
      materialTypes: [],
      location: "Guindy, Chennai",
      companyDescription: "Internal administration for the Quanta Loop industrial recovery network.",
      verificationStatus: "verified",
      profileCompletion: 100,
      responseRate: 100,
      averageResponseTime: "Within 1 hour",
    });
    admins.push(doc);
  }
  return admins;
}

async function createProviders(count = 18) {
  const password = await hashPassword();
  const profiles = PROVIDER_PROFILES.slice(0, count);
  const providers = [];

  for (let i = 0; i < profiles.length; i += 1) {
    const p = profiles[i];
    const verificationStatus =
      i < 14 ? "verified" : i < 16 ? "pending" : "unverified";
    const doc = await User.create({
      name: `Operations Lead ${i + 1}`,
      companyName: p.companyName,
      email: `provider${i + 1}@demo.quantaloop.local`,
      password,
      role: "material_provider",
      industryType: p.industryType,
      materialTypes: p.materialTypes,
      industriesHandled: [p.industryType],
      location: pick(CHENNAI_LOCATIONS),
      operationalLocation: pick(CHENNAI_LOCATIONS),
      companyDescription: opsDescription(p.companyName, p.industryType),
      website: `https://demo.quantaloop.local/providers/${i + 1}`,
      employeeRange: pick(["51–200", "201–500", "11–50"]),
      establishedYear: intBetween(1985, 2015),
      responseRate: p.responseRate,
      averageResponseTime: p.averageResponseTime,
      verificationStatus,
      profileCompletion: intBetween(72, 98),
    });
    providers.push(doc);
  }
  return providers;
}

async function createBuyers(count = 18) {
  const password = await hashPassword();
  const profiles = BUYER_PROFILES.slice(0, count);
  const buyers = [];

  for (let i = 0; i < profiles.length; i += 1) {
    const b = profiles[i];
    const verificationStatus = i < 15 ? "verified" : "pending";
    const doc = await User.create({
      name: `Procurement Manager ${i + 1}`,
      companyName: b.companyName,
      email: `buyer${i + 1}@demo.quantaloop.local`,
      password,
      role: "verified_buyer",
      industryType: b.industryType,
      materialTypes: b.materialTypes,
      industriesHandled: b.industriesHandled,
      location: pick(CHENNAI_LOCATIONS),
      operationalLocation: pick(CHENNAI_LOCATIONS),
      companyDescription: opsDescription(b.companyName, b.industryType),
      employeeRange: pick(["11–50", "51–200"]),
      establishedYear: intBetween(1990, 2018),
      responseRate: intBetween(60, 95),
      averageResponseTime: pick([
        "Within 24 hours",
        "Within 12 hours",
        "Same business day",
      ]),
      verificationStatus,
      profileCompletion: intBetween(68, 96),
    });
    buyers.push(doc);
  }
  return buyers;
}

module.exports = {
  createAdmins,
  createProviders,
  createBuyers,
  DEFAULT_PASSWORD,
};
