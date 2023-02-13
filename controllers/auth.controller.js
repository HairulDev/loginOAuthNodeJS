const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helper = require("#lib/response");
const authModel = require("#models/auth.model");
const secret = "test";
const { frontendUrl, roleIdUser, emailTesting, sendGridAPIKey } = require("#config/vars");
const { email } = require("#lib/index");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const s3 = require("#lib/s3");
const authService = require("#services/auth.service");
const decode = require("jwt-decode");
const { string } = require("#utils/index");
const crypto = require("crypto");
const { generateRandomString } = require("#services/auth.service");
const sgMail = require("@sendgrid/mail");

const sendEmail = async (to, from, subject, data, urlPathFile) => {
  // await sgMail.setApiKey(sendGridAPIKey);

  let pathFile = path.join(__dirname, `../template/${urlPathFile}`);
  let readFile = fs.readFileSync(pathFile);
  let template = handlebars.compile(readFile.toString());
  let text = template(data);

  // const mailOptionsSendGrid = {
  //   to,
  //   from,
  //   subject,
  //   text
  // };

  // I used alternatif nodemailer because my account SendGrid temporary has been suspense
  const mailOptionsNodeMailer = {
    to: to,
    subject: subject,
    html: text,
  };

  try {
    // await sgMail.send(mailOptionsSendGrid); // sendGrid
    await email.send(mailOptionsNodeMailer); // nodemailer
  } catch (error) {
    console.error(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, password } = req.body;

    const oldUser = await authModel.signIn(email);

    if (!oldUser)
      return helper.successHelper(req, res, 400, {
        success: false,
        message: "Login failed",
      });

    const isPasswordCorrect = await bcrypt.compare(oldPassword, oldUser.password);
    if (!isPasswordCorrect)
      return helper.successHelper(req, res, 400, {
        success: false,
        message: "Old password wrong",
      });

    const hashedPassword = authService.generatePassword(password);

    await authModel.changePassword(email, {
      usr_password: hashedPassword,
      usr_timeupdated: new Date().toISOString(),
    });

    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Your password has changed, please sign in",
    });
  } catch (error) {
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const mail = req.body.email;
    const user = await authModel.signInByToken(mail);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    const timestamp = new Date().getTime().toString();
    const hash = crypto.createHash("md5").update(timestamp).digest("hex");
    const hashEmail = crypto.createHash("md5").update(mail).digest("hex");
    const code = hash + hashEmail + generateRandomString(5, true);

    const resetPasswordLink = `${frontendUrl}/newPassword/${code}`;
    let data = {
      name: user.usr_name,
      resetPasswordLink: resetPasswordLink,
    };
    await sendEmail(user.usr_email, emailTesting, 'Reset Password AVL', data, "recoverAccountProcess.hbs");

    const payload = {
      code,
      email: mail,
      timecreated: new Date().toISOString(),
    };
    await authModel.resetPassword(payload);

    return helper.successHelper(req, res, 200, { success: true, message: "Reset password link has been sent to your email" });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return helper.errorHelper(
        req,
        res,
        400,
        {
          status: "USER_NOT_FOUND",
          statusCode: 400,
          message: "User not found!",
          errors: "",
        },
        error
      );
    }
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};


const createNewPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const code = req.params.code;
    const userByToken = await authModel.getResetPasswordCode(code);

    if (string.isEmpty(userByToken)) {
      return helper.errorHelper(
        req,
        res,
        400,
        {
          statusCode: 400,
          message: "Your request rejected!",
          errors: "",
        },
      );
    }

    if (userByToken.is_expired || userByToken.is_used) {
      return helper.errorHelper(
        req,
        res,
        400,
        {
          statusCode: 400,
          message: "Your request has expired or has already been used!",
          errors: "",
        },
      );
    } else {
      const resetPasswordAge =
        Math.abs(new Date() - new Date(userByToken.timecreated)) / 86400000; // in days
      if (resetPasswordAge > 30) {
        const params = {
          is_expired: 1,
          timeupdated: new Date().toISOString(),
        };
        await authModel.updateResetPassword(code, params);
        return helper.errorHelper(
          req,
          res,
          400,
          {
            statusCode: 400,
            message: "Your request has been expired!",
            errors: "",
          },
        );
      }
    }

    const hashedPassword = authService.generatePassword(password);
    const user = await authModel.changePassword(userByToken.email, {
      usr_password: hashedPassword,
      usr_timeupdated: new Date().toISOString(),
    });

    await authModel.updateResetPassword(code, {
      is_used: 1,
      is_expired: 1,
      timeupdated: new Date().toISOString(),
    });

    let data = {
      name: user[0]?.usr_name,
      date: new Date().toLocaleString()
    };
    await sendEmail(userByToken.email, emailTesting, 'Create New Password AVL', data, "recoverAccountSuccess.hbs");


    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Your new password has created, please sign in again"
    });
  } catch (error) {
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};

const verifySignUp = async (params, token) => {
  const { to } = params;
  const verifyLink = `${frontendUrl}/authVerify/${token}`;
  let data = {
    params: params,
    verifyLink
  };
  await sendEmail(to, emailTesting, 'Verification Registration', data, "verifySignUp.hbs");
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const oldUser = await authModel.signIn(email);
    console.log("oldUser =====", oldUser);

    if (!oldUser)
      return helper.successHelper(req, res, 400, {
        success: false,
        message: "Login failed",
      });

    const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordCorrect)
      return helper.successHelper(req, res, 400, {
        success: false,
        message: "Your password wrong",
      });

    await authModel.sessionChange("Active", email)

    const checkUserHistory = await authModel.checkUserHistory(email);
    let totalLogin = checkUserHistory?.usrh_total_login;

    await authModel.signInHistory(
      {
        email: oldUser.email,
        signTotal: totalLogin + 1
      });

    const token = jwt.sign(
      {
        email: oldUser.email,
        name: oldUser.name,
        user_id: oldUser.user_id,
        type: oldUser.type,
        imageUrl: oldUser.file,
      },
      secret,
      {
        expiresIn: "1h",
      }
    );
    const result = decode(token);
    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Login successfully",
      result,
      token,
    });
  } catch (error) {
    return helper.errorHelper(
      req,
      res,
      500,
      "You dont have Authorized networks",
      error
    );
  }
};

const signOut = async (req, res) => {
  const { email } = req.body;
  try {
    await authModel.sessionChange("Destroy", email);

    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Your sign out successfully",
    });
  } catch (error) {
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};

const signup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    if (string.isEmpty(email))
      return helper.errorHelper(req, res, 400, {
        success: false,
        message: `Empty Email`,
      });
    const oldUser = await authModel.signInByToken(email);

    if (oldUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    // aws
    var filenameFormatted = "";
    const file = req.files.file;
    const extension = file.name.split(".");
    const ext =
      extension.length > 1 ? "." + extension[extension.length - 1] : "";
    filenameFormatted = `${new Date() / 1}${ext}`;

    if (!file)
      return helper.errorHelper(req, res, 400, {
        success: false,
        message: `Empty File`,
      });
    // upload attachment to s3
    const upload = await s3.put(file.tempFilePath, `user/${filenameFormatted}`);
    if (upload.status == false) {
      return helper.errorHelper(req, res, 400, {
        success: false,
        message: upload.message,
      });
    }
    // end aws

    let params = {
      roleIdUser,
      to: email,
      password: hashedPassword,
      firstName,
      lastName,
      file: filenameFormatted,
    };
    await authModel.signUp(params);
    const result = await authModel.signInByToken(email);

    const userToken = await authService.signToken(result, 30);
    await verifySignUp(params, userToken);

    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Registration successfully, check your email please",
    });
  } catch (error) {
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};

const verifyReg = async (req, res) => {
  const token = decode(req.query.token);
  try {
    const findUser = await authModel.signInByToken(token.usr_email);
    const emailUser = findUser.usr_email;
    if (findUser) await authModel.activeUser(emailUser);

    return helper.successHelper(req, res, 200, {
      success: true,
      message: "Your verification successfull",
    });
  } catch (error) {
    return helper.errorHelper(req, res, 500, undefined, error);
  }
};

module.exports = {
  changePassword,
  resetPassword, createNewPassword,
  verifySignUp,
  signin,
  signOut,
  signup,
  verifyReg,
};
