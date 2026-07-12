import type { NodeId } from './world';

export interface CraftingRequirement {
  baseId: string;
  quantity: number;
}

export interface MerchantRecipe {
  id: string;
  merchantId: string;
  outputBaseId: string;
  outputQuantity: number;
  targetStock: number;
  productionMinutes: number;
  inputs: CraftingRequirement[];
}

export interface WorkOrder {
  id: string;
  merchantId: string;
  materialBaseId: string;
  quantityRequested: number;
  quantityRemaining: number;
  unitPrice: number;
  createdAt: number;
  expiresAt: number;
  status: 'open' | 'fulfilled' | 'expired';
}

export interface ResourceNode {
  id: string;
  name: string;
  locationId: NodeId;
  materialBaseId: string;
  gatherVerb: 'gather' | 'mine' | 'harvest' | 'chop';
  quantity: number;
  maxQuantity: number;
  yieldPerGather: number;
  respawnMinutes: number;
  requiredToolTag?: string;
  lastGatheredAt?: number;
}

export interface EconomyState {
  workOrders: WorkOrder[];
  resourceNodes: Record<string, ResourceNode>;
  nextWorkOrderId: number;
  lastProcessedAt: number;
}
