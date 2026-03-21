require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("Error:", data.error);
        } else {
            console.log("Models:", data.models.map(m => m.name));
        }
    })
    .catch(err => console.error(err));
