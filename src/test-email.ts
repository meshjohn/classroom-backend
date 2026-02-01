import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
    console.log("--- Email Configuration Check ---");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    
    const pass = process.env.SMTP_PASS || "";
    const maskedPass = pass.length > 0 
        ? `${pass.slice(0, 2)}...${pass.slice(-2)} (${pass.length} chars)` 
        : "Not Set";
    console.log("SMTP_PASS:", maskedPass);

    const port = parseInt(process.env.SMTP_PORT || "465");
    const secure = port === 465;
    
    console.log(`Config: Port ${port}, Secure: ${secure}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection Successful! Credentials are valid.");
    } catch (error: any) {
        console.error("❌ Connection Failed:", error.message);
        if (error.responseCode === 535) {
            console.log("\nPossible Causes for 535:");
            console.log("1. App Password is incorrect (should be 16 chars).");
            console.log("2. SMTP_USER does not match the account used to generate the App Password.");
            console.log("3. Leading/trailing spaces in .env file.");
        }
    }
}

main();
