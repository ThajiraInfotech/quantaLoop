/** Canonical operational statuses + legacy values still in MongoDB. */
const MATERIAL_STATUS_VALUES = [
  "available",
  "in_discussion",
  "fulfilled",
  "archived",
  "active",
  "inactive",
];

/** Listed for buyer network browse (network visibility still applies). */
const LISTED_NETWORK_STATUSES = ["available", "active", "in_discussion"];

/** Counts as active catalog line for provider trust / match signals. */
const PROVIDER_CATALOG_STATUSES = [
  "available",
  "active",
  "in_discussion",
];

function isListedForNetworkBrowse(status) {
  return LISTED_NETWORK_STATUSES.includes(status);
}

function countsTowardProviderCatalog(status) {
  return PROVIDER_CATALOG_STATUSES.includes(status);
}

/** Normalize legacy DB values for public API payloads. */
function mapMaterialStatusForPublic(status) {
  if (status === "active") return "available";
  if (status === "inactive") return "archived";
  return status;
}

module.exports = {
  MATERIAL_STATUS_VALUES,
  LISTED_NETWORK_STATUSES,
  PROVIDER_CATALOG_STATUSES,
  isListedForNetworkBrowse,
  countsTowardProviderCatalog,
  mapMaterialStatusForPublic,
};
