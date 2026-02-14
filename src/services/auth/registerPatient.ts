/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import z from "zod";

const registerZodValidationZodSchema = z
  .object({
    name: z.string().min(1, {
      error: "Name is required",
    }),
    email: z.email({ error: "Email is required" }),
    address: z.string().optional(),
    password: z
      .string()
      .min(1, { error: "Password is required" })
      .min(6, {
        error: "Password must be at least 6 characters long",
      })
      .max(100, {
        error: "Password must be at most 100 characters long",
      }),
    confirmPassword: z
      .string()
      .min(1, { error: "Confirm Password is required" })
      .min(6, {
        error: "Confirm Password must be at least 6 characters long",
      })
      .max(100, {
        error: "Confirm Password must be at most 100 characters long",
      }),
  })
  .refine((data: any) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerPatient = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const validationData = {
      name: formData.get("name"),
      email: formData.get("email"),
      address: formData.get("address"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validatedFields =
      registerZodValidationZodSchema.safeParse(validationData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.issues.map((issue) => {
          return {
            field: issue.path[0],
            message: issue.message,
          };
        }),
      };
    }
    const registerData = {
      password: formData.get("password"),
      patient: {
        name: formData.get("name"),
        email: formData.get("email"),
        address: formData.get("address"),
      },
    };

    const newFormData = new FormData();
    newFormData.append("data", JSON.stringify(registerData));

    const res = await fetch(
      "http://localhost:5000/api/v1/user/create-patient",
      {
        method: "POST",
        body: newFormData,
      },
    );

    const data = await res.json();
    console.log(data);

    return data;
  } catch (error) {
    console.log(error);
    return { error: "Registration Failed" };
  }
};
