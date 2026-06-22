import FridgeChef from "@/components/fridge-chef";
import { ProfileAuthGate } from "@/components/profile-auth";
import { ProfileProvider } from "@/components/profile-provider";

export default function Home() {
  return (
    <ProfileProvider>
      <ProfileAuthGate>
        <FridgeChef />
      </ProfileAuthGate>
    </ProfileProvider>
  );
}
