import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user || null;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
};
