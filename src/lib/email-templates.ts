export const confirmationEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>Welcome to BabaWina! 🦁</title>
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2D2D2D; -webkit-font-smoothing: antialiased;">
    
    <!-- Wrapper table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                
                <!-- Container table with max-width for desktop -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header with BabaWina mascot -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); background-color: #FBBF24; color: white; padding: 40px 30px; text-align: center;">
                            <!-- Mobile-responsive mascot image -->
                            <img src="https://babawina.co.za/images/hero/mascot002.png" alt="BabaWina Mascot" 
                                 width="100" height="100" 
                                 style="display: block; margin: 0 auto 20px auto; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); max-width: 100px; height: auto;">
                            
                            <!-- Mobile-responsive heading -->
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #ffffff; font-family: 'Inter', Arial, sans-serif; line-height: 1.3; letter-spacing: -0.5px;">
                                Welcome to BabaWina!&nbsp;🦁
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #FFFEF7;">
                            
                            <!-- Welcome Message Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF3C7; border-radius: 16px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <!-- Emoji decoration -->
                                        <div style="text-align: center; margin-bottom: 20px; font-size: 32px;">🎉</div>
                                        
                                        <p style="font-size: 18px; color: #3A3A3A; margin: 0 0 16px 0; line-height: 1.7; font-family: 'Inter', Arial, sans-serif; font-weight: 500;">
                                            Hey there, future winner!&nbsp;🏆
                                        </p>
                                        <p style="font-size: 16px; color: #3A3A3A; margin: 0 0 16px 0; line-height: 1.7; font-family: 'Inter', Arial, sans-serif;">
                                            You're just one step away from joining South Africa's most exciting gaming competition platform! 
                                            Get ready to find the ball and win amazing prizes.
                                        </p>
                                        <p style="font-size: 16px; color: #3A3A3A; margin: 0 0 20px 0; line-height: 1.7; font-family: 'Inter', Arial, sans-serif;">
                                            From PlayStation 5s to luxury cars, your next big win could be just one game away!&nbsp;🎮✨
                                        </p>
                                        <p style="text-align: right; color: #2563EB; font-weight: 600; margin: 0; font-size: 18px; font-family: 'Inter', Arial, sans-serif;">
                                            –&nbsp;Team BabaWina
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Instructions Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                <tr>
                                    <td style="text-align: center; padding: 0 20px;">
                                        <h2 style="color: #2563EB; font-size: 24px; margin: 0 0 12px 0; font-weight: 600; font-family: 'Inter', Arial, sans-serif; line-height: 1.3;">
                                            Just one more step...
                                        </h2>
                                        <p style="font-size: 16px; color: #5A5A5A; margin: 0; line-height: 1.6; font-family: 'Inter', Arial, sans-serif;">
                                            Please confirm your email address and we'll get you started on your winning journey!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="background-color: #EFF6FF; border-radius: 12px; border: 2px dashed #BFDBFE; padding: 30px 20px; text-align: center;">
                                                    <!-- Centered button -->
                                                    <div style="text-align: center;">
                                                        <!--[if mso]>
                                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="f" fillcolor="#2563EB">
                                                        <w:anchorlock/>
                                                        <center>
                                                        <![endif]-->
                                                        <a href="{{ .ConfirmationURL }}" target="_blank" 
                                                           style="display: inline-block; background-color: #2563EB; color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 18px; font-weight: 600; text-align: center; text-decoration: none; padding: 16px 40px; border-radius: 30px; letter-spacing: -0.3px; line-height: 1.3;">
                                                            🎯&nbsp;&nbsp;Confirm Email & Start Playing
                                                        </a>
                                                        <!--[if mso]>
                                                        </center>
                                                        </v:roundrect>
                                                        <![endif]-->
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- What to Expect Box -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FEF3C7; border-radius: 12px; margin: 0 0 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="color: #2563EB; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; text-align: center; font-family: 'Inter', Arial, sans-serif;">
                                            What awaits you at BabaWina:
                                        </h3>
                                        
                                        <!-- List items -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding: 0 0 12px 0;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td width="30" style="font-size: 20px; vertical-align: top; padding-top: 2px;">🎮</td>
                                                            <td style="font-size: 16px; color: #3A3A3A; font-family: 'Inter', Arial, sans-serif; line-height: 1.6;">
                                                                Daily competitions with amazing prizes
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 12px 0;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td width="30" style="font-size: 20px; vertical-align: top; padding-top: 2px;">🏆</td>
                                                            <td style="font-size: 16px; color: #3A3A3A; font-family: 'Inter', Arial, sans-serif; line-height: 1.6;">
                                                                Win PlayStation 5s, cars, and cash prizes
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 12px 0;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td width="30" style="font-size: 20px; vertical-align: top; padding-top: 2px;">⚡</td>
                                                            <td style="font-size: 16px; color: #3A3A3A; font-family: 'Inter', Arial, sans-serif; line-height: 1.6;">
                                                                Fast payouts within 48 hours
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td width="30" style="font-size: 20px; vertical-align: top; padding-top: 2px;">🔒</td>
                                                            <td style="font-size: 16px; color: #3A3A3A; font-family: 'Inter', Arial, sans-serif; line-height: 1.6;">
                                                                100% secure and licensed in South Africa
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Footer Note -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 20px; background-color: #F8F8F8; border-radius: 10px; text-align: center;">
                                        <p style="font-size: 14px; color: #777; margin: 0; line-height: 1.6; font-family: 'Inter', Arial, sans-serif;">
                                            If you didn't create an account with BabaWina, you can safely ignore this email. 
                                            No account will be created without confirmation.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 20px; text-align: center; background-color: #F0F0F0; border-top: 1px solid #E5E5E5;">
                            <p style="margin: 0 0 5px 0; font-size: 14px; color: #777; font-family: 'Inter', Arial, sans-serif;">
                                © 2025 BabaWina - South Africa's #1 Gaming Competition Platform
                            </p>
                            <p style="margin: 0; font-size: 14px; font-family: 'Inter', Arial, sans-serif;">
                                <a href="mailto:support@babawina.co.za" style="color: #2563EB; text-decoration: none; font-weight: 500;">support@babawina.co.za</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
    <!-- Mobile-specific styles -->
    <style>
        /* Fallback fonts */
        body, table, td, a, p, h1, h2, h3 {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        
        @media only screen and (max-width: 600px) {
            /* Container adjustments */
            table[style*="max-width: 600px"] {
                width: 100% !important;
                border-radius: 0 !important;
            }
            
            /* Header adjustments */
            td[style*="padding: 40px 30px"] {
                padding: 30px 20px !important;
            }
            
            /* Main content padding */
            td[style*="padding: 40px 30px"] {
                padding: 25px 20px !important;
            }
            
            /* Message box */
            td[style*="padding: 30px"] {
                padding: 25px 20px !important;
            }
            
            /* Text sizes for mobile */
            h1 { 
                font-size: 26px !important;
            }
            h2 { 
                font-size: 22px !important;
            }
            h3 { 
                font-size: 19px !important;
            }
            p { 
                font-size: 16px !important;
                line-height: 1.6 !important;
            }
            
            /* Button container */
            td[style*="padding: 30px 20px"] {
                padding: 25px 15px !important;
            }
            
            /* Button styling for mobile */
            a[href*="ConfirmationURL"] {
                font-size: 17px !important;
                padding: 16px 35px !important;
                display: inline-block !important;
                white-space: nowrap !important;
            }
            
            /* Expectations box */
            td[style*="padding: 25px"] {
                padding: 20px !important;
            }
            
            /* List items */
            td[style*="font-size: 16px"] {
                font-size: 15px !important;
            }
            
            /* Footer adjustments */
            td[style*="padding: 30px 20px"] {
                padding: 25px 20px !important;
            }
            
            /* Image size */
            img[alt="BabaWina Mascot"] {
                width: 90px !important;
                height: 90px !important;
            }
            
            /* Margins */
            table[style*="margin: 0 0 30px 0"] {
                margin-bottom: 25px !important;
            }
            
            /* Small text */
            p[style*="font-size: 14px"] {
                font-size: 13px !important;
            }
        }
        
        /* Very small devices */
        @media only screen and (max-width: 380px) {
            /* Even tighter spacing */
            td[style*="padding: 30px 20px"],
            td[style*="padding: 40px 30px"] {
                padding: 20px 15px !important;
            }
            
            td[style*="padding: 25px 20px"],
            td[style*="padding: 30px"],
            td[style*="padding: 25px"] {
                padding: 18px 15px !important;
            }
            
            /* Smaller text */
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 17px !important; }
            p { font-size: 15px !important; }
            
            /* List text */
            td[style*="font-size: 16px"] {
                font-size: 14px !important;
            }
            
            /* Smaller button */
            a[href*="ConfirmationURL"] {
                font-size: 16px !important;
                padding: 14px 28px !important;
            }
            
            /* Smaller image */
            img[alt="BabaWina Mascot"] {
                width: 80px !important;
                height: 80px !important;
            }
            
            /* Tighter margins */
            table[style*="margin: 0 0 30px 0"] {
                margin-bottom: 20px !important;
            }
        }
    </style>
    
</body>
</html>
`;
