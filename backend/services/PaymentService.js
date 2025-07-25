const Iyzipay = require("iyzipay");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken"); // JWT için ekledik
require("dotenv").config();
const { pool } = require("../db.js");

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
      <p>Dear User,</p>
      <p>Your GTFS Editor Premium subscription has been successfully activated. Details below:</p>
      <ul>
        <li><strong>Plan Name:</strong> ${versionName}</li>
        <li><strong>Duration:</strong> ${durationDays} days</li>
        <li><strong>Payment ID:</strong> ${paymentId}</li>
      </ul>
      <p>You now have full access to all Premium features! If you have any questions, please contact us at aytkn2003emir05@gmail.com.</p>
      <p>Have a good day. Thank you for choosing us.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${userEmail}`);
  } catch (error) {
    console.error(`Email sending error: ${userEmail}`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Versiyonları iyzico ile senkronize etme
async function syncVersionsToIyzico() {
  const [versions] = await pool.execute("SELECT * FROM versions");
  for (const version of versions) {
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
      await pool.execute(
        "UPDATE versions SET iyzico_product_reference = ?, iyzico_plan_reference = ? WHERE id = ?",
        [product.data.referenceCode, plan.data.referenceCode, version.id]
      );
    } catch (error) {
      console.error(
        `Error: Failed to create iyzico record for ${version.name}`,
        error
      );
      throw new Error(`Version synchronization failed: ${error.message}`);
    }
  }
  return { message: "Versions synchronized with iyzico" };
}

// İyzico'da ürün oluşturma
async function createProduct(name, description) {
  const request = { name, description };
  return new Promise((resolve, reject) => {
    iyzipay.subscriptionProduct.create(request, (err, result) => {
      if (err) {
        console.error("Error creating product:", err);
        return reject(err);
      }
      if (result.status !== "success") {
        console.error("Product creation response:", result);
        return reject(new Error("Product creation failed"));
      }
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
  return new Promise((resolve, reject) => {
    iyzipay.pricingPlan.create(request, (err, result) => {
      if (err) {
        console.error("Error creating plan:", err);
        return reject(err);
      }
      if (result.status !== "success") {
        console.error("Plan creation response:", result);
        return reject(new Error("Plan creation failed"));
      }
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

  console.log(
    "Initializing payment for userId:",
    userId,
    "versionId:",
    parsedVersionId
  );

  // Kullanıcıyı kontrol et
  const [[user]] = await pool.execute(
    "SELECT * FROM users WHERE id = ? AND is_active = true",
    [userId]
  );
  if (!user) {
    console.error("User not found:", userId);
    throw new Error("User not found");
  }
  console.log("User found:", { id: user.id, email: user.email });

  // Versiyonu kontrol et
  const [[version]] = await pool.execute(
    "SELECT * FROM versions WHERE id = ?",
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

  // Ödeme kaydını ekle
  try {
    const [insertResult] = await pool.execute(
      "INSERT INTO payments (user_id, version_id, conversation_id, amount, status, token) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, parsedVersionId, conversationId, version.price, "PENDING", null]
    );
    console.log("Payment inserted successfully:", {
      insertId: insertResult.insertId,
    });

    // Eklenen kaydı doğrula
    const [[insertedPayment]] = await pool.execute(
      "SELECT * FROM payments WHERE id = ?",
      [insertResult.insertId]
    );
    console.log("Inserted payment:", insertedPayment);
  } catch (error) {
    console.error("Error inserting payment:", error);
    throw new Error(`Failed to insert payment: ${error.message}`);
  }

  const request = {
    locale: "tr",
    conversationId,
    price: version.price.toString(),
    paidPrice: version.price.toString(),
    currency: "TRY",
    basketId: `BASKET-${userId}`,
    paymentGroup: "SUBSCRIPTION",
    callbackUrl:
      process.env.IYZICO_CALLBACK_URL ||
      "https://1cc183d43f9b.ngrok-free.app/api/payment/callback",
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

  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        console.error("Iyzico error:", err);
        return reject(
          new Error(`Iyzico payment initiation error: ${err.message || err}`)
        );
      }
      if (result.status !== "success" || !result.checkoutFormContent) {
        console.error("Iyzico response:", result);
        return reject(
          new Error(
            `Failed to retrieve Iyzico form content: ${
              result.errorMessage || "Unknown error"
            }`
          )
        );
      }
      console.log("Iyzico response:", result);

      // Ödeme token'ını güncelle
      try {
        const [updateResult] = await pool.execute(
          "UPDATE payments SET token = ? WHERE conversation_id = ?",
          [result.token, conversationId]
        );
        console.log("Payment token updated:", {
          token: result.token,
          conversationId,
          affectedRows: updateResult.affectedRows,
        });
        if (updateResult.affectedRows === 0) {
          console.error(
            "No payment found to update token for conversationId:",
            conversationId
          );
          throw new Error("Failed to update payment token: No record found");
        }

        // Token'ın kaydedildiğini doğrula
        const [[updatedPayment]] = await pool.execute(
          "SELECT * FROM payments WHERE token = ?",
          [result.token]
        );
        console.log("Updated payment with token:", updatedPayment);
        if (!updatedPayment) {
          console.error(
            "Token not found in database after update:",
            result.token
          );
          throw new Error("Failed to verify token in database");
        }
      } catch (error) {
        console.error("Error updating payment token:", error);
        throw new Error(`Failed to update payment token: ${error.message}`);
      }

      resolve({
        paymentPageUrl: result.paymentPageUrl,
        payWithIyzicoPageUrl: result.payWithIyzicoPageUrl,
        checkoutFormContent: result.checkoutFormContent,
      });
    });
  });
}

// Ödeme doğrulama ve abonelik oluşturma
async function verifyPayment(token) {
  console.log("Starting verifyPayment with token:", token);

  return new Promise((resolve, reject) => {
    // Token ile ödeme bilgisini al
    pool
      .execute(
        "SELECT conversation_id, user_id, version_id, status FROM payments WHERE token = ?",
        [token]
      )
      .then(([rows]) => {
        console.log("Raw query result:", rows);
        if (!rows || rows.length === 0) {
          console.error("No payment found for token:", token);
          return reject(new Error("No payment found for token"));
        }
        const payment = rows[0];
        const {
          conversation_id: conversationId,
          user_id: userId,
          version_id: versionId,
          status,
        } = payment;
        console.log("Payment found:", {
          conversationId,
          userId,
          versionId,
          status,
        });

        // Ödeme zaten işlenmişse hata döndür
        if (status === "SUCCESS") {
          console.warn("Payment already processed for token:", token);
          return resolve({
            message: "Payment already processed",
            paymentId: null,
          });
        }

        iyzipay.checkoutForm.retrieve({ token }, async (err, result) => {
          console.log(
            "Iyzico verify response:",
            JSON.stringify(result, null, 2)
          );
          if (err || result.status !== "success") {
            try {
              await pool.execute(
                "UPDATE payments SET status = ? WHERE conversation_id = ?",
                ["FAILED", conversationId]
              );
              console.log(
                "Payment status updated to FAILED for conversationId:",
                conversationId
              );
            } catch (e) {
              console.error("Error updating payment status to FAILED:", e);
            }
            console.error("Payment verification error:", err || result);
            return reject(new Error("Payment failed"));
          }

          // Version bilgisini al
          const [[version]] = await pool.execute(
            "SELECT * FROM versions WHERE id = ?",
            [versionId]
          );
          if (!version) {
            try {
              await pool.execute(
                "UPDATE payments SET status = ? WHERE conversation_id = ?",
                ["FAILED", conversationId]
              );
              console.log(
                "Payment status updated to FAILED for conversationId:",
                conversationId
              );
            } catch (e) {
              console.error("Error updating payment status to FAILED:", e);
            }
            console.error("Version not found:", versionId);
            return reject(new Error("Version not found"));
          }
          console.log("Version found:", version);

          // Iyzico referanslarını kontrol et
          const subscriptionReferenceCode =
            result.subscriptionReferenceCode ?? null;
          const customerReferenceCode = result.customerReferenceCode ?? null;
          console.log("Iyzico references:", {
            subscriptionReferenceCode,
            customerReferenceCode,
          });

          // Ödeme güncelleme
          console.log("Updating payments table with:", {
            paymentId: result.paymentId,
            subscriptionReferenceCode,
            status: "SUCCESS",
            conversationId,
          });
          await pool.execute(
            "UPDATE payments SET iyzico_payment_id = ?, iyzico_subscription_reference = ?, status = ? WHERE conversation_id = ?",
            [
              result.paymentId,
              subscriptionReferenceCode,
              "SUCCESS",
              conversationId,
            ]
          );

          // Kullanıcıyı premium yap
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + version.duration_days);
          console.log("Updating users table with:", {
            versionId,
            premiumUntil: endDate,
            subscriptionReferenceCode,
            customerReferenceCode,
            userId,
          });
          await pool.execute(
            "UPDATE users SET version_id = ?, premium_until = ?, iyzico_subscription_reference = ?, iyzico_customer_reference = ? WHERE id = ?",
            [
              versionId,
              endDate,
              subscriptionReferenceCode,
              customerReferenceCode,
              userId,
            ]
          );

          // Yeni JWT token oluştur
          const [[user]] = await pool.execute(
            `SELECT u.id, u.email, r.name as role, v.name as version, u.premium_until 
             FROM users u
             JOIN roles r ON u.role_id = r.id
             JOIN versions v ON u.version_id = v.id
             WHERE u.id = ? AND u.is_active = true`,
            [userId]
          );
          const newToken = jwt.sign(
            {
              id: user.id,
              email: user.email,
              role: user.role,
              version: user.version,
              premium_until: user.premium_until,
            },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
          );
          console.log("Generated new JWT token:", newToken);

          // E-posta logu ekle
          console.log("Inserting email log with:", {
            userId,
            subject: "Payment Successful",
            body: `Your Premium subscription has been activated for ${version.name}.`,
          });
          await pool.execute(
            "INSERT INTO email_logs (user_id, subject, body) VALUES (?, ?, ?)",
            [
              userId,
              "Payment Successful",
              `Your Premium subscription has been activated for ${version.name}.`,
            ]
          );

          // Kullanıcıya e-posta gönder
          try {
            const [[user]] = await pool.execute(
              "SELECT email FROM users WHERE id = ?",
              [userId]
            );
            console.log("Sending email to:", user.email);
            await sendPaymentConfirmationEmail(
              user.email,
              version.name,
              result.paymentId,
              version.duration_days
            );
          } catch (emailError) {
            console.error(
              "Email sending error, but payment successful:",
              emailError
            );
          }

          resolve({
            message: "Payment Successful",
            paymentId: result.paymentId,
            token: newToken, // Yeni token'ı döndür
          });
        });
      })
      .catch((error) => {
        console.error("Verify payment error:", error);
        reject(new Error(`Payment verification failed: ${error.message}`));
      });
  });
}

module.exports = {
  syncVersionsToIyzico,
  initializePayment,
  verifyPayment,
};
