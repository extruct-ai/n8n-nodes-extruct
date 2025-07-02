# n8n-nodes-extruct

![Extruct AI Banner](icons/banner.png)

**n8n community node for Extruct AI**

This node lets you enrich and fetch company data from Extruct AI, right inside your n8n workflows.
Define your own table structure, add any custom columns, and get exactly the data you need.



## What is Extruct AI?

**Extruct AI** is a data enrichment platform that lets you create custom tables with any columns you want, and then enrich them with company data from the web and public sources.  

- **Any info you want:** Define your own columns — get emails, social links, funding, tech stack, or anything else.
- **No limits:** Works for any company, in any country, any industry.
- **Built for automation:** Integrate with CRMs, lead gen, analytics, and more.



## Features

- Add a company to your Extruct table and trigger enrichment
- Poll for enrichment completion automatically
- Instantly fetch the enriched row with all your custom columns
- Use in any n8n workflow



## Installation

Follow the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/) for installing custom nodes.



## Usage

1. **Create an Extruct table:**
   - You can start from a template table or create your own from scratch at [Extruct AI](https://extruct.ai).
   - Add any custom columns you need — you have full control over the table structure and fields.
2. **Get your Table ID:**
   - After creating the table, copy its Table ID from the Extruct dashboard, or simply grab it from the table page URL.
3. **Use in n8n:**
   - In the Extruct node, paste your Table ID.
   - Enter the company name or website you want to enrich:
     - You can type it manually in the node field,
     - Or pass it dynamically from a Form Trigger,
     - Or from any other node in your workflow — just connect it to the Extruct node.
   - Run the workflow — the node will add the company, trigger enrichment, and return the enriched data for your custom columns.



## Operations

### Enrich Company Info

- **Input:**  
  - Table ID (your Extruct table)
  - Company Input (website or name)
- **Output:**  
  - Returns a fully enriched row with all your custom columns as clean JSON, ready to use in your n8n workflow.

**How it works:**  
1. Adds a company to your Extruct table  
2. Triggers enrichment  
3. Waits for completion  
4. Returns the enriched row (with all your custom fields)



## Output
The node returns clean JSON with all enriched fields for the company, matching your custom table columns.



## Extruct Table Templates
Use these ready-to-go table templates for your n8n workflows:

- [Sales and Business Development](https://app.extruct.ai/tables/shared/jlcBdFwKXrC8uw21)  
  *Track leads, enrich company profiles, and automate sales research.*

- [Complete Startup Overview](https://app.extruct.ai/tables/shared/gQlqQK4pQgPDmk81)  
  *Get a 360° view of startups with funding, team, and product data.*

- [Social Enrichment](https://app.extruct.ai/tables/shared/VfGemEC1BujAIJx8)  
  *Enrich companies with social profiles, Twitter, LinkedIn, and more.*

Open a template, get the Table ID, and use it in your node.



## Credentials

- **Extruct API Token**  
  - Sign up at [extruct.ai](https://extruct.ai)
  - Get your API token from the dashboard
  - Add it as a credential in n8n



## Resources

- [Extruct AI website](https://extruct.ai)
- [n8n Community Nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Extruct AI API Docs](https://www.extruct.ai/docs/extruct-ai/product)



## Compatibility

- **n8n:** Tested with n8n v1.100.0