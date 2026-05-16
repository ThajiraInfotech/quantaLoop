function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function pickBetween(startDaysAgo, endDaysAgo) {
  const a = Math.min(startDaysAgo, endDaysAgo);
  const b = Math.max(startDaysAgo, endDaysAgo);
  const start = daysAgo(b).getTime();
  const end = daysAgo(a).getTime();
  if (start >= end) return daysAgo(a);
  return new Date(start + Math.random() * (end - start));
}

function stampDocument(doc, createdAt, updatedAt = createdAt) {
  doc.createdAt = createdAt;
  doc.updatedAt = updatedAt;
  return doc;
}

module.exports = { daysAgo, hoursAgo, pickBetween, stampDocument };
