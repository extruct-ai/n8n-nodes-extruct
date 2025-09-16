import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeApiError, sleep } from 'n8n-workflow';

export class Extruct implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Extruct AI',
		name: 'extruct',
		icon: 'file:Extruct-icon.svg',
		group: ['transform'],
		version: 1,
		description: 'Add companies to Extruct tables and run enrichment',
		defaults: {
			name: 'Extruct AI',
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


		for (let i = 0; i < items.length; i++) {
			try {
				const tableId = this.getNodeParameter('tableId', i) as string;
				const companyInput = this.getNodeParameter('companyInput', i) as string;
				const maxWaitTime = 900; // 15 minutes hardcoded timeout for enrichment

				// Step 1: Add company to table and start enrichment process
				const addOptions = {
					method: 'POST' as const,
					url: `https://api.extruct.ai/v1/tables/${tableId}/rows`,
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

				const addResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'extructApi', addOptions);
				// Get row_id from response
				const rowId = addResponse?.[0]?.id;
				if (!rowId) {
					throw new NodeApiError(this.getNode(), {
						message: 'Failed to get row_id from Extruct API response',
					});
				}

				// Step 2: Poll for enrichment completion
				const startTime = Date.now();
				let isRunning = true;

				while (isRunning && (Date.now() - startTime) < maxWaitTime * 1000) {
					await sleep(5000);

					const statusOptions = {
						method: 'GET' as const,
						url: `https://api.extruct.ai/v1/tables/${tableId}`,
						json: true,
					};

					const statusResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'extructApi', statusOptions);
					if (statusResponse.status?.run_status !== 'running') {
						isRunning = false;
					}
				}

				if (isRunning) {
					throw new NodeApiError(this.getNode(), {
						message: `Enrichment did not complete within ${maxWaitTime} seconds. Please check your table status manually.`,
					});
				}

				// Step 3: Get data by row_id
				const rowOptions = {
					method: 'GET' as const,
					url: `https://api.extruct.ai/v1/tables/${tableId}/rows/${rowId}`,
					json: true,
				};
				const rowResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'extructApi', rowOptions);
				returnData.push({ json: rowResponse, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					// If continueOnFail is enabled, add error to output and continue processing other items
					returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
				} else {
					// Otherwise, throw the error to stop execution
					throw new NodeApiError(this.getNode(), error);
				}
			}
		}

		return [returnData];
	}
}
