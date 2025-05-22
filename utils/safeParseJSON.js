const fs = require("fs");

const safeParseJSON = (str, fieldName, rowIndex) => {
  if (typeof str !== "string") return str;

  const trimmed = str.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      console.warn(
        `❌ JSON parse error in field "${fieldName}" at row ${rowIndex}:`,
        err.message
      );
      console.warn("Value:", str);
      fs.appendFileSync(
        "parse_errors.log",
        `Row ${rowIndex} (${fieldName}) failed: ${err.message}\nValue: ${str}\n\n`
      );

      return null;
    }
  }

  return str; // Not a JSON string
};

module.exports = { safeParseJSON };
