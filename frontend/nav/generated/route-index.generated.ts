/**
 * nav/generated/route-index.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-07-07
 */

import type { RouteNode } from '../types';
import { ROUTE_TREE, ALL_ROUTE_NODES } from './routes.generated';

export const routeById: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.id, node])
);

export const routeByPath: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.path, node])
);

const _segmentMap: Record<string, RouteNode[]> = {};
for (const node of ALL_ROUTE_NODES) {
  if (_segmentMap[node.segment]) {
    _segmentMap[node.segment].push(node);
  } else {
    _segmentMap[node.segment] = [node];
  }
}
export const routesBySegment: Readonly<Record<string, RouteNode[]>> = _segmentMap;

function buildParentMap(node: RouteNode, map: Map<string, RouteNode[]>): void {
  map.set(node.id, node.children);
  for (const child of node.children) buildParentMap(child, map);
}

const _parentMap = new Map<string, RouteNode[]>();
buildParentMap(ROUTE_TREE, _parentMap);
export const childrenById: Readonly<Map<string, RouteNode[]>> = _parentMap;

export const allRouteIds: readonly string[] = ALL_ROUTE_NODES.map((n) => n.id);
export const allStaticPaths: readonly string[] = ALL_ROUTE_NODES.filter((n) => !n.isDynamic).map((n) => n.path);
export const allDynamicRouteNodes: readonly RouteNode[] = ALL_ROUTE_NODES.filter((n) => n.isDynamic);
