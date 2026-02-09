export const otpEmailTemplate = (
  orderId: string,
  otp: string,
  subject: string,
  text: string,
) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Template</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #eaeaea;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .logo {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }
        
        .logo-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        
        .content {
          padding: 40px 30px;
          color: #333333;
        }
        
        .title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #2d3748;
        }
        
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #4a5568;
          margin-bottom: 30px;
        }
        
        .otp-container {
          background-color: #f7fafc;
          border-radius: 10px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .otp-code {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #2d3748;
          margin: 15px 0;
          font-family: 'Courier New', monospace;
        }
        
        .order-id {
          background-color: #edf2f7;
          padding: 12px 20px;
          border-radius: 8px;
          display: inline-block;
          font-weight: 600;
          color: #4a5568;
          margin-top: 10px;
        }
        
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .info-box p {
          margin: 5px 0;
          color: #4b5563;
        }
        
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #718096;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .warning {
          color: #e53e3e;
          font-weight: 500;
          margin-top: 25px;
          padding: 15px;
          background-color: #fff5f5;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #fed7d7;
        }
        
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 30px 0;
        }
        
        @media (max-width: 600px) {
          .header {
            padding: 30px 20px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .otp-code {
            font-size: 36px;
            letter-spacing: 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🦀 Crab Fashion</div>
          <div class="logo-subtitle">Style that speaks volumes</div>
        </div>
        
        <div class="content">
          <h1 class="title">${subject}</h1>
          
          <div class="message">
            ${text}
          </div>
          
          ${
            orderId
              ? `
          <div class="order-id">
            Order ID: ${orderId}
          </div>
          `
              : ""
          }
          
          ${
            otp
              ? `
          <div class="divider"></div>
          
          <div class="otp-container">
            <p style="margin-bottom: 15px; color: #4a5568; font-size: 16px;">Your One-Time Password</p>
            <div class="otp-code">${otp}</div>
            <p style="color: #718096; font-size: 14px;">Enter this code to verify your order</p>
          </div>
          `
              : ""
          }
          
          ${
            otp
              ? `
          <div class="info-box">
            <p><strong>⚠️ Important Security Notice:</strong></p>
            <p>• This OTP will expire in <strong>2 minutes</strong></p>
            <p>• Never share this code with anyone</p>
            <p>• Crab Fashion will never ask for your password or OTP</p>
          </div>
          `
              : ""
          }
          
          <div class="warning">
            ⏰ Please use the OTP within 2 minutes. After expiration, you'll need to request a new one.
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Crab Fashion. All rights reserved.</p>
          <p style="margin-top: 10px; font-size: 13px; color: #a0aec0;">
            This is an automated email, please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
