require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    try {
        console.log("Key:", process.env.GEMINI_API_KEY);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
run();
