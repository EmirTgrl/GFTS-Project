const Iyzipay = require("iyzipay");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { pool } = require("../db.js");

// Geçici olarak token ve userId/conversationId/versionId saklamak için Map
const paymentSessions = new Map();

const iyzipay = new Iyzipay({
  apiKey:
    process.env.IYZICO_API_KEY || "sandbox-tAO3e0CJPoHiEKJVpNvQ8FEb0ecOODKj",
  secretKey:
    process.env.IYZICO_SECRET_KEY || "sandbox-HeTlSAJqUwINjNKXgh1te0Y3elnJkKbT",
  uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
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

// E-posta gönderme fonksiyonu
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
    console.log(`Email sent: ${userEmail}`);
  } catch (error) {
    console.error(
      `Email sending error: ${userEmail}`,
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Versiyonları iyzico ile senkronize etme (gerekirse kullanılır)
async function syncVersionsToIyzico() {
  console.log("Starting syncVersionsToIyzico at:", new Date().toISOString());
  try {
    const [versions] = await pool.execute(
      "SELECT * FROM versions WHERE name != 'basic'"
    );
    if (!versions.length) {
      console.error("No premium versions found in database");
      throw new Error("No premium versions available to sync");
    }
    console.log(
      "Found versions to sync:",
      JSON.stringify(
        versions.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          duration_days: v.duration_days,
        })),
        null,
        2
      )
    );

    for (const version of versions) {
      console.log(`Syncing version: ${version.name} (ID: ${version.id})`);
      try {
        const product = await createProduct(
          version.name,
          `Subscription plan: ${version.name}`
        );
        const plan = await createPricingPlan(
          product.data.referenceCode,
          version.name,
          version.price,
          "TRY",
          "MONTHLY",
          1,
          version.duration_days
        );
        const [updateResult] = await pool.execute(
          "UPDATE versions SET iyzico_product_reference = ?, iyzico_plan_reference = ? WHERE id = ?",
          [product.data.referenceCode, plan.data.referenceCode, version.id]
        );
        if (updateResult.affectedRows === 0) {
          console.error(
            `Failed to update version ${version.name} (ID: ${version.id}) in database`
          );
          throw new Error(`Failed to update version ${version.name}`);
        }
        console.log(`Successfully synced ${version.name} (ID: ${version.id})`);
      } catch (error) {
        console.error(
          `Error syncing version ${version.name}:`,
          JSON.stringify(error, null, 2)
        );
        throw new Error(
          `Version synchronization failed for ${version.name}: ${error.message}`
        );
      }
    }
    return { message: "All versions synchronized with iyzico" };
  } catch (error) {
    console.error("Sync versions error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to sync versions: ${error.message}`);
  }
}

// İyzico'da ürün oluşturma
async function createProduct(name, description) {
  const request = { name, description };
  console.log("Creating product:", JSON.stringify(request, null, 2));
  return new Promise((resolve, reject) => {
    iyzipay.subscriptionProduct.create(request, (err, result) => {
      if (err) {
        console.error("Error creating product:", JSON.stringify(err, null, 2));
        return reject(
          new Error(
            `Product creation failed: ${err.message || JSON.stringify(err)}`
          )
        );
      }
      if (result.status !== "success") {
        console.error(
          "Product creation response:",
          JSON.stringify(result, null, 2)
        );
        return reject(
          new Error(
            `Product creation failed: ${
              result.errorCode || "Unknown error"
            } - ${result.errorMessage || "Unknown error"}`
          )
        );
      }
      console.log("Product created:", JSON.stringify(result.data, null, 2));
      resolve(result);
    });
  });
}

// İyzico'da ödeme planı oluşturma
async function createPricingPlan(
  productReferenceCode,
  name,
  price,
  currency,
  paymentInterval,
  paymentIntervalCount,
  trialPeriodDays
) {
  const request = {
    productReferenceCode,
    name,
    price: price.toString(),
    currency,
    paymentInterval,
    paymentIntervalCount,
    trialPeriodDays: trialPeriodDays.toString(),
  };
  console.log("Creating pricing plan:", JSON.stringify(request, null, 2));
  return new Promise((resolve, reject) => {
    iyzipay.pricingPlan.create(request, (err, result) => {
      if (err) {
        console.error("Error creating plan:", JSON.stringify(err, null, 2));
        return reject(
          new Error(
            `Plan creation failed: ${err.message || JSON.stringify(err)}`
          )
        );
      }
      if (result.status !== "success") {
        console.error(
          "Plan creation response:",
          JSON.stringify(result, null, 2)
        );
        return reject(
          new Error(
            `Plan creation failed: ${result.errorCode || "Unknown error"} - ${
              result.errorMessage || "Unknown error"
            }`
          )
        );
      }
      console.log("Plan created:", JSON.stringify(result.data, null, 2));
      resolve(result);
    });
  });
}

// Ödeme formu başlatma
async function initializePayment(userId, versionId) {
  console.log("Starting initializePayment with:", { userId, versionId });

  const parsedVersionId = parseInt(versionId, 10);
  if (isNaN(parsedVersionId)) {
    console.error("Invalid versionId:", versionId);
    throw new Error("Invalid version ID");
  }

  // Kullanıcıyı kontrol et
  const [[user]] = await pool.execute(
    "SELECT id, email FROM users WHERE id = ? AND is_active = true",
    [userId]
  );
  if (!user) {
    console.error("User not found:", userId);
    throw new Error("User not found");
  }
  console.log("User found:", { id: user.id, email: user.email });

  // Versiyonu kontrol et
  const [[version]] = await pool.execute(
    "SELECT id, name, price, duration_days FROM versions WHERE id = ?",
    [parsedVersionId]
  );
  if (!version) {
    console.error("Version not found:", parsedVersionId);
    throw new Error("Version not found");
  }
  console.log("Version found:", {
    id: version.id,
    name: version.name,
    price: version.price,
  });

  const conversationId = `order-${userId}-${Date.now()}`;
  console.log("Generated conversation ID:", conversationId);

  const request = {
    locale: "tr",
    conversationId,
    price: version.price.toString(),
    paidPrice: version.price.toString(),
    currency: "TRY",
    basketId: `BASKET-${userId}`,
    paymentGroup: "SUBSCRIPTION",
    callbackUrl: process.env.IYZICO_CALLBACK_URL,
    buyer: {
      id: userId.toString(),
      name: user.email.split("@")[0],
      surname: "User",
      email: user.email,
      identityNumber: "11111111111",
      registrationAddress: "N/A",
      city: "Istanbul",
      country: "Turkey",
    },
    billingAddress: {
      contactName: user.email.split("@")[0],
      city: "Istanbul",
      country: "Turkey",
      address: "N/A",
      zipCode: "34000",
    },
    basketItems: [
      {
        id: parsedVersionId.toString(),
        name: version.name,
        category1: "Subscription",
        itemType: "VIRTUAL",
        price: version.price.toString(),
      },
    ],
  };
  console.log("Iyzico checkout request:", JSON.stringify(request, null, 2));

  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        console.error("Iyzico error:", JSON.stringify(err, null, 2));
        return reject(
          new Error(
            `Iyzico payment initiation error: ${
              err.message || JSON.stringify(err)
            }`
          )
        );
      }
      if (result.status !== "success" || !result.checkoutFormContent) {
        console.error("Iyzico response:", JSON.stringify(result, null, 2));
        return reject(
          new Error(
            `Failed to retrieve Iyzico form content: ${
              result.errorMessage || "Unknown error"
            }`
          )
        );
      }
      console.log("Iyzico response:", JSON.stringify(result, null, 2));

      // Token ve userId/conversationId/versionId'yi geçici olarak sakla
      paymentSessions.set(result.token, {
        userId,
        conversationId,
        versionId: parsedVersionId,
      });
      console.log("Stored in paymentSessions:", {
        token: result.token,
        userId,
        conversationId,
        versionId: parsedVersionId,
      });

      // 30 dakika sonra token'ı temizle (iyzico token expire süresi)
      setTimeout(() => {
        paymentSessions.delete(result.token);
        console.log("Cleaned up paymentSession for token:", result.token);
      }, 30 * 60 * 1000);

      resolve({
        paymentPageUrl: result.paymentPageUrl,
        payWithIyzicoPageUrl: result.payWithIyzicoPageUrl,
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
        conversationId,
      });
    });
  });
}

// Ödeme doğrulama ve abonelik oluşturma
async function verifyPayment(token) {
  console.log("Starting verifyPayment with token:", token);

  return new Promise((resolve, reject) => {
    // Ödeme oturumundan userId, conversationId ve versionId al
    const session = paymentSessions.get(token);
    if (!session) {
      console.error("No payment session found for token:", token);
      return reject(new Error("Invalid or expired payment token"));
    }
    const { userId, conversationId, versionId } = session;
    console.log("Retrieved from paymentSessions:", {
      userId,
      conversationId,
      versionId,
    });

    iyzipay.checkoutForm.retrieve({ token }, async (err, result) => {
      console.log("Iyzico verify response:", JSON.stringify(result, null, 2));
      if (err || result.status !== "success") {
        console.error(
          "Payment verification error:",
          JSON.stringify(err || result, null, 2)
        );
        // Ödeme başarısızsa session'ı temizle
        paymentSessions.delete(token);
        console.log("Cleaned up paymentSession for token:", token);
        return reject(
          new Error(
            `Payment failed: ${
              err?.message || result.errorMessage || "Unknown error"
            }`
          )
        );
      }

      // Ödeme bilgilerini al
      const paymentId = result.paymentId;
      const amount = parseFloat(result.paidPrice);
      console.log("Parsed payment data:", {
        conversationId,
        userId,
        versionId,
        paymentId,
        amount,
      });

      // Kullanıcıyı kontrol et
      const [[user]] = await pool.execute(
        "SELECT id, email FROM users WHERE id = ? AND is_active = true",
        [userId]
      );
      if (!user) {
        console.error("User not found:", userId);
        paymentSessions.delete(token);
        return reject(new Error("User not found"));
      }
      console.log("User found:", { id: user.id, email: user.email });

      // Versiyonu kontrol et
      const [[version]] = await pool.execute(
        "SELECT id, name, price, duration_days FROM versions WHERE id = ?",
        [versionId]
      );
      if (!version) {
        console.error("Version not found:", versionId);
        paymentSessions.delete(token);
        return reject(new Error("Version not found"));
      }
      console.log("Version found:", {
        id: version.id,
        name: version.name,
        price: version.price,
      });

      // Ödeme kaydını ekle (sadece başarılıysa)
      try {
        const [insertResult] = await pool.execute(
          "INSERT INTO payments (user_id, version_id, conversation_id, iyzico_payment_id, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            userId,
            versionId,
            conversationId,
            paymentId,
            amount,
            "SUCCESS",
            token,
          ]
        );
        console.log("Payment inserted successfully:", {
          insertId: insertResult.insertId,
        });

        // Eklenen kaydı doğrula
        const [[insertedPayment]] = await pool.execute(
          "SELECT * FROM payments WHERE id = ?",
          [insertResult.insertId]
        );
        console.log(
          "Inserted payment:",
          JSON.stringify(insertedPayment, null, 2)
        );
      } catch (error) {
        console.error(
          "Error inserting payment:",
          JSON.stringify(error, null, 2)
        );
        paymentSessions.delete(token);
        throw new Error(`Failed to insert payment: ${error.message}`);
      }

      // Kullanıcıyı premium yap
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + version.duration_days);
      console.log("Updating users table with:", {
        versionId,
        premiumUntil: endDate,
        userId,
      });
      await pool.execute(
        "UPDATE users SET version_id = ?, premium_until = ? WHERE id = ?",
        [versionId, endDate, userId]
      );

      // Yeni JWT token oluştur
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

      // E-posta logu ekle
      console.log("Inserting email log with:", {
        userId,
        subject: "Payment Successful",
        body: `Your premium payment has been activated for ${version.name}.`,
      });
      await pool.execute(
        "INSERT INTO email_logs (user_id, subject, body) VALUES (?, ?, ?)",
        [
          userId,
          "Payment Successful",
          `Your premium payment has been activated for ${version.name}.`,
        ]
      );

      // Kullanıcıya e-posta gönder
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

      // Ödeme başarılı, session'ı temizle
      paymentSessions.delete(token);
      console.log("Cleaned up paymentSession for token:", token);

      resolve({
        message: "Payment Successful",
        paymentId,
        token: newToken,
      });
    });
  });
}

module.exports = {
  syncVersionsToIyzico,
  initializePayment,
  verifyPayment,
};
