/**
 * Checks if the request contains a valid INTERNAL_API_SECRET header.
 * Used for server-to-server calls bypassing standard user session checks.
 */
const checkInternalSecret = (req) => {
  const secretHeader = req.headers["x-internal-secret"] || req.headers["internal-api-secret"];
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (expectedSecret && secretHeader && secretHeader === expectedSecret) {
    return true;
  }
  return false;
};

module.exports = { checkInternalSecret };
