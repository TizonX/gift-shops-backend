// generateOtp.js
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit OTP
  };
  
  module.exports = generateOtp; // Export the function to use in other files
  