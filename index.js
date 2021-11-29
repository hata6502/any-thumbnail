const { readFile, writeFile } = require("fs").promises;
const fetch = require("node-fetch");
const { tmpdir } = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { $ } = require("zx");

exports.lambdaHandler = async ({ body }, _context, callback) => {
  const { url } = JSON.parse(body);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`response is not ok. status: ${response.status}`);
  }

  const tmpFilePath = path.join(tmpdir(), uuidv4());

  if (response.headers.get("content-type") === "application/pdf") {
    await writeFile(`${tmpFilePath}.pdf`, await response.buffer());
  } else {
    await writeFile(tmpFilePath, await response.buffer());
    await $`export HOME=/tmp && libreoffice7.1 --headless --convert-to pdf --outdir "${tmpdir()}" "${tmpFilePath}"`;
  }

  await $`pdftoppm -png -singlefile "${tmpFilePath}.pdf" "${tmpFilePath}"`;
  const pngBuffer = await readFile(`${tmpFilePath}.png`);

  callback(null, {
    body: pngBuffer.toString("base64"),
    headers: { "Content-Type": "image/png" },
    isBase64Encoded: true,
    statusCode: 200,
  });
};
