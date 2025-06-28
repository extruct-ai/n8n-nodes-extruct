import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class TestNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Test Node',
		name: 'testNode',
		icon: 'fa:check',
		group: ['transform'],
		version: 1,
		description: 'Simple test node to verify custom node loading',
		defaults: {
			name: 'Test Node',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Test Message',
				name: 'message',
				type: 'string',
				default: 'Hello from custom node!',
				description: 'Test message to output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const message = this.getNodeParameter('message', i) as string;
			
			returnData.push({
				json: {
					message,
					timestamp: new Date().toISOString(),
					success: true,
				},
			});
		}

		return [returnData];
	}
} 