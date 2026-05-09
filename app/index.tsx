import SplashScreen from "@/components/SplashScreen";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return <SplashScreen onFinish={() => router.replace("/(auth)/welcome")} />;
}
