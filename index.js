const { readFile, writeFile } = require("fs").promises;
const fetch = require("node-fetch");
const { tmpdir } = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { $ } = require("zx");

exports.lambdaHandler = async ({ body }, _context, callback) => {
  const { url } = JSON.parse(body);
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "any-thumbnail (+https://github.com/hata6502/any-thumbnail)",
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!response.ok) {
    throw new Error(`response is not ok. status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  let imagePath;

  if (contentType.startsWith("image/")) {
    const tmpFilePath = path.join(tmpdir(), uuidv4());

    await writeFile(tmpFilePath, await response.buffer());
    imagePath = tmpFilePath;
  } else {
    const tmpFilePath = path.join(tmpdir(), uuidv4());

    if (contentType === "application/pdf") {
      await writeFile(`${tmpFilePath}.pdf`, await response.buffer());
    } else {
      await writeFile(tmpFilePath, await response.buffer());
      await $`export HOME=/tmp && libreoffice7.1 --headless --convert-to pdf --outdir "${tmpdir()}" "${tmpFilePath}"`;
    }

    await $`pdftoppm -png -singlefile "${tmpFilePath}.pdf" "${tmpFilePath}"`;
    imagePath = `${tmpFilePath}.png`;
  }

  const compressedImagePath = path.join(tmpdir(), `${uuidv4()}.jpg`);

  await $`convert ${imagePath} -define jpeg:extent=2048kb ${compressedImagePath}`;

  const compressedImageBuffer = await readFile(compressedImagePath);

  callback(null, {
    body: compressedImageBuffer.toString("base64"),
    headers: { "Content-Type": "image/jpeg" },
    isBase64Encoded: true,
    statusCode: 200,
  });
};
