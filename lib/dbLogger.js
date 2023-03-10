const knex = require("../config/database");

const create = async (params) => {
  const { payload, status_code, source_response, error, endpoint } = params;
  try {
    const data = await knex("logs")
      .insert({ payload, status_code, source_response, error, endpoint })
      .returning("*");
    return Promise.resolve(data);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = { create };
