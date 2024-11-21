const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, "hex") : null;
const IV_LENGTH = 12;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not defined in the environment variables.");
}

exports.encryptMessage = async function (plaintext) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure the plaintext is a string
      if (typeof plaintext !== "string") {
        reject(new Error("Plaintext must be a string"));
        return;
      }

      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      resolve({
        ciphertext: encrypted.toString("hex"),
        nonce: iv.toString("hex"),
        tag: authTag.toString("hex"),
      });
    } catch (err) {
      console.error("Encryption error:", err);
      reject(err);
    }
  });
};

exports.decryptMessage = async function (encryptedData) {
  // Validate the encryptedData object
  if (!encryptedData || !encryptedData.ciphertext || !encryptedData.nonce || !encryptedData.tag) {
    throw new Error("Invalid encrypted data. Expected ciphertext, nonce, and tag.");
  }

  const { ciphertext, nonce, tag } = encryptedData;

  try {
    // Ensure nonce and tag are in proper format
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      ENCRYPTION_KEY,
      Buffer.from(nonce, "hex")
    );

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Decryption failed: " + err.message);
  }
};
