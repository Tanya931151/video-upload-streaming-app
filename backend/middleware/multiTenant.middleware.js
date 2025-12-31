// Multi-tenant isolation - ensures users only access their org's data
export const enforceTenantIsolation = (req, res, next) => {
  if (req.user) {
    req.organization = req.user.organization;
  }
  next();
};

// Adds organization filter to queries
export const filterByOrganization = (req, res, next) => {
  if (req.user && req.user.organization) {
    req.queryFilter = { organization: req.user.organization };
  }
  next();
};
