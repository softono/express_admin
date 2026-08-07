import config from "@/config";

export async function renderEmailLayout(body: string): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.APP_NAME}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff; border-radius:8px; overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style=" padding:20px 30px;  font-size:24px; font-weight:bold; text-align:center;">
                    <img src="${config.APP_LOGO}" alt="${config.APP_NAME}" style="max-width:100px; height:50px;" />

                  </td>
                </tr>
 <tr>
                <td style="height:4px; background-color:#85b33a;"></td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:20px; font-family: Arial, sans-serif; font-size:16px; color:#333;">
                    ${body}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f0f0f0; padding:20px 30px; text-align:center; color:#888; font-size:13px;">
                    &copy; ${new Date().getFullYear()}. All rights reserved.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
