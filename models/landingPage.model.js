const knex = require("#config/database");


const getAllUser = () => {
  return knex("user_login")
    .select(
      "usr_email",
      "usr_name",
      "usr_file",
      "usr_timecreated",
    )
};

const userSignIn = (params) => {
  return knex("user_login_history")
    .select("usrh_email", "usrh_total_login")
    .where("usrh_email", params)
    .first()
};

const totalSignUp = () => {
  return knex("user_login")
    .count("usr_email", { as: "total_signup" })
    .first()
};
const activeToday = () => {
  return knex("user_login")
    .where({ usr_is_active: true })
    .count("usr_email", { as: "total_active_today" })
    .first()
};

module.exports = {
  getAllUser,
  userSignIn,
  totalSignUp,
  activeToday,
}