import { Redirect } from 'expo-router';

// This is the entry point of your app.
// It redirects to the welcome screen inside (auth) folder.
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
