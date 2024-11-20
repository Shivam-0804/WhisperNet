const crypto = require("crypto");

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex")
const IV_LENGTH = 12;

exports.encryptMessage = async function (plaintext) {
  return new Promise((resolve, reject) => {
    try {
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
      reject(err);
    }
  });
};

exports.decryptMessage = async function (encryptedData) {
    const { ciphertext, nonce, tag } = encryptedData;
  
    try {
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
      throw err;
    }
  };
  
