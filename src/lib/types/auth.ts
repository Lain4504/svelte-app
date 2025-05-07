// User role enums
export enum USER_ROLE_ENUM {
    USER = 'USER_ROLE_ENUM',
    ADMIN = 'ADMIN_ROLE_ENUM',
    AUTHOR = 'AUTHOR_ROLE_ENUM'
}

// Union type for user roles
export type UserRoles = string;

// API response types
export interface LoginResponse {
    username: string;
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    roles: UserRoles[];
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface AuthError {
    code?: string;
    message: string;
    status?: number;
}