/**
 * nav/generated/routes.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-07-07
 */

import type { RouteNode } from '../types';

export const ROUTE_TREE: RouteNode = {
  id: 'dashboard',
  segment: 'dashboard',
  path: '/dashboard',
  isDynamic: false,
  isCatchAll: false,
  children: [],
};

function flattenTree(node: RouteNode): RouteNode[] {
  return [node, ...node.children.flatMap((child) => flattenTree(child))];
}

export const ALL_ROUTE_NODES: readonly RouteNode[] = flattenTree(ROUTE_TREE);
