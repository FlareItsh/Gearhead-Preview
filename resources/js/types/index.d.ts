import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Discount {
    discount_id: number;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    valid_from: string | null;
    valid_to: string | null;
    is_active: boolean;
    applies_to: 'all' | 'specific_services';
    min_spend: number;
    services?: Service[];
    created_at: string;
    updated_at: string;
}

export interface Service {
    service_id: number;
    service_name: string;
    description: string;
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: number;
    user_id: number | null;
    name: string;
    comment: string;
    rating: number;
    is_displayed: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    loyaltyThreshold: number;
    activeDiscounts: Discount[];
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    user_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    phone_number?: string;
    address?: string;
    role: string;
    has_password: boolean;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    // Legacy compatibility - will be provided by the name accessor in PHP
    name?: string;
}
