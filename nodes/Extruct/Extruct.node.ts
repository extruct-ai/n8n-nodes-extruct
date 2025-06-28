import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeApiError } from 'n8n-workflow';

export class Extruct implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Extruct',
		name: 'extruct',
		icon: 'fa:building',
		group: ['transform'],
		version: 1,
		description: 'Add companies to Extruct tables and run enrichment',
		defaults: {
			name: 'Extruct',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'extructApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Enrich Company Info',
						value: 'enrichCompanyInfo',
						description: 'Add company to table, run enrichment, and return full table data',
						action: 'Enrich company info and return full table data',
					},
					{
						name: 'Get Table Data',
						value: 'getTableData',
						description: 'Get current data from table without adding new entries',
						action: 'Get current table data',
					},
				],
				default: 'enrichCompanyInfo',
			},
			{
				displayName: 'Table ID',
				name: 'tableId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the Extruct table',
				displayOptions: {
					show: {
						operation: ['enrichCompanyInfo', 'getTableData'],
					},
				},
			},
			{
				displayName: 'Company Input',
				name: 'companyInput',
				type: 'string',
				default: '',
				required: true,
				description: 'Company website or name to enrich',
				placeholder: 'example.com or Company Name',
				displayOptions: {
					show: {
						operation: ['enrichCompanyInfo'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get API credentials for authentication
		const credentials = await this.getCredentials('extructApi');
		const apiToken = credentials.apiToken as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const tableId = this.getNodeParameter('tableId', i) as string;

				let responseData;

				if (operation === 'enrichCompanyInfo') {
					const companyInput = this.getNodeParameter('companyInput', i) as string;
					const maxWaitTime = 300; // 5 minutes hardcoded timeout for enrichment

					// Step 1: Add company to table and start enrichment process
					// This API call adds a new row to the table and immediately starts the enrichment
					const addOptions = {
						method: 'POST' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}/rows`,
						headers: {
							Authorization: `Bearer ${apiToken}`,
							'Content-Type': 'application/json',
						},
						body: {
							rows: [
								{
									data: {
										input: companyInput, // Company website or name to enrich
									},
								},
							],
							run: true, // Start enrichment immediately after adding the row
						},
						json: true,
					};

					// Execute the API call to add company and start enrichment
					await this.helpers.request(addOptions);

					// Step 2: Poll for enrichment completion
					// Since enrichment is an asynchronous process, we need to wait for it to complete
					// We poll the table status every 10 seconds until enrichment is finished
					const startTime = Date.now();
					let isRunning = true;

					// Continue polling while enrichment is running and we haven't exceeded timeout
					while (isRunning && (Date.now() - startTime) < maxWaitTime * 1000) {
						// Wait 10 seconds before checking
						await new Promise(resolve => {
							const end = Date.now() + 10000;
							while (Date.now() < end) {
								// Simple delay implementation (busy wait)
							}
							resolve(undefined);
						});

						// Check current table status to see if enrichment is still running
						const statusOptions = {
							method: 'GET' as const,
							url: `https://api.extruct.ai/v1/tables/${tableId}`,
							headers: {
								Authorization: `Bearer ${apiToken}`,
								'Content-Type': 'application/json',
							},
							json: true,
						};

						// Get table status to check enrichment progress
						const statusResponse = await this.helpers.request(statusOptions);
						
						// If run_status is not 'running', enrichment has completed
						if (statusResponse.status?.run_status !== 'running') {
							isRunning = false;
						}
					}

					// If we've exceeded the timeout, throw an error
					if (isRunning) {
						throw new Error(`Enrichment did not complete within ${maxWaitTime} seconds. Please check your table status manually.`);
					}

					// Step 3: Retrieve the complete enriched table data
					// Now that enrichment is complete, get all data including the newly enriched company
					const dataOptions = {
						method: 'GET' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}/data`,
						headers: {
							Authorization: `Bearer ${apiToken}`,
							'Content-Type': 'application/json',
						},
						json: true,
					};

					// Get the final table data with all enriched information
					responseData = await this.helpers.request(dataOptions);

				} else if (operation === 'getTableData') {
					// Simple operation: just retrieve current table data without any enrichment
					const options = {
						method: 'GET' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}/data`,
						headers: {
							Authorization: `Bearer ${apiToken}`,
							'Content-Type': 'application/json',
						},
						json: true,
					};

					// Get current table data (no waiting required)
					responseData = await this.helpers.request(options);
				}

				// Add the response data to the return array
				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					// If continueOnFail is enabled, add error to output and continue processing other items
					returnData.push({ json: { error: error.message }, pairedItem: i });
				} else {
					// Otherwise, throw the error to stop execution
					throw new NodeApiError(this.getNode(), error);
				}
			}
		}

		return [returnData];
	}
}
