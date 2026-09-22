import { useCallback } from 'react';

export function useInitials() {
    return useCallback(
        (
            nameOrObject:
                | string
                | { first_name?: string; last_name?: string; name?: string },
        ): string => {
            // Handle different input types
            let firstName: string;
            let lastName: string;

            if (typeof nameOrObject === 'string') {
                // Legacy support for full name string
                const names = nameOrObject.trim().split(' ');
                if (names.length === 0) return '';
                if (names.length === 1) return names[0].charAt(0).toUpperCase();
                firstName = names[0];
                lastName = names[names.length - 1];
            } else {
                // Handle object with first_name and last_name properties
                if (nameOrObject.first_name && nameOrObject.last_name) {
                    firstName = nameOrObject.first_name;
                    lastName = nameOrObject.last_name;
                } else if (nameOrObject.name) {
                    // Fallback to name property if available
                    const names = nameOrObject.name.trim().split(' ');
                    if (names.length === 0) return '';
                    if (names.length === 1)
                        return names[0].charAt(0).toUpperCase();
                    firstName = names[0];
                    lastName = names[names.length - 1];
                } else {
                    return '';
                }
            }

            const firstInitial = firstName.charAt(0);
            const lastInitial = lastName.charAt(0);

            return `${firstInitial}${lastInitial}`.toUpperCase();
        },
        [],
    );
}
