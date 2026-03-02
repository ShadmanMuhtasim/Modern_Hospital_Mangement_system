// src/utils/bloodCompatibility.js

const COMPAT = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
};

function normalizeGroup(bg) {
  if (!bg) return null;
  return bg.toUpperCase().replace(/\s+/g, "");
}

function getCompatibleDonorGroups(recipientGroup) {
  const g = normalizeGroup(recipientGroup);
  return COMPAT[g] || [];
}

module.exports = { getCompatibleDonorGroups, normalizeGroup };