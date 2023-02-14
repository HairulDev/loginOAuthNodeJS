const knex = require("#config/database");
const { dateLocalISOString } = require("#lib/helper");


const sessionChange = (actived, params) => {
  return new Promise(async (resolve, reject) => {

    if (actived === 'Active') {
      console.log("masuk ke ======= Active");
      await knex.transaction((trx) => {
        knex("user_login")
          .transacting(trx)
          .where({ usr_email: params })
          .update(
            {
              usr_is_active: true,
              usr_userupdated: params,
              usr_timeupdated: dateLocalISOString(),
            },
            [
              "usr_email",
              "usr_userupdated",
              "usr_timeupdated",
            ]
          )
          .then(async (response) => {
            await trx.commit();
            resolve(response);
          })
          .catch((err) => {
            trx.rollback;
            reject(err);
          });
      }); // end knex
    } else if (actived === 'Destroy') {
      console.log("masuk ke ======= Destroy");
      await knex.transaction((trx) => {
        knex("user_login")
          .transacting(trx)
          .where({ usr_email: params })
          .update(
            {
              usr_is_active: false,
              usr_userupdated: params,
              usr_timeupdated: dateLocalISOString(),
            },
            [
              "usr_email",
              "usr_userupdated",
              "usr_timeupdated",
            ]
          )
          .then(async (response) => {
            await trx.commit();
            resolve(response);
          })
          .catch((err) => {
            trx.rollback;
            reject(err);
          });
      });
    }
  });
};

const tableSelect = (id) => {
  return knex("table_select")
    .where("id", id)
    .first();
};

const dataSelect = (table, cols, condition) => {
  const { where, value } = condition;
  return knex(table)
    .select(cols)
    .where(`${where}`, `${value}`)
    .first();
};

module.exports = {
  tableSelect,
  dataSelect,
  sessionChange,
};
