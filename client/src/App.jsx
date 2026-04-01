import { Toaster } from 'react-hot-toast';
import { SocketProvider } from "./context/SocketContext";
import AppRouter from "./routes/AppRouter";
import ErrorBoundary from "./components/ui/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </SocketProvider>
    </ErrorBoundary>
  );
};

export default App;
