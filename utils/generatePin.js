// D:\EBAY_CLONE\ebay_clone_be\utils\generatePin.js

/**
 * Generates a random N-digit numerical PIN.
 * @param {number} length - The desired length of the PIN (e.g., 6 for a 6-digit PIN).
 * @returns {string} The generated PIN as a string.
 */
const generatePin = (length = 6) => {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10); // Generates a digit from 0-9
  }
  return pin;
};

module.exports = {
  generatePin,
};
