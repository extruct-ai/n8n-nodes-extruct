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
						name: 'Add Company & Enrich',
						value: 'addCompanyAndEnrich',
						description: 'Add company to table and run enrichment',
						action: 'Add company to table and run enrichment',
					},
					{
						name: 'Get Table Data',
						value: 'getTableData',
						description: 'Get all data from table',
						action: 'Get all data from table',
					},
				],
				default: 'addCompanyAndEnrich',
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
						operation: ['addCompanyAndEnrich', 'getTableData'],
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
						operation: ['addCompanyAndEnrich'],
					},
				},
			},
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for enrichment to complete',
				displayOptions: {
					show: {
						operation: ['addCompanyAndEnrich'],
					},
				},
			},
			{
				displayName: 'Max Wait Time (seconds)',
				name: 'maxWaitTime',
				type: 'number',
				default: 300,
				description: 'Maximum time to wait for enrichment completion',
				displayOptions: {
					show: {
						operation: ['addCompanyAndEnrich'],
						waitForCompletion: [true],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('extructApi');
		const apiToken = credentials.apiToken as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const tableId = this.getNodeParameter('tableId', i) as string;

				let responseData;

				if (operation === 'addCompanyAndEnrich') {
					const companyInput = this.getNodeParameter('companyInput', i) as string;
					const waitForCompletion = this.getNodeParameter('waitForCompletion', i) as boolean;
					const maxWaitTime = this.getNodeParameter('maxWaitTime', i) as number;

					// Step 1: Add company to table and start enrichment
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
										input: companyInput,
									},
								},
							],
							run: true, // Start enrichment immediately
						},
						json: true,
					};

					const addResponse = await this.helpers.request(addOptions);

					if (waitForCompletion) {
						// Step 2: Poll for completion
						const startTime = Date.now();
						let isRunning = true;

						while (isRunning && (Date.now() - startTime) < maxWaitTime * 1000) {
							// Wait 10 seconds before checking
							await new Promise(resolve => {
								const end = Date.now() + 10000;
								while (Date.now() < end) {
									// Simple delay
								}
								resolve(undefined);
							});

							// Check table status
							const statusOptions = {
								method: 'GET' as const,
								url: `https://api.extruct.ai/v1/tables/${tableId}`,
								headers: {
									Authorization: `Bearer ${apiToken}`,
									'Content-Type': 'application/json',
								},
								json: true,
							};

							const statusResponse = await this.helpers.request(statusOptions);
							
							if (statusResponse.status?.run_status !== 'running') {
								isRunning = false;
							}
						}

						if (isRunning) {
							throw new Error(`Enrichment did not complete within ${maxWaitTime} seconds`);
						}
					}

					// Step 3: Get final table data
					const dataOptions = {
						method: 'GET' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}/data`,
						headers: {
							Authorization: `Bearer ${apiToken}`,
							'Content-Type': 'application/json',
						},
						json: true,
					};

					responseData = await this.helpers.request(dataOptions);

				} else if (operation === 'getTableData') {
					// Get all data from table
					const options = {
						method: 'GET' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}/data`,
						headers: {
							Authorization: `Bearer ${apiToken}`,
							'Content-Type': 'application/json',
						},
						json: true,
					};

					responseData = await this.helpers.request(options);
				}

				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: i });
				} else {
					throw new NodeApiError(this.getNode(), error);
				}
			}
		}

		return [returnData];
	}
}
