import { Redirect } from "expo-router";

export default function Index() {
  // App entry: redirect to the discover tab
  return <Redirect href="/(tabs)/discover" />;
}
