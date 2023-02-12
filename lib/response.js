const dbLogger = require("#lib/dbLogger");

const DEFAULT_ERROR_OBJ = {
  status: "INTERNAL_SERVER_ERROR",
  statusCode: 500,
  message: "Request failed unexpectedly!",
  errors: "",
};

const errorHelper = (
  req,
  res,
  status = 500,
  data = DEFAULT_ERROR_OBJ,
  error = undefined,
  createLog = true
) => {
  // create log
  if (createLog) {
    dbLogger
      .create({
        payload: JSON.stringify(req?.body),
        status_code: status,
        source_response: "",
        error: error ? JSON.stringify(error) : "Unexpected error",
        endpoint: req.originalUrl,
      })
      .catch((err) => console.log(err?.message));
  }

  // dont sent response to client if ERR_HTTP_HEADERS_SENT!
  if (res.headersSent) return;
  res.status(status).json(data);
};

const successHelper = (req, res, status = 200, data) => {
  // dont sent response to client if ERR_HTTP_HEADERS_SENT!
  if (res.headersSent) return;
  res.status(status).json(data);
};

module.exports = { errorHelper, successHelper };
