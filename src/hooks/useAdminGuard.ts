import { useEffect } from "react";


export function useAdminGuard(router: { push: (path: string) => void }) {
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "ADMIN") {
          console.log("You are an admin");
        } else {
          console.log("You are not an admin");
          router.push("/");
        }
      } catch {
        console.log("Invalid user data");
        router.push("/");
      }
    } else {
      console.log("You are not an admin");
      router.push("/");
    }
  }, [router]);
}
