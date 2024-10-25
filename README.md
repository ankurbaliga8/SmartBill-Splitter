# Smart Bill Splitter

An AI-powered application to interpret and split expenses from scanned or uploaded bills among multiple users. Built with Node.js, Express, AWS Textract, OpenAI, and React, this app allows you to upload an image of a bill, automatically extract and interpret item details, assign costs to users, and calculate individual totals based on selections.

## Features

- **Automated Bill Parsing**: Uses AWS Textract and OpenAI to read and interpret items, prices, discounts, and final totals from scanned receipts.
- **Dynamic Price Editing**: Users can edit interpreted prices for each item if they spot any discrepancies.
- **Custom Item Addition**: Add any missed items manually.
- **User Assignment and Cost Split**: Assign items to individuals and split the total accordingly.
- **Live Total Calculation**: Updates the total dynamically based on item prices and user assignments.

## Technologies Used

- **Backend**: Node.js, Express, AWS Textract, OpenAI API
- **Frontend**: React, Axios, HTML, CSS
- **Dependencies**:
  - `dotenv` - For environment variable management
  - `multer` - For file uploads
  - `aws-sdk/client-textract` - For document text extraction
  - `OpenAI` - For interpreting extracted text into structured data
  - `axios` - For handling HTTP requests in the frontend

## Getting Started

### Prerequisites

- **Node.js** and **npm** installed on your local machine.
- AWS account with permissions for **Textract**.
- OpenAI API key.
- An `.env` file configured as follows:

  ```
  OPENAI_API_KEY=your_openai_api_key
  AWS_ACCESS_KEY_ID=your_aws_access_key
  AWS_SECRET_ACCESS_KEY=your_aws_secret_key
  ```

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/smart-bill-splitter.git
   cd smart-bill-splitter
   ```

2. **Set Up Environment Variables**: Create an `.env` file in the backend directory with the following keys:

   ```plaintext
   OPENAI_API_KEY=your_openai_api_key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

3. **Install Backend Dependencies**: Navigate to the backend directory and install dependencies:

   ```bash
   cd backend
   npm install express cors multer dotenv @aws-sdk/client-textract openai
   ```

4. **Install Frontend Dependencies**: Navigate to the frontend directory and install dependencies:

   ```bash
   cd ../frontend
   npm install axios react react-dom
   ```

### Usage

#### Running the Backend Server

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Start the server:

   ```bash
   node server.js
   ```

   The server should start on http://localhost:3001.

#### Running the Frontend

1. Navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

2. Start the React development server:

   ```bash
   npm start
   ```

   The frontend should now be running at http://localhost:3000.

### Project Structure

```bash
smart-bill-splitter/
├── .gitignore           # Git ignore file for the entire project
├── backend/
│   ├── server.js        # Main backend server code
│   ├── .env             # Environment variables
│   ├── package.json     # Backend dependencies
│   ├── node_modules/    # Backend Node.js modules (ignored by .gitignore)
├── frontend/
│   ├── src/
│   │   ├── App.js       # Main React component
│   │   ├── App.css      # CSS styles
│   ├── package.json     # Frontend dependencies
│   ├── node_modules/    # Frontend Node.js modules (ignored by .gitignore)
├── README.md            # Project documentation

```

### Workflow

1. **Upload Bill Image**: Upload a scanned image or photo of the bill.
2. **Add Names**: Input names of individuals for the split.
3. **Automatic Bill Interpretation**: The backend processes the bill image and extracts items and prices.
4. **Item Assignment and Editing**: Review and assign each item to one or more users. Edit item prices if needed or add missing items manually.
5. **Calculate Split**: Once all items are assigned, click "Calculate Split" to view each person's total.
