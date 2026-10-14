import { usePathname } from './router';
import TerasApp from './TerasApp';

function normalize(path) {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

export default function App() {
  const { path, hash, navigate } = usePathname();
  return <TerasApp path={normalize(path)} hash={hash} navigate={navigate} />;
}
