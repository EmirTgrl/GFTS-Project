const Iyzipay = require("iyzipay");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { pool } = require("../db.js");

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL,
});

// Nodemailer transporter oluşturma
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// E-posta gönderme fonksiyonu (kullanıcıya)
async function sendPaymentConfirmationEmail(
  userEmail,
  versionName,
  paymentId,
  durationDays
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: "Payment Successful - GTFS Editor Premium Subscription",
    html: `
      <h2>Payment Successful!</h2>
      <p>Dear ${userEmail},</p>
      <p>Your GTFS Editor Premium subscription has been successfully activated. Details below:</p>
      <ul>
        <li><strong>Plan Name:</strong> ${versionName}</li>
        <li><strong>Duration:</strong> ${durationDays} days</li>
        <li><strong>Payment ID:</strong> ${paymentId}</li>
      </ul>
      <p>You now have full access to all Premium features! If you have any questions, please contact us at ${process.env.EMAIL_FROM}.</p>
      <p>Have a good day. Thank you for choosing us.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to user: ${userEmail}`);
  } catch (error) {
    console.error(
      `Email sending error to user: ${userEmail}`,
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to send email to user: ${error.message}`);
  }
}

// E-posta bildirim fonksiyonu (proje sahibi için)
async function sendPaymentNotification(ownerEmail, paymentDetails) {
  ownerEmail = process.env.EMAIL_FROM;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: ownerEmail,
    subject: "New Payment Received",
    html: `
      <h2>New Payment Notification</h2>
      <p>A new payment has been received. Details:</p>
      <ul>
        <li><strong>User ID:</strong> ${paymentDetails.userId}</li>
        <li><strong>Version ID:</strong> ${paymentDetails.versionId}</li>
        <li><strong>Amount:</strong> ${paymentDetails.amount} TRY</li>
        <li><strong>Payment ID:</strong> ${paymentDetails.paymentId}</li>
        <li><strong>Date:</strong> ${new Date().toISOString()}</li>
      </ul>
      <p>Please review the payment in the Iyzico panel or database.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to owner: ${ownerEmail}`);
  } catch (error) {
    console.error(
      `Notification sending error to owner: ${ownerEmail}`,
      JSON.stringify(error, null, 2)
    );
  }
}

// Ödeme linki oluşturma
async function initializePayment(userId, versionId) {
  console.log("Starting initializePayment with:", { userId, versionId });

  const parsedVersionId = parseInt(versionId, 10);
  if (isNaN(parsedVersionId)) {
    console.error("Invalid versionId:", versionId);
    throw new Error("Invalid version ID");
  }

  const [[user]] = await pool.execute(
    "SELECT id, email FROM users WHERE id = ? AND is_active = true",
    [userId]
  );
  if (!user) {
    console.error("User not found:", userId);
    throw new Error("User not found");
  }
  console.log("User found:", { id: user.id, email: user.email });

  const [[version]] = await pool.execute(
    "SELECT id, name, price, duration_days FROM versions WHERE id = ?",
    [parsedVersionId]
  );
  if (!version) {
    console.error("Version not found in database:", {
      versionId: parsedVersionId,
    });
    throw new Error("Version not found in database");
  }
  console.log("Version found:", {
    id: version.id,
    name: version.name,
    price: version.price,
    duration_days: version.duration_days,
  });

  const paymentLink = `https://sandbox.iyzi.link/AAF4lg?versionId=${parsedVersionId}&userId=${userId}`;

  return {
    paymentLink,
    token: `manual-${Date.now()}`,
    conversationId: `manual-${userId}-${Date.now()}`,
  };
}

// Ödeme doğrulama (callback ile ve opsiyonel sorgulama)
async function verifyPayment(token, callbackData) {
  console.log("Starting verifyPayment with token and callback data:", {
    token,
    callbackData,
  });

  // Callback'ten gelen verileri kontrol et
  const { paymentId, status, conversationId } = callbackData;
  if (!paymentId || !status || !conversationId) {
    console.error("Invalid callback data:", callbackData);
    throw new Error("Invalid payment callback data");
  }

  // Token'dan userId'yi çıkar
  const [_, userId, timestamp] = token.split("-");
  if (!userId || !timestamp) {
    console.error("Invalid manual token format:", token);
    throw new Error("Invalid payment token");
  }

  console.log("Parsed payment data:", {
    userId,
    conversationId,
    paymentId,
    status,
  });

  // İyzico ile ödeme durumunu doğrulama (opsiyonel sorgulama)
  let verifiedStatus = status;
  try {
    const retrieveRequest = {
      token,
    };
    const result = await new Promise((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, (err, result) => {
        if (err) {
          console.error("Iyzico retrieve error:", JSON.stringify(err, null, 2));
          return reject(err);
        }
        resolve(result);
      });
    });
    if (result.status === "success") {
      verifiedStatus = result.status;
      console.log("Payment verified via Iyzico retrieve:", result);
    } else {
      console.error("Payment verification failed via Iyzico:", result);
      throw new Error("Payment verification failed");
    }
  } catch (error) {
    console.warn(
      "Iyzico retrieve failed, falling back to callback status:",
      error.message
    );
    // Callback status'ine güvenmeye devam et
  }

  if (verifiedStatus !== "success") {
    console.error("Payment verification failed:", { verifiedStatus });
    throw new Error("Payment failed");
  }

  const [[user]] = await pool.execute(
    "SELECT id, email FROM users WHERE id = ? AND is_active = true",
    [userId]
  );
  if (!user) {
    console.error("User not found:", userId);
    throw new Error("User not found");
  }
  console.log("User found:", { id: user.id, email: user.email });

  const versionId =
    conversationId.split("&versionId=")[1] || callbackData.versionId;
  const [[version]] = await pool.execute(
    "SELECT id, name, price, duration_days FROM versions WHERE id = ?",
    [versionId]
  );
  if (!version) {
    console.error("Version not found:", versionId);
    throw new Error("Version not found");
  }
  console.log("Version found:", {
    id: version.id,
    name: version.name,
    price: version.price,
  });

  try {
    const [insertResult] = await pool.execute(
      "INSERT INTO payments (user_id, version_id, conversation_id, iyzico_payment_id, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        version.id,
        conversationId,
        paymentId,
        version.price,
        verifiedStatus,
        token,
      ]
    );
    console.log("Payment inserted successfully:", {
      insertId: insertResult.insertId,
    });

    // Proje sahibine bildirim gönder
    await sendPaymentNotification(process.env.EMAIL_FROM, {
      userId,
      versionId: version.id,
      amount: version.price,
      paymentId,
    });
  } catch (error) {
    console.error("Error inserting payment:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to insert payment: ${error.message}`);
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + version.duration_days);
  console.log("Updating users table with:", {
    versionId: version.id,
    premiumUntil: endDate,
    userId,
  });
  await pool.execute(
    "UPDATE users SET version_id = ?, premium_until = ? WHERE id = ?",
    [version.id, endDate, userId]
  );

  const [[updatedUser]] = await pool.execute(
    `SELECT u.id, u.email, r.name as role, v.name as version, u.premium_until 
     FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN versions v ON u.version_id = v.id
     WHERE u.id = ? AND u.is_active = true`,
    [userId]
  );
  const newToken = jwt.sign(
    {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      version: updatedUser.version,
      premium_until: updatedUser.premium_until,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10h" }
  );
  console.log("Generated new JWT token:", newToken);

  await pool.execute(
    "INSERT INTO email_logs (user_id, subject, body) VALUES (?, ?, ?)",
    [
      userId,
      "Payment Successful",
      `Your premium payment has been activated for ${version.name}.`,
    ]
  );

  try {
    console.log("Sending email to:", user.email);
    await sendPaymentConfirmationEmail(
      user.email,
      version.name,
      paymentId,
      version.duration_days
    );
  } catch (emailError) {
    console.error(
      "Email sending error, but payment successful:",
      JSON.stringify(emailError, null, 2)
    );
  }

  return {
    message: "Payment Successful",
    paymentId,
    token: newToken,
  };
}

module.exports = {
  initializePayment,
  verifyPayment,
};
