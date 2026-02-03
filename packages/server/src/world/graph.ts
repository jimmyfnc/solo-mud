/**
 * Graph algorithms for world generation.
 */

import type { Rng } from '@solo-mud/shared';

/**
 * Create a random spanning tree connecting all nodes.
 * Guarantees all nodes are reachable from node 0.
 */
export function createSpanningTree(
  nodeCount: number,
  rng: Rng
): [number, number][] {
  const edges: [number, number][] = [];
  const connected = new Set<number>([0]);

  for (let i = 1; i < nodeCount; i++) {
    // Connect new node to a random existing connected node
    const connectedArray = Array.from(connected);
    const parent = rng.pick(connectedArray);
    edges.push([parent, i]);
    connected.add(i);
  }

  return edges;
}

/**
 * Add random edges to create loops/shortcuts.
 * Avoids duplicates and self-loops.
 */
export function addRandomEdges(
  nodeCount: number,
  existingEdges: [number, number][],
  count: number,
  rng: Rng
): [number, number][] {
  const result = [...existingEdges];

  // Track existing edges
  const edgeSet = new Set<string>();
  for (const [a, b] of existingEdges) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    edgeSet.add(key);
  }

  let added = 0;
  let attempts = 0;
  const maxAttempts = count * 10;

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const a = rng.nextInt(0, nodeCount - 1);
    const b = rng.nextInt(0, nodeCount - 1);

    if (a === b) continue; // No self-loops

    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) continue; // No duplicates

    edgeSet.add(key);
    result.push([a, b]);
    added++;
  }

  return result;
}

/**
 * Compute BFS depths and parent pointers from a start node.
 */
export function computeBfsDepths(
  adjacency: number[][],
  start: number
): { depths: number[]; parents: number[] } {
  const nodeCount = adjacency.length;
  const depths = new Array<number>(nodeCount).fill(-1);
  const parents = new Array<number>(nodeCount).fill(-1);

  depths[start] = 0;
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency[current];
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (depths[neighbor] === -1) {
        depths[neighbor] = depths[current]! + 1;
        parents[neighbor] = current;
        queue.push(neighbor);
      }
    }
  }

  return { depths, parents };
}

/**
 * Find the node with maximum depth.
 */
export function findFarthestNode(depths: number[]): number {
  let maxDepth = -1;
  let farthest = 0;

  for (let i = 0; i < depths.length; i++) {
    const depth = depths[i];
    if (depth !== undefined && depth > maxDepth) {
      maxDepth = depth;
      farthest = i;
    }
  }

  return farthest;
}

/**
 * Reconstruct path from start to goal using parent pointers.
 */
export function reconstructPath(
  parents: number[],
  start: number,
  goal: number
): number[] {
  const path: number[] = [];
  let current: number | undefined = goal;

  while (current !== undefined && current !== -1) {
    path.unshift(current);
    if (current === start) break;
    current = parents[current];
  }

  return path;
}

/**
 * Check if all nodes are reachable from start.
 */
export function isConnected(adjacency: number[][], start: number): boolean {
  const { depths } = computeBfsDepths(adjacency, start);
  return depths.every((d) => d !== -1);
}

/**
 * Build adjacency list from edge list.
 */
export function buildAdjacency(
  nodeCount: number,
  edges: [number, number][]
): number[][] {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [a, b] of edges) {
    adj[a]!.push(b);
    adj[b]!.push(a);
  }
  return adj;
}
