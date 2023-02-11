const dateLocalISOString = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString();
};

module.exports = {
  dateLocalISOString,
};
