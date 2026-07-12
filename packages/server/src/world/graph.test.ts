import { describe, it, expect } from 'vitest';
import { createRng } from '@solo-mud/shared';
import {
  createSpanningTree,
  addRandomEdges,
  computeBfsDepths,
  findFarthestNode,
  reconstructPath,
  isConnected,
  buildAdjacency,
} from './graph';

describe('graph utilities', () => {
  describe('createSpanningTree', () => {
    it('should connect all nodes', () => {
      const rng = createRng('spanning-test');
      const nodeCount = 10;
      const edges = createSpanningTree(nodeCount, rng);

      // Spanning tree has n-1 edges
      expect(edges.length).toBe(nodeCount - 1);

      // All nodes should be reachable from node 0
      const adj = buildAdjacency(nodeCount, edges);
      expect(isConnected(adj, 0)).toBe(true);
    });

    it('should be deterministic for same seed', () => {
      const edges1 = createSpanningTree(10, createRng('deterministic'));
      const edges2 = createSpanningTree(10, createRng('deterministic'));
      expect(edges1).toEqual(edges2);
    });
  });

  describe('addRandomEdges', () => {
    it('should add specified number of edges without duplicates', () => {
      const rng = createRng('extra-edges');
      const nodeCount = 10;
      const treeEdges = createSpanningTree(nodeCount, rng);
      const allEdges = addRandomEdges(nodeCount, treeEdges, 5, rng);

      expect(allEdges.length).toBe(treeEdges.length + 5);

      // Check no duplicates or self-loops
      const seen = new Set<string>();
      for (const [a, b] of allEdges) {
        expect(a).not.toBe(b); // No self-loops
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        expect(seen.has(key)).toBe(false); // No duplicates
        seen.add(key);
      }
    });
  });

  describe('computeBfsDepths', () => {
    it('should compute correct depths from start', () => {
      // Simple linear graph: 0 - 1 - 2 - 3
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      const { depths, parents } = computeBfsDepths(adj, 0);

      expect(depths[0]).toBe(0);
      expect(depths[1]).toBe(1);
      expect(depths[2]).toBe(2);
      expect(depths[3]).toBe(3);

      expect(parents[0]).toBe(-1);
      expect(parents[1]).toBe(0);
      expect(parents[2]).toBe(1);
      expect(parents[3]).toBe(2);
    });
  });

  describe('findFarthestNode', () => {
    it('should find the node with maximum depth', () => {
      // 0 - 1 - 2
      //       \
      //        3 - 4 - 5
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [1, 3],
        [3, 4],
        [4, 5],
      ];
      const adj = buildAdjacency(6, edges);
      const { depths } = computeBfsDepths(adj, 0);
      const farthest = findFarthestNode(depths);

      expect(farthest).toBe(5); // Depth 4: 0->1->3->4->5
    });
  });

  describe('reconstructPath', () => {
    it('should reconstruct path from start to goal', () => {
      const parents = [-1, 0, 1, 2, 3];
      const path = reconstructPath(parents, 0, 4);

      expect(path).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('isConnected', () => {
    it('should return true for connected graph', () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      expect(isConnected(adj, 0)).toBe(true);
    });

    it('should return false for disconnected graph', () => {
      const edges: [number, number][] = [
        [0, 1],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      expect(isConnected(adj, 0)).toBe(false);
    });
  });
});
