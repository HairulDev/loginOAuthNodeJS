const helper = require("#lib/response");
const genFuncModel = require("#models/genFunc.model");
const { sendGridAPIKey } = require("#config/vars");
const { email } = require("#lib/index");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const s3 = require("#lib/s3");

const sendEmail = async (to, from, subject, data, urlPathFile) => {

  let pathFile = path.join(__dirname, `../template/${urlPathFile}`);
  let readFile = fs.readFileSync(pathFile);
  let template = handlebars.compile(readFile.toString());
  let text = template(data);

  const mailOptionsNodeMailer = {
    to: to,
    subject: subject,
    html: text,
  };

  try {
    await email.send(mailOptionsNodeMailer); // nodemailer
  } catch (error) {
    console.error(error);
  }
};

const uploadAWS = async (file, path) => {
  let filenameFormatted = "";
  const extension = file.name.split(".");
  const ext =
    extension.length > 1 ? "." + extension[extension.length - 1] : "";
  filenameFormatted = `${new Date() / 1}${ext}`;

  if (!file)
    return helper.errorHelper(req, res, 400, {
      success: false,
      message: `Empty File`,
    });

  try {
    // upload to s3
    const upload = await s3.put(file.tempFilePath, `${path}/${filenameFormatted}`);
    if (upload.status == false) {
      return helper.errorHelper(req, res, 400, {
        success: false,
        message: upload.message,
      });
    }
    return { filenameFormatted, upload }

  } catch (error) {
    console.error(error);
    return error;
  }
};

const convertArrayToObject = (arr) => {
  const obj = {};
  for (let i = 0; i < arr.length; i++) {
    obj[arr[i]] = arr[i];
  }
  return obj;
}

const tableSelect = async (tableId) => {
  try {
    const tableSelect = await genFuncModel.tableSelect(tableId);
    if (tableSelect) {
      const tableName = tableSelect?.mpa_code;
      let cols = tableSelect?.mpa_paramtext.split(", ");
      let colsObj = convertArrayToObject(cols)
      return { tableName, cols, colsObj };
    }
    return ""
  } catch (error) {
    return error;
  }
}


module.exports = {
  sendEmail,
  uploadAWS,
  tableSelect,
  convertArrayToObject,
};
