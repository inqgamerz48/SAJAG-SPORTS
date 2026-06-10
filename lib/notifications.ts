import nodemailer from 'nodemailer'

interface NotificationParams {
    to: string
    subject: string
    text: string
    html?: string
}

/**
 * Send Email Notification using Nodemailer
 */
export async function sendEmailNotification({ to, subject, text, html }: NotificationParams) {
    // Check for email credentials
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
        // In production, uncomment this:
        /*
        const client = require('twilio')(accountSid, authToken);
        await client.messages.create({
          body: message,
          from: from,
          to: phone
        });
        */
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
    orderConfirmed: (orderId: string, name: string) => ({
        subject: `Order Confirmed - #${orderId} - Sajag Sports`,
        text: `Hi ${name}, your order #${orderId} has been confirmed. We have initiated the pickup process. You can track your order at ${process.env.NEXT_PUBLIC_APP_URL}/track`,
        sms: `Hi ${name}, your Sajag Sports order #${orderId} is confirmed. Our courier partner will contact you for pickup. Track: ${process.env.NEXT_PUBLIC_APP_URL}/track`
    }),
    pickupScheduled: (orderId: string, awb: string) => ({
        subject: `Pickup Scheduled - #${orderId}`,
        text: `Your racquet pickup has been scheduled. AWB: ${awb}. Please keep the racquet packed and ready.`,
        sms: `Sajag Sports: Pickup scheduled for order #${orderId}. AWB: ${awb}. Please keep the racquet ready.`
    }),
    quoteReady: (orderId: string, amount: number) => ({
        subject: `Repair Quote Ready - #${orderId}`,
        text: `Our surgeons have analyzed your racquet. The final repair cost is ₹${amount}. Please pay now to proceed: ${process.env.NEXT_PUBLIC_APP_URL}/pay/${orderId}`,
        sms: `Sajag Sports: Quote ready for order #${orderId}. Amount: ₹${amount}. Pay now: ${process.env.NEXT_PUBLIC_APP_URL}/pay/${orderId}`
    }),
    pickupFailedCustomer: (orderId: string) => ({
        subject: `Payment Confirmed - Pickup Update - #${orderId}`,
        text: `Payment received successfully for order #${orderId}. However, automatic pickup scheduling could not be completed at this time. Our team has been notified and will arrange your pickup manually. No action is required from you.`,
        sms: `Sajag Sports: Payment verified for order #${orderId}. Automated pickup scheduling failed. Our team will arrange collection manually.`
    }),
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
    shipmentShipped: (orderId: string, awb: string) => ({
        subject: `Your Racquet is on its Way Back! - #${orderId}`,
        text: `Repairs are complete! Your racquet has been shipped back to you. Waybill/AWB Code: ${awb}. Track live updates on our portal.`,
        sms: `Sajag Sports: Your racquet has been shipped back. AWB: ${awb}. Track: ${process.env.NEXT_PUBLIC_APP_URL}/track`
    }),
    orderCompleted: (orderId: string) => ({
        subject: `Order Completed - #${orderId} - Sajag Sports`,
        text: `Your racquet repair order #${orderId} is completed and delivered. Thank you for choosing Sajag Sports!`,
        sms: `Sajag Sports: Order #${orderId} is complete and delivered. Thank you!`
    })
}
