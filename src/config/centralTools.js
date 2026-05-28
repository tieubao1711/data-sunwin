function getCentralToolWhitelist() {
  return String(process.env.CENTRAL_TOOL_WHITELIST || '')
    .split(',')
    .map((toolName) => toolName.trim())
    .filter(Boolean);
}

function getCentralToolFilter(toolName = '') {
  const whitelist = getCentralToolWhitelist();

  if (!toolName) {
    return { $in: whitelist };
  }

  return {
    $in: whitelist.filter((allowedToolName) => allowedToolName === String(toolName))
  };
}

module.exports = {
  getCentralToolFilter
};
