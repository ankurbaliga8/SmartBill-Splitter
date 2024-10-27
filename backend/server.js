require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit'); // Import rate limiter
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT;

// Use your frontend's Vercel URL or localhost for development
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({
    origin: allowedOrigin, // Allow only the frontend URL
}));

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const textractClient = new TextractClient({
    region: 'us-east-1',
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set up rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: 'Too many requests, please try again later.',
});

// Function to preprocess Textract data for GPT
function preprocessTextractData(textractData) {
    const lines = [];
    textractData.Blocks.forEach(block => {
        if (block.BlockType === "LINE" && block.Text) {
            lines.push(block.Text.trim());
        }
    });
    return lines.join('\n');
}

// Function to detect currency using GPT
async function detectCurrencyWithGPT(text) {
    const messages = [
        {
            role: 'system',
            content: `
            You are an AI assistant analyzing receipt data to determine the currency.
            Instructions:
            - Based on the terms, symbols, and context within the receipt data, identify the currency as accurately as possible.
            - Common examples include:
                - "₹", "INR", "GST", "MRP", "CGST", "SGST" might indicate Indian Rupees.
                - "$", "USD" might indicate US Dollars.
                - "£", "GBP" might indicate British Pounds.
            - Respond with only the currency code in ISO format (e.g., "INR" for Indian Rupees, "USD" for US Dollars).
            `
        },
        {
            role: 'user',
            content: `Analyze the following receipt data and identify the currency:\n${text}`
        }
    ];

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
    });

    const currency = completion.choices[0]?.message?.content.trim();
    console.log("Detected Currency:", currency);
    return currency || "USD"; // Default to USD if not recognized
}

// Function to interpret structured text with GPT for items and total
async function interpretWithGPT(text) {
    const messages = [
        {
            role: 'system',
            content: `
            You are an AI assistant interpreting receipt data to extract item names, prices, discounts, and additional charges.
            Instructions:
            - Treat each item in the receipt as unique, even if it appears multiple times with the same name.
            - If you see "discount" or "savings," apply it to the previous item and show the item name with the final adjusted price only.
            - Expand any abbreviations in item names (e.g., "SB WHL MLK" becomes "Store Brand Whole Milk").
            - If you see GST, VAT, CGST, SGST or any other tax, include it as a separate item with the tax name (Indian currency if detected).
            - Calculate the total of all items after applying discounts and include this in the JSON output.
            - Output only in JSON format, with each item structured as { "item": "Item Name", "price": adjustedPrice }.
            - If you see total or sub total or sort any anything related to total (you can interpret when its value is actually sum of all items above) then don't consider it as item.
            - At the end, add a total in the format { "item": "TOTAL", "price": totalAmount }.
            `
        },
        {
            role: 'user',
            content: `Here is the receipt data:\n${text}`
        }
    ];

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
    });

    let aiResponse = completion.choices[0]?.message?.content;
    console.log("Raw GPT Response:", aiResponse); // Log for debugging

    // Clean up and parse GPT response
    aiResponse = aiResponse.replace(/```json|```/g, '').trim();
    try {
        const parsedResponse = JSON.parse(aiResponse);
        const items = parsedResponse.filter(item => item.item !== "TOTAL");

        return { items, total: parsedResponse.find(item => item.item === "TOTAL")?.price || 0 };
    } catch (error) {
        console.error("Failed to parse GPT response as JSON:", error.message);
        throw new Error("Could not parse GPT response as valid JSON");
    }
}

// Apply the rate limiter only to the `/upload-bill` endpoint
app.post('/upload-bill', limiter, upload.single('bill'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const params = { Document: { Bytes: req.file.buffer } };

    try {
        const command = new DetectDocumentTextCommand(params);
        const textractData = await textractClient.send(command);

        const structuredText = preprocessTextractData(textractData);
        console.log('Structured Text for GPT:', structuredText);

        // Step 1: Detect currency using GPT
        const currency = await detectCurrencyWithGPT(structuredText);

        // Step 2: Send preprocessed data to GPT for interpreting items and total
        let interpretedData;
        try {
            interpretedData = await interpretWithGPT(structuredText);
        } catch (parseError) {
            console.error("Error in interpreting data with GPT:", parseError.message);
            return res.status(500).send({ message: 'Error in interpreting data with GPT.', error: parseError.message });
        }

        // Send response with items, total, and currency
        res.send({
            message: 'Items interpreted successfully!',
            items: interpretedData.items,
            total: interpretedData.total,
            currency // Include detected currency in the response
        });

    } catch (err) {
        console.error('Error processing document:', err.message);
        res.status(500).send({ message: 'Error processing document.', error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});