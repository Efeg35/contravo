'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma, User, UsersOnTeams } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '../../../lib/auth-helpers';

// User role type
type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

// Form validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
  department: z.string().optional(),
  departmentRole: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
  department: z.string().optional(),
  departmentRole: z.string().optional(),
});

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

// Helper function to verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

// Simple permission check - only check role
async function hasUserPermission(operation: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Simple role-based permissions
  switch (operation) {
    case 'users.create':
    case 'users.edit':
    case 'users.delete':
      return user.role === 'ADMIN';
    case 'users.view':
      return ['ADMIN', 'EDITOR', 'VIEWER'].includes(user.role);
    default:
      return false;
  }
}

export async function createUser(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check permissions
    const hasPermission = await hasUserPermission('users.create');
    if (!hasPermission) {
      throw new Error('Insufficient permissions to create users');
    }

    // Validate form data
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createUserSchema.parse(rawData);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        department: validatedData.department || null,
        departmentRole: validatedData.departmentRole || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentRole: true,
        createdAt: true,
      }
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true, user: newUser };

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check permissions
    const hasPermission = await hasUserPermission('users.edit');
    if (!hasPermission) {
      throw new Error('Insufficient permissions to edit users');
    }

    // Validate form data
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = updateUserSchema.parse(rawData);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is already taken by another user
    if (validatedData.email !== existingUser.email) {
      const emailTaken = await db.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailTaken) {
        throw new Error('Email is already taken by another user');
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        department: validatedData.department || null,
        departmentRole: validatedData.departmentRole || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentRole: true,
        updatedAt: true,
      }
    });

    revalidatePath('/dashboard/admin/users');
    revalidatePath(`/dashboard/admin/users/${userId}`);
    
    return { success: true, user: updatedUser };

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check permissions
    const hasPermission = await hasUserPermission('users.delete');
    if (!hasPermission) {
      throw new Error('Insufficient permissions to delete users');
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      throw new Error('You cannot delete your own account');
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        createdContracts: { select: { id: true } },
        createdCompanies: { select: { id: true } },
      }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if user has created critical data
    if (existingUser.createdContracts.length > 0) {
      throw new Error('Cannot delete user: User has created contracts');
    }

    if (existingUser.createdCompanies.length > 0) {
      throw new Error('Cannot delete user: User owns companies');
    }

    // Delete user
    await db.user.delete({
      where: { id: userId }
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true };

  } catch (error) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
  }
}

export async function getUserById(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Check permissions
    const hasPermission = await hasUserPermission('users.view');
    if (!hasPermission && currentUser.id !== userId) {
      throw new Error('Insufficient permissions to view user details');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentRole: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdContracts: true,
            createdCompanies: true,
            teams: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { success: true, user };

  } catch (error) {
    console.error('Error fetching user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    };
  }
}

export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Users can only change their own password unless they have admin permissions
    if (currentUser.id !== userId) {
      const hasPermission = await hasUserPermission('users.edit');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to change password');
      }
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For self-password change, verify current password
    if (currentUser.id === userId && user.password) {
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Error updating password:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update password'
    };
  }
} 