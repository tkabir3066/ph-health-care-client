/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import z from "zod";
import { parse } from "cookie";
import { cookies } from "next/headers";

const loginValidationZodSchema = z.object({
  email: z.email({ error: "Email is required" }),
  password: z
    .string({ error: "Password is required" })
    .min(1, { error: "Password is required" })
    .min(6, {
      error: "Password must be at least 6 characters long",
    })
    .max(100, {
      error: "Password must be at most 100 characters long",
    }),
});
export const loginUser = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  let accessTokenObj: null | any = null;
  let refreshTokenObj: null | any = null;
  try {
    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    const validatedFields = loginValidationZodSchema.safeParse(loginData);
    console.log(validatedFields);

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
    const res = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const setCookieHeaders = res.headers.getSetCookie();
    // console.log(setCookieHeaders);
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie: string) => {
        // console.log(cookie, "forEach cookie");
        const parsedCookie = parse(cookie);

        if (parsedCookie.accessToken) {
          accessTokenObj = parsedCookie;
        }
        if (parsedCookie.refreshToken) {
          refreshTokenObj = parsedCookie;
        }
      });
    } else {
      throw new Error("No set-cookie header found");
    }

    const data = await res.json();

    if (!accessTokenObj) {
      throw new Error("Tokens not found in cookie");
    }

    if (!refreshTokenObj) {
      throw new Error("Tokens not found in cookie");
    }

    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessTokenObj.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: accessTokenObj.SameSite,
      path: accessTokenObj.Path || "/",
      maxAge: parseInt(accessTokenObj["Max-Age"]),
    });
    cookieStore.set("refreshToken", refreshTokenObj.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: refreshTokenObj.SameSite,
      path: refreshTokenObj.Path || "/",
      maxAge: parseInt(refreshTokenObj["Max-Age"]),
    });
    return data;
  } catch (error) {
    console.log(error);
    return { error: "Loin Failed" };
  }
};
