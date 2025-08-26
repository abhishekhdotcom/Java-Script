import z from "zod";

export const loginUserSchema = z.object({
  email: z
    .string()
    .email({ message: "Please Enter a valid email address!" })
    .trim()
    .max(100, { message: "Email must be no more than 100 characters!" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .max(100, { message: "Password must be no more then 100 characters!" }),
});

export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters long!" })
    .max(100, { message: "Name must be no more then 100 characters!" }),
  age: z
    .string()
    .transform((val, ctx) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        ctx.addIssue({
          message: "Age must be a valid number!",
        });
        return z.NEVER;
      }
      return parsed;
    })
    .pipe(z.number().min(18, { message: "Age must be at least 18!" })),
});

// Verify Email Link Token
export const verifyEmailTokenSchema = z.object({
  token: z.string().trim().length(8),
  email: z.string().trim().email(),
});
