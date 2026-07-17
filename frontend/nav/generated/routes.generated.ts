/**
 * nav/generated/routes.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-07-17
 */

import type { RouteNode } from '../types';

export const ROUTE_TREE: RouteNode = {
  id: 'dashboard',
  segment: 'dashboard',
  path: '/dashboard',
  isDynamic: false,
  isCatchAll: false,
  children: [
  {
    id: 'agencies',
    segment: 'agencies',
    path: '/dashboard/agencies',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
  {
    id: 'complaints',
    segment: 'complaints',
    path: '/dashboard/complaints',
    isDynamic: false,
    isCatchAll: false,
    children: [
      {
        id: 'complaints-new',
        segment: 'new',
        path: '/dashboard/complaints/new',
        isDynamic: false,
        isCatchAll: false,
        children: [],
      },
      {
        id: 'complaints-[id]',
        segment: '[id]',
        path: '/dashboard/complaints/[id]',
        isDynamic: true,
        isCatchAll: false,
        paramName: 'id',
        children: [
            {
              id: 'complaints-[id]-edit',
              segment: 'edit',
              path: '/dashboard/complaints/[id]/edit',
              isDynamic: false,
              isCatchAll: false,
              children: [],
            },
          ],
      },
    ],
  },
  {
    id: 'department',
    segment: 'department',
    path: '/dashboard/department',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
  {
    id: 'departments',
    segment: 'departments',
    path: '/dashboard/departments',
    isDynamic: false,
    isCatchAll: false,
    children: [
      {
        id: 'departments-create',
        segment: 'create',
        path: '/dashboard/departments/create',
        isDynamic: false,
        isCatchAll: false,
        children: [],
      },
      {
        id: 'departments-[id]',
        segment: '[id]',
        path: '/dashboard/departments/[id]',
        isDynamic: true,
        isCatchAll: false,
        paramName: 'id',
        children: [
            {
              id: 'departments-[id]-edit',
              segment: 'edit',
              path: '/dashboard/departments/[id]/edit',
              isDynamic: false,
              isCatchAll: false,
              children: [],
            },
          ],
      },
    ],
  },
  {
    id: 'notifications',
    segment: 'notifications',
    path: '/dashboard/notifications',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
  {
    id: 'officers',
    segment: 'officers',
    path: '/dashboard/officers',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
  {
    id: 'settings',
    segment: 'settings',
    path: '/dashboard/settings',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
  {
    id: 'tenders',
    segment: 'tenders',
    path: '/dashboard/tenders',
    isDynamic: false,
    isCatchAll: false,
    children: [],
  },
],
};

function flattenTree(node: RouteNode): RouteNode[] {
  return [node, ...node.children.flatMap((child) => flattenTree(child))];
}

export const ALL_ROUTE_NODES: readonly RouteNode[] = flattenTree(ROUTE_TREE);
