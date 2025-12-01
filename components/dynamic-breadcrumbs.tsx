"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/tailwind/ui/breadcrumb';

// Breadcrumb configuration matching your actual file structure
const breadcrumbConfig: Record<string, { 
  label: string; 
  parent?: { label: string; href: string }[];
}> = {
  '/dashboard': { label: 'Dashboard' },
  '/dashboard/posts': { label: 'Posts' },
  '/dashboard/posts/new': { 
    label: 'New Post',
    parent: [{ label: 'Posts', href: '/dashboard/posts' }]
  },
  '/dashboard/add-event': { label: 'Add Event' },
  '/dashboard/calendar': { label: 'Calendar' },
};

// Dynamic route patterns for your structure
const dynamicPatterns = [
  {
    pattern: /^\/dashboard\/posts\/([^\/]+)$/,
    getBreadcrumbs: (match: RegExpMatchArray) => [
      { label: 'Posts', href: '/dashboard/posts' },
      { label: 'View Post', href: match[0] }
    ]
  },
  {
    pattern: /^\/dashboard\/posts\/([^\/]+)\/edit$/,
    getBreadcrumbs: (match: RegExpMatchArray) => [
      { label: 'Posts', href: '/dashboard/posts' },
      { label: 'Edit Post', href: match[0] }
    ]
  },
  // For the main site routes (non-dashboard)
  {
    pattern: /^\/posts\/([^\/]+)$/,
    getBreadcrumbs: (match: RegExpMatchArray) => [
      { label: 'Posts', href: '/posts' },
      { label: 'View Post', href: match[0] }
    ]
  },
  {
    pattern: /^\/events$/,
    getBreadcrumbs: () => [
      { label: 'Events', href: '/events' }
    ]
  },
  {
    pattern: /^\/events\/([^\/]+)\/edit$/,
    getBreadcrumbs: (match: RegExpMatchArray) => [
      { label: 'Events', href: '/events' },
      { label: 'Edit Event', href: match[0] }
    ]
  },
];

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = () => {
    const breadcrumbs: { label: string; href: string }[] = [];
    
    // For dashboard routes, always start with Dashboard
    if (pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' });
    }
    
    // Check if we have a direct config for this path
    const directConfig = breadcrumbConfig[pathname];
    if (directConfig) {
      // Add parent breadcrumbs if they exist
      if (directConfig.parent) {
        breadcrumbs.push(...directConfig.parent);
      }
      // Only add the current page if it's not the dashboard root
      if (pathname !== '/dashboard') {
        breadcrumbs.push({ label: directConfig.label, href: pathname });
      }
      return breadcrumbs;
    }
    
    // Check dynamic patterns
    for (const { pattern, getBreadcrumbs } of dynamicPatterns) {
      const match = pathname.match(pattern);
      if (match) {
        // For dashboard routes, ensure we have the dashboard breadcrumb
        if (pathname.startsWith('/dashboard')) {
          const dynamicCrumbs = getBreadcrumbs(match);
          breadcrumbs.push(...dynamicCrumbs);
        } else {
          // For non-dashboard routes, just use the pattern breadcrumbs
          return getBreadcrumbs(match);
        }
        return breadcrumbs;
      }
    }
    
    // Fallback: generate breadcrumbs from path segments
    const segments = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Special handling for known segments
      let label = segment;
      
      // Format common segments
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard';
          break;
        case 'posts':
          label = 'Posts';
          break;
        case 'add-event':
          label = 'Add Event';
          break;
        case 'calendar':
          label = 'Calendar';
          break;
        case 'events':
          label = 'Events';
          break;
        case 'edit':
          label = 'Edit';
          break;
        case 'new':
          label = 'New';
          break;
        default:
          // For IDs (UUIDs, slugs), skip them in breadcrumbs
          if (segment.length > 20 || segment.match(/^[a-f0-9-]{36}$/)) {
            continue;
          }
          // Capitalize and format other segments
          label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }
      
      breadcrumbs.push({ label, href: currentPath });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs if we're on the dashboard home
  if (pathname === '/dashboard' && breadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}