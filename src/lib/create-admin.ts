import { auth } from "./auth";
import { prisma } from "./db";

async function main() {
  console.log("Creating admin user...");
  try {
    // 1. Delete existing admin to prevent duplicate errors
    await prisma.user.deleteMany({
      where: { email: "admin@eleave.local" }
    });
    
    // 2. Create the admin user using Better Auth API to handle password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@eleave.local",
        password: "Admin@123456",
        name: "ผู้ดูแลระบบ (Admin)",
        role: "ADMIN",
        position: "แอดมิน",
        isApproved: true,
      }
    });
    
    // 3. Double check and force role to ADMIN and isApproved to true in database
    await prisma.user.update({
      where: { email: "admin@eleave.local" },
      data: {
        role: "ADMIN",
        isApproved: true,
        emailVerified: true
      }
    });

    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin:", error);
  }
}

main();
