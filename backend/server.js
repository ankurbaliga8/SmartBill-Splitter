require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const textractClient = new TextractClient({
    region: 'us-east-1',
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to process Textract data and prepare it for GPT interpretation
function preprocessTextractData(textractData) {
    const lines = [];
    textractData.Blocks.forEach(block => {
        if (block.BlockType === "LINE" && block.Text) {
            lines.push(block.Text.trim());
        }
    });
    return lines.join('\n'); // Join lines for better context in GPT
}

// Function to interpret structured text with GPT, applying discount logic and expanding names
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
            - Calculate the total of all items after applying discounts and include this in the JSON output.
            - Output only in JSON format, with each item structured as { "item": "Item Name", "price": adjustedPrice }.
            - If you see total or sub total or sort any anything related to total (you can interpret when its value is actually sum of all items above) then don't consider it as item.
            - At the end, add a total in the format { "item": "TOTAL", "price": totalAmount }.

            Example Output:
            [
                { "item": "Wonder Classic White Bread", "price": 2.99 },
                { "item": "Wonder Classic White Bread", "price": 2.99 }, // Same item repeated as unique
                { "item": "Store Brand Whole Milk", "price": 3.00 },
                { "item": "Tax", "price": 0.30 },
                { "item": "TOTAL", "price": 32.46 }
            ]
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

    // Clean up the response by removing any code block markers and trimming whitespace
    aiResponse = aiResponse.replace(/```json|```/g, '').trim();

    // Attempt to parse the cleaned response as JSON
    try {
        const parsedResponse = JSON.parse(aiResponse);

        // Filter out the TOTAL item from the parsed response before sending back to frontend
        const items = parsedResponse.filter(item => item.item !== "TOTAL");

        return { items, total: parsedResponse.find(item => item.item === "TOTAL")?.price || 0 };
    } catch (error) {
        console.error("Failed to parse GPT response as JSON:", error.message);
        throw new Error("Could not parse GPT response as valid JSON");
    }
}

app.post('/upload-bill', upload.single('bill'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const params = { Document: { Bytes: req.file.buffer } };

    try {
        const command = new DetectDocumentTextCommand(params);
        const textractData = await textractClient.send(command);

        // Preprocess Textract data for GPT
        const structuredText = preprocessTextractData(textractData);
        console.log('Structured Text for GPT:', structuredText);

        // Send preprocessed data to GPT for interpretation
        let interpretedData;
        try {
            interpretedData = await interpretWithGPT(structuredText);
        } catch (parseError) {
            console.error("Error in interpreting data with GPT:", parseError.message);
            return res.status(500).send({ message: 'Error in interpreting data with GPT.', error: parseError.message });
        }

        res.send({
            message: 'Items interpreted successfully!',
            items: interpretedData.items,
            total: interpretedData.total // Send total as a separate field
        });

    } catch (err) {
        console.error('Error processing document:', err.message);
        res.status(500).send({ message: 'Error processing document.', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});










