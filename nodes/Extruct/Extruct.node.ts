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
				displayName: 'Table ID',
				name: 'tableId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the Extruct table',
			},
			{
				displayName: 'Company Input',
				name: 'companyInput',
				type: 'string',
				default: '',
				required: true,
				description: 'Company website or name to enrich',
				placeholder: 'example.com or Company Name',
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
				const tableId = this.getNodeParameter('tableId', i) as string;
				const companyInput = this.getNodeParameter('companyInput', i) as string;
				const maxWaitTime = 300; // 5 minutes hardcoded timeout for enrichment

				// Step 1: Add company to table and start enrichment process
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
						run: true,
					},
					json: true,
				};

				await this.helpers.request(addOptions);

				// Step 2: Poll for enrichment completion
				const startTime = Date.now();
				let isRunning = true;

				while (isRunning && (Date.now() - startTime) < maxWaitTime * 1000) {
					await new Promise(resolve => {
						const end = Date.now() + 10000;
						while (Date.now() < end) {}
						resolve(undefined);
					});

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
					throw new Error(`Enrichment did not complete within ${maxWaitTime} seconds. Please check your table status manually.`);
				}

				const dataOptions = {
					method: 'GET' as const,
					url: `https://api.extruct.ai/v1/tables/${tableId}/data`,
					headers: {
						Authorization: `Bearer ${apiToken}`,
						'Content-Type': 'application/json',
					},
					json: true,
				};

				const responseData = await this.helpers.request(dataOptions);
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
