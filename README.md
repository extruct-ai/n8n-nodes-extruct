## Installation

### Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **n8n** - to install globally: `npm install -g n8n`

### Setup

1. **Clone and install:**
   ```bash
   cd n8n-nodes-extruct
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start n8n with custom extensions:**
   ```bash
   export N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-extruct"
   n8n
   ```

4. **Access n8n:**
   - Open http://localhost:5678
   - Create a new workflow
   - Search for "Extruct" in the nodes panel

## Operations

### Enrich Company Info
Adds a company to your Extruct table, runs enrichment, and returns the complete table data.

**Parameters:**
- **Table ID** (required): Your Extruct table identifier
- **Company Input** (required): Company website or name

**Output:** Complete table data including the newly enriched company

### Get Table Data
Retrieves current data from an Extruct table without adding new entries.

**Parameters:**
- **Table ID** (required): Your Extruct table identifier

**Output:** Current table data

## Credentials

### Extruct API

1. **Get your API token:**
   - Sign up at [Extruct](https://extruct.ai)
   - Navigate to the API page
   - Copy your Bearer token

2. **Configure in n8n:**
   - In the Extruct node, click "Create New Credential"
   - Select "Extruct API"
   - Enter your token
   - Test and save

## Development

### Project Structure
```
n8n-nodes-extruct/
├── credentials/          # API credentials
├── nodes/               # Node implementations
├── dist/                # Compiled files
└── package.json         # Configuration
```

### Adding Operations

1. Add operation to `properties` array
2. Implement logic in `execute` method
3. Rebuild and restart n8n

