const helper = require("#lib/response");
const landingPageModel = require("#models/landingPage.model");


const landingPage = async (req, res) => {
  try {
    const getAllUser = await landingPageModel.getAllUser();
    // checking total user sign in
    let totalSignInByUser = [];
    for (let i = 0; i < getAllUser.length; i++) {
      const email = getAllUser[i].usr_email;
      let user = await landingPageModel.userSignIn(email);
      totalSignInByUser.push(user)
    }

    let users = []
    for (let i = 0; i < totalSignInByUser.length; i++) {
      const usrEmail = totalSignInByUser[i].usrh_email;
      // get users by filter email in total user sign in
      let filterEmail = getAllUser
        .map((element) => element)
        .filter((e) => e.usr_email === usrEmail);

      // pushing all data users and total sign in to one object
      for (let j = 0; j < filterEmail.length; j++) {
        const element = filterEmail[j];
        let resFilter = {
          usr_email: element.usr_email,
          usr_name: element.usr_name,
          usr_file: element.usr_file,
          usrh_total_login: totalSignInByUser[i].usrh_total_login,
          usr_timecreated: element.usr_timecreated
        }
        users.push(resFilter)
      }
    }

    const totalSignUp = await landingPageModel.totalSignUp();
    const activeToday = await landingPageModel.activeToday();
    let dashboard = {
      total_signup: totalSignUp.total_signup,
      total_active_today: activeToday.total_active_today
    }

    return helper.successHelper(req, res, 200, {
      success: true,
      dashboard,
      users
    });
  } catch (error) {
    return helper.errorHelper(
      req,
      res,
      500,
      [],
      error
    );
  }
};


module.exports = {
  landingPage
};
