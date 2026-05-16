function hasText(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function computeProfileCompletion(doc) {
  let score = 0;
  if (hasText(doc.companyDescription)) score += 22;
  if (hasText(doc.website)) score += 12;
  if ((doc.industriesHandled ?? []).filter(Boolean).length) score += 18;
  if ((doc.materialTypes ?? []).filter(Boolean).length) score += 18;
  if (hasText(doc.operationalLocation) || hasText(doc.location)) score += 15;
  if (hasText(doc.employeeRange)) score += 5;
  if (doc.establishedYear && Number(doc.establishedYear) > 1800) score += 5;
  if (typeof doc.responseRate === "number" && doc.responseRate >= 0) score += 5;
  return Math.min(100, Math.round(score));
}

module.exports = { computeProfileCompletion };
