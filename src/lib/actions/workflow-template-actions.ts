'use server';

import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const FormSchema = z.object({
  templateId: z.string().min(1, { message: "Template ID is required."}),
  file: z.instanceof(File).refine(file => file.size > 0, 'File cannot be empty.'),
});

export async function saveTemplateFile(prevState: any, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    templateId: formData.get('templateId'),
    file: formData.get('file'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error: Please upload a valid file.',
    };
  }
  
  const { templateId, file } = validatedFields.data;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set in .env");
  }

  try {
    const filePath = `${templateId}/${file.name}-${Math.random().toString(36).substring(7)}`;
    const blob = await put(filePath, file, {
      access: 'public',
    });

    await db.workflowTemplate.update({
      where: { id: templateId },
      data: {
        templateFileUrl: blob.url,
        documentName: file.name, // Also save the original file name
      },
    });

    revalidatePath(`/dashboard/admin/workflows/${templateId}`);
    return { message: 'File uploaded successfully.', url: blob.url, success: true };

  } catch (error) {
    console.error('File upload error:', error);
    return { message: 'Server Error: Could not upload file.' };
  }
} 