import nodemailer from 'nodemailer'

interface NotificationParams {
    to: string
    subject: string
    text: string
    html?: string
}

/**
 * Helper to generate a consistent, mobile-friendly HTML email layout
 */
function getBaseHtmlLayout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f6f9fc;
      padding: 24px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .header {
      background-color: #0f172a;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .brand-accent {
      color: #10b981;
    }
    .content {
      padding: 32px 24px;
      color: #334155;
      line-height: 1.6;
      font-size: 16px;
    }
    .details-box {
      background-color: #f8fafc;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
    }
    .details-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 15px;
    }
    .details-row:last-child {
      margin-bottom: 0;
    }
    .details-label {
      font-weight: 600;
      width: 140px;
      color: #475569;
      flex-shrink: 0;
    }
    .details-value {
      color: #0f172a;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 4px 0;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      .content {
        padding: 20px 16px;
      }
      .details-row {
        flex-direction: column;
      }
      .details-label {
        width: 100%;
        margin-bottom: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Sajag <span class="brand-accent">Sports</span></h1>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>Thank you for choosing Sajag Sports.</p>
        <p>If you have any questions, reply directly to this email or contact support at <a href="mailto:support@sajagsports.com">support@sajagsports.com</a></p>
        <p style="margin-top: 12px; font-size: 12px;">© ${new Date().getFullYear()} Sajag Sports. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send Email Notification using Nodemailer
 */
export async function sendEmailNotification({ to, subject, text, html }: NotificationParams) {
    const host = process.env.EMAIL_HOST
    const port = parseInt(process.env.EMAIL_PORT || '587')
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS

    if (!host || !user || !pass) {
        console.warn('Email credentials not configured. Logging email instead:')
        console.log(`TO: ${to}\nSUBJECT: ${subject}\nTEXT: ${text}`)
        return { success: true, message: 'Email logged to console (stub)' }
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        })

        await transporter.sendMail({
            from: `"Sajag Sports" <${user}>`,
            to,
            subject,
            text,
            html: html || text,
        })

        return { success: true }
    } catch (error) {
        console.error('Email sending failed:', error)
        return { success: false, error: 'Failed to send email' }
    }
}

/**
 * Send SMS Notification (Stub/Log for now)
 */
export async function sendSMSNotification(phone: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !from) {
        console.warn('SMS credentials not configured. Logging SMS instead:')
        console.log(`TO: ${phone}\nMESSAGE: ${message}`)
        return { success: true, message: 'SMS logged to console (stub)' }
    }

    try {
        console.log(`MOCKED TWILIO SMS -> TO: ${phone}, MESSAGE: ${message}`)
        return { success: true }
    } catch (error) {
        console.error('SMS sending failed:', error)
        return { success: false, error: 'Failed to send SMS' }
    }
}

/**
 * Notification Templates
 */
export const templates = {
    orderConfirmed: (orderId: string, name: string) => {
        const text = `Hi ${name},\n\nYour order #${orderId} has been confirmed. We have initiated the pickup process. You can track your order status live at ${process.env.NEXT_PUBLIC_APP_URL}/track\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Order Confirmed',
            `<p>Hi <strong>${name}</strong>,</p>
             <p>Your racquet repair order has been confirmed successfully. We have initiated the reverse pickup process with our courier partner.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">Status:</div><div class="details-value">Confirmed</div></div>
             </div>
             <p>Next steps: Please pack your racquet securely and keep it ready for collection. Our courier partner will contact you shortly.</p>
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/track" class="btn">Track Order Live</a>`
        );
        return {
            subject: `Order Confirmed - #${orderId} - Sajag Sports`,
            text,
            html,
            sms: `Hi ${name}, your Sajag Sports order #${orderId} is confirmed. Our courier partner will contact you for pickup. Track: ${process.env.NEXT_PUBLIC_APP_URL}/track`
        };
    },
    pickupScheduled: (orderId: string, awb: string, customerName: string = 'Customer') => {
        const trackingUrl = `https://shiprocket.co/tracking/${awb}`;
        const text = `Hi ${customerName},\n\nYour racquet pickup has been scheduled successfully.\n\nOrder ID: ${orderId}\nAWB Number: ${awb}\nTrack Shipment: ${trackingUrl}\n\nPlease keep the racquet packed and ready for collection.\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Pickup Scheduled',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Your reverse pickup has been scheduled successfully with our courier partner.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">AWB Number:</div><div class="details-value">${awb}</div></div>
               <div class="details-row"><div class="details-label">Tracking URL:</div><div class="details-value"><a href="${trackingUrl}" target="_blank">${trackingUrl}</a></div></div>
             </div>
             <p>Next steps: Please keep the racquet packed and ready. The courier agent will collect it shortly. You can track the pickup status in real time using the link below.</p>
             <a href="${trackingUrl}" class="btn">Track Pickup Status</a>`
        );
        return {
            subject: `Pickup Scheduled - #${orderId}`,
            text,
            html,
            sms: `Sajag Sports: Pickup scheduled for order #${orderId}. AWB: ${awb}. Track: ${trackingUrl}`
        };
    },
    quoteReady: (orderId: string, amount: number, customerName: string = 'Customer') => {
        const payUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${orderId}`;
        const text = `Hi ${customerName},\n\nOur surgeons have analyzed your racquet. The final repair cost is ₹${amount}.\n\nPlease review and pay now to proceed with the repairs: ${payUrl}\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Repair Quote Ready',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Our workshop surgeons have completed analyzing your racquet and prepared a final quote.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">Repair Amount:</div><div class="details-value"><strong>₹${amount}</strong></div></div>
             </div>
             <p>Next steps: Please review the details and make the payment to authorize our workshop to begin the repairs.</p>
             <a href="${payUrl}" class="btn">Pay & Approve Repair</a>`
        );
        return {
            subject: `Repair Quote Ready - #${orderId}`,
            text,
            html,
            sms: `Sajag Sports: Quote ready for order #${orderId}. Amount: ₹${amount}. Pay now: ${payUrl}`
        };
    },
    pickupFailedCustomer: (orderId: string, customerName: string = 'Customer') => {
        const text = `Hi ${customerName},\n\nPayment was received successfully for order #${orderId}. However, automatic pickup scheduling could not be completed. Our team has been notified and will arrange your pickup manually. No action is required from you.\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Payment Confirmed - Pickup Update',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Your payment was received successfully! However, we experienced an issue scheduling the pickup automatically.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">Status:</div><div class="details-value" style="color: #ea580c; font-weight: 600;">Manual Collection Required</div></div>
             </div>
             <p>Next steps: <strong>No action is required from you.</strong> Our administrative support team will manually coordinate with the courier partner and email/SMS you once scheduled.</p>`
        );
        return {
            subject: `Payment Confirmed - Pickup Update - #${orderId}`,
            text,
            html,
            sms: `Sajag Sports: Payment verified for order #${orderId}. Automated pickup scheduling failed. Our team will arrange collection manually.`
        };
    },
    pickupFailedAdminAlert: (orderId: string, customer: string, reason: string) => ({
        subject: `CRITICAL ALERT: Shiprocket Reverse Pickup Failed - #${orderId}`,
        text: `Logistics alert. Reverse pickup creation failed for Order #${orderId}.\n\nCustomer: ${customer}\nReason: ${reason}\n\nRequired Action: Please log into the admin panel and retry shipment creation manually.`,
        sms: `Sajag Sports Alert: Reverse pickup failed for Order #${orderId}. Reason: ${reason}`
    }),
    validationFailedAdminAlert: (orderId: string, customer: string, reason: string) => ({
        subject: `CRITICAL ALERT: Order Address/Phone Validation Failed - #${orderId}`,
        text: `Logistics alert. Order #${orderId} failed local pre-validation checks before calling Shiprocket.\n\nCustomer: ${customer}\nReason: ${reason}\n\nRequired Action: Please update the customer's phone/address details on the admin panel and retry shipment creation manually.`,
        sms: `Sajag Sports Alert: Pre-validation checks failed for Order #${orderId}. Reason: ${reason}`
    }),
    shipmentShipped: (orderId: string, awb: string, customerName: string = 'Customer') => {
        const trackingUrl = `https://shiprocket.co/tracking/${awb}`;
        const text = `Hi ${customerName},\n\nYour racket shipment has been processed successfully.\n\nOrder ID: ${orderId}\nAWB Number: ${awb}\nTrack Shipment: ${trackingUrl}\n\nYou can use the tracking link above to follow your shipment in real time.\n\nIf you have any questions, simply reply to this email or contact Sajag Sports support.\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Your Sajag Sports Shipment is Ready 🚚',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Your racquet repairs are complete! We have processed and shipped your racquet back to you.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">AWB Number:</div><div class="details-value">${awb}</div></div>
               <div class="details-row"><div class="details-label">Tracking URL:</div><div class="details-value"><a href="${trackingUrl}" target="_blank">${trackingUrl}</a></div></div>
             </div>
             <p>Next steps: You can use the tracking button below to follow your shipment in real time. If you have any questions or feedback, feel free to reply to this email.</p>
             <a href="${trackingUrl}" class="btn">Track Delivery Live</a>`
        );
        return {
            subject: `Your Sajag Sports Shipment is Ready 🚚`,
            text,
            html,
            sms: `Sajag Sports: Your racquet has been shipped back. AWB: ${awb}. Track: ${trackingUrl}`
        };
    },
    orderCompleted: (orderId: string, customerName: string = 'Customer') => {
        const text = `Hi ${customerName},\n\nYour racquet repair order #${orderId} is completed and delivered successfully. Thank you for choosing Sajag Sports!\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Order Completed',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Your racquet repair order has been delivered and completed successfully.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">Status:</div><div class="details-value" style="color: #10b981; font-weight: 600;">Delivered & Completed</div></div>
             </div>
             <p>Thank you for choosing Sajag Sports! We hope your racquet feels as good as new on the court.</p>`
        );
        return {
            subject: `Order Completed - #${orderId} - Sajag Sports`,
            text,
            html,
            sms: `Sajag Sports: Order #${orderId} is complete and delivered. Thank you!`
        };
    },
    arrivedAtWorkshop: (orderId: string, customerName: string = 'Customer') => {
        const text = `Hi ${customerName},\n\nWe have received your racquet at the Sajag Sports workshop. Our repair experts will begin working on it shortly.\n\nRegards,\nSajag Sports Team`;
        const html = getBaseHtmlLayout(
            'Racquet Received at Workshop',
            `<p>Hi <strong>${customerName}</strong>,</p>
             <p>Great news! Your racquet has safely arrived at our workshop.</p>
             <div class="details-box">
               <div class="details-row"><div class="details-label">Order ID:</div><div class="details-value">#${orderId}</div></div>
               <div class="details-row"><div class="details-label">Status:</div><div class="details-value" style="color: #10b981; font-weight: 600;">Arrived at Workshop</div></div>
             </div>
             <p>Next steps: Our service team will inspect your racquet and begin the necessary repairs. We will update you once repairs are complete or when your racquet is ready to be shipped back.</p>`
        );
        return {
            subject: `Racquet Received at Workshop - #${orderId}`,
            text,
            html,
            sms: `Sajag Sports: Your racquet has been received at our workshop for order #${orderId}. Repairs will begin shortly.`
        };
    }
}
